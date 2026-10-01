export const getLocalOrders = () => {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem("novacart-local-orders");
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveLocalOrders = (orders) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("novacart-local-orders", JSON.stringify(orders));
};

export const createLocalOrder = (items, total) => {
  const createdAt = new Date().toISOString();
  const orderId = `DEMO-${Date.now()}`;

  return {
    id: orderId,
    status: "processing",
    total: Number(total || 0),
    createdAt,
    deliveryStatus: "Packed",
    trackingId: `TRK-${orderId.slice(-6)}`,
    carrier: "NovaCart Dispatch",
    expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: "pending",
    refundStatus: null,
    items: items.map((item) => ({
      productId: item.id,
      name: item.name,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
    })),
  };
};
