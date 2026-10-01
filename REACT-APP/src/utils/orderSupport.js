const classifyOrderIntent = (message) => {
  const text = String(message || "");
  if (/\b(cancel|cancellation)\b/i.test(text)) return "cancel_request";
  if (/\b(return|exchange)\b/i.test(text)) return "return_request";
  if (/\b(request|want|need|start|submit).{0,24}\brefund\b/i.test(text)) {
    return "refund_request";
  }
  if (/\b(refund|payment)\b/i.test(text)) return "refund_status";
  if (/\b(track|tracking|order status|delivery status|shipment)\b/i.test(text)) {
    return "order_status";
  }
  return null;
};

const intentMessage = (intent, orderId) => {
  const messages = {
    cancel_request: `Please cancel my order #${orderId}`,
    return_request: `I want to return my order #${orderId}`,
    refund_request: `I want a refund for my order #${orderId}`,
    refund_status: `Check refund status for order #${orderId}`,
    order_status: `Track order #${orderId}`,
  };
  return messages[intent];
};

export const resolveOrderFollowup = (message, previousUserMessage = "") => {
  const input = String(message || "").trim();
  const intent = classifyOrderIntent(input) || classifyOrderIntent(previousUserMessage);
  const demoMatch = input.match(/\b(DEMO-\d{1,16})\b/i);
  const numericMatch = input.match(
    /^(?:order\s*(?:(?:id|number)\s*)?(?:is\s*)?[:#-]?\s*)?#?\s*(\d{1,12})\s*$/i,
  ) || input.match(/\border\s*(?:(?:id|number)\s*)?(?:is\s*)?[:#-]?\s*#?\s*(\d{1,12})\b/i);
  const rawOrderId = demoMatch?.[1] || numericMatch?.[1];

  if (!intent || !rawOrderId) {
    return { message: input, orderId: null, demoOrderId: null };
  }

  if (demoMatch) {
    return {
      message: intentMessage(intent, rawOrderId),
      orderId: null,
      demoOrderId: rawOrderId.toUpperCase(),
    };
  }

  return {
    message: intentMessage(intent, rawOrderId),
    orderId: Number(rawOrderId),
    demoOrderId: null,
  };
};

const getOrderDetails = (order) => ({
  id: order.id,
  status: order.status || "unknown",
  total: Number(order.total || 0),
  createdAt: order.createdAt,
  deliveryStatus: order.deliveryStatus || "not available",
  trackingId: order.trackingId || null,
  carrier: order.carrier || null,
  expectedDelivery: order.expectedDelivery || null,
  paymentStatus: order.paymentStatus || "not available",
  refundStatus: order.refundStatus || "none recorded",
  returnStatus: order.returnStatus || null,
});

const requestActionLabel = {
  cancel_request: "cancellation",
  return_request: "return",
  refund_request: "refund",
};

export const handleLocalDemoOrderRequest = ({
  demoOrderId,
  message,
  confirmedAction,
  orders,
}) => {
  if (!demoOrderId) return null;

  const orderIndex = orders.findIndex(
    (order) => String(order.id).toUpperCase() === demoOrderId.toUpperCase(),
  );
  if (orderIndex < 0) {
    return {
      orders,
      message: `I couldn't find demo order #${demoOrderId} in this browser's saved orders.`,
    };
  }

  const order = orders[orderIndex];
  const intent = confirmedAction || classifyOrderIntent(message) || "order_status";
  const orderDetails = getOrderDetails(order);

  if (intent === "refund_status" || intent === "order_status") {
    return {
      orders,
      orderDetails,
      message:
        `Order #${order.id} status: ${orderDetails.status}. ` +
        `Shipment: ${orderDetails.deliveryStatus}. ` +
        `Tracking ID: ${orderDetails.trackingId || "not available"}. ` +
        `Payment: ${orderDetails.paymentStatus}. ` +
        `Refund: ${orderDetails.refundStatus}.`,
    };
  }

  if (!confirmedAction) {
    return {
      orders,
      orderDetails,
      pendingAction: intent,
      message:
        `I found demo order #${order.id} (status: ${orderDetails.status}). ` +
        `Confirm below to submit a ${requestActionLabel[intent]} request. ` +
        "This is a local demo action and will not contact a payment provider or support team.",
    };
  }

  const nextOrder = { ...order };
  if (intent === "cancel_request") {
    if (order.status === "cancelled") {
      return {
        orders,
        orderDetails,
        message: `Demo order #${order.id} is already cancelled. Payment status: ${orderDetails.paymentStatus}; refund status: ${orderDetails.refundStatus}.`,
      };
    }
    if (/shipped|in transit|out for delivery|delivered/i.test(order.deliveryStatus || "")) {
      return {
        orders,
        orderDetails,
        message: `Demo order #${order.id} has already shipped, so it cannot be cancelled here. Its current status is ${order.status}.`,
      };
    }
    nextOrder.status = "cancelled";
    nextOrder.deliveryStatus = "Cancelled";
    nextOrder.cancelledAt = new Date().toISOString();
  } else if (intent === "return_request") {
    nextOrder.returnStatus = "requested";
  } else if (intent === "refund_request") {
    nextOrder.refundStatus = "requested";
  }

  const nextOrders = orders.map((item, index) =>
    index === orderIndex ? nextOrder : item,
  );
  const updatedDetails = getOrderDetails(nextOrder);
  const completionMessage = {
    cancel_request:
      `Demo order #${order.id} is cancelled locally. Payment is ${updatedDetails.paymentStatus}; no refund was processed.`,
    return_request:
      `A return request for demo order #${order.id} was saved locally. It was not sent to a real support team.`,
    refund_request:
      `A refund request for demo order #${order.id} was saved locally. No payment-provider refund was processed.`,
  };

  return {
    orders: nextOrders,
    orderDetails: updatedDetails,
    message: completionMessage[intent] || `Demo order #${order.id} status: ${updatedDetails.status}.`,
  };
};
