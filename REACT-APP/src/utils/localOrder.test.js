import test from "node:test";
import assert from "node:assert/strict";
import { createLocalOrder } from "./localOrder.js";

test("createLocalOrder returns a valid order object", () => {
  const order = createLocalOrder(
    [{ id: 1, name: "Aero X Headphones", price: 249, quantity: 1 }],
    249,
  );

  assert.equal(order.status, "processing");
  assert.equal(order.items[0].name, "Aero X Headphones");
  assert.ok(order.id.startsWith("DEMO-"));
  assert.equal(order.total, 249);
});
