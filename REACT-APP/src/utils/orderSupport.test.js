import test from "node:test";
import assert from "node:assert/strict";
import {
  handleLocalDemoOrderRequest,
  resolveOrderFollowup,
} from "./orderSupport.js";

const demoOrder = {
  id: "DEMO-1790850668727",
  status: "processing",
  total: 214.92,
  deliveryStatus: "Packed",
  trackingId: "TRK-668727",
  paymentStatus: "pending",
  refundStatus: null,
  items: [],
};

test("resolves a demo order ID using the previous cancellation intent", () => {
  assert.deepEqual(
    resolveOrderFollowup("#DEMO-1790850668727", "Cancel Order"),
    {
      message: "Please cancel my order #DEMO-1790850668727",
      orderId: null,
      demoOrderId: "DEMO-1790850668727",
    },
  );
});

test("passes a numeric order ID and prior refund status intent to the API", () => {
  assert.deepEqual(resolveOrderFollowup("123", "Refund Query"), {
    message: "Check refund status for order #123",
    orderId: 123,
    demoOrderId: null,
  });
});

test("refund status is reported without changing the saved order", () => {
  const result = handleLocalDemoOrderRequest({
    demoOrderId: demoOrder.id,
    message: "Check refund status for order #DEMO-1790850668727",
    orders: [demoOrder],
  });

  assert.match(result.message, /Payment: pending/);
  assert.match(result.message, /Refund: none recorded/);
  assert.equal(result.orders[0].status, "processing");
});

test("demo cancellation requires confirmation and then updates local status", () => {
  const pending = handleLocalDemoOrderRequest({
    demoOrderId: demoOrder.id,
    message: "Please cancel my order #DEMO-1790850668727",
    orders: [demoOrder],
  });

  assert.equal(pending.pendingAction, "cancel_request");
  assert.equal(pending.orders[0].status, "processing");

  const confirmed = handleLocalDemoOrderRequest({
    demoOrderId: demoOrder.id,
    message: "Please confirm and submit my request to cancel my order #DEMO-1790850668727",
    confirmedAction: "cancel_request",
    orders: [demoOrder],
  });

  assert.equal(confirmed.orders[0].status, "cancelled");
  assert.equal(confirmed.orderDetails.deliveryStatus, "Cancelled");
  assert.match(confirmed.message, /no refund was processed/i);
});

test("demo return confirmation records and exposes the return status", () => {
  const result = handleLocalDemoOrderRequest({
    demoOrderId: demoOrder.id,
    message: "Please confirm and submit my request to return my order #DEMO-1790850668727",
    confirmedAction: "return_request",
    orders: [demoOrder],
  });

  assert.equal(result.orderDetails.returnStatus, "requested");
  assert.equal(result.orders[0].status, "processing");
  assert.match(result.message, /saved locally/i);
});
