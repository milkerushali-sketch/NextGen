import express from "express";
import { optionalAuth, requireCustomer } from "./authMiddleware.js";
import { requestAiAgent } from "./agentClient.js";

const toSafeInteger = (value) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
};

export function agentRouter({ pool }) {
  const router = express.Router();

  router.post("/query", optionalAuth, async (req, res) => {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ message: "A message is required." });
    try {
      const result = await requestAiAgent({
        message,
        orderId: req.body?.orderId,
        customer: req.auth,
        confirmedProductId: req.body?.confirmedProductId,
        quantity: req.body?.quantity,
      });
      return res.json(result);
    } catch (error) {
      console.error("AI agent request failed:", error.message);
      return res.status(502).json({ message: "The support assistant is temporarily unavailable." });
    }
  });

  router.get("/cart", requireCustomer, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT ci.product_id AS id, ci.quantity, p.name, p.category, p.price,
                p.rating, p.image, p.description, p.stock_quantity AS "stockQuantity"
         FROM carts c
         JOIN cart_items ci ON ci.cart_id = c.id
         JOIN products p ON p.id = ci.product_id
         WHERE c.customer_id = $1 ORDER BY ci.created_at`,
        [req.auth.userId],
      );
      return res.json({ items: rows });
    } catch (error) {
      console.error("Cart lookup failed:", error.message);
      return res.status(500).json({ message: "Unable to load your cart." });
    }
  });

  router.post("/cart/add", requireCustomer, async (req, res) => {
    const productId = toSafeInteger(req.body?.productId ?? req.body?.product?.id ?? req.body?.product?._id);
    const quantity = Number(req.body?.quantity ?? 1);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ message: "A valid product and quantity (1–20) are required." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: products } = await client.query(
        "SELECT id, name, stock_quantity FROM products WHERE id = $1 FOR UPDATE",
        [productId],
      );
      const product = products[0];
      if (!product) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Product not found." });
      }
      const { rows: existingItems } = await client.query(
        `SELECT ci.quantity FROM carts c
         JOIN cart_items ci ON ci.cart_id = c.id
         WHERE c.customer_id = $1 AND ci.product_id = $2`,
        [req.auth.userId, productId],
      );
      const nextQuantity = Number(existingItems[0]?.quantity || 0) + quantity;
      if (nextQuantity > 20) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "A cart item cannot exceed 20 units." });
      }
      if (product.stock_quantity !== null && nextQuantity > product.stock_quantity) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "There is not enough stock for that quantity." });
      }

      const { rows: carts } = await client.query(
        `INSERT INTO carts (customer_id) VALUES ($1)
         ON CONFLICT (customer_id) DO UPDATE SET updated_at = NOW()
         RETURNING id`,
        [req.auth.userId],
      );
      await client.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (cart_id, product_id)
         DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()`,
        [carts[0].id, productId, nextQuantity],
      );
      await client.query("COMMIT");
      return res.status(200).json({ message: "Product added to your cart.", productId, quantity: nextQuantity });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Cart update failed:", error.message);
      return res.status(500).json({ message: "Unable to update your cart." });
    } finally {
      client.release();
    }
  });

  router.get("/orders", requireCustomer, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT o.id, o.status, o.total, o.created_at AS "createdAt",
                d.status AS "deliveryStatus", d.tracking_id AS "trackingId",
                d.carrier, d.expected_delivery AS "expectedDelivery",
                p.status AS "paymentStatus", p.refund_status AS "refundStatus",
                COALESCE(json_agg(json_build_object(
                  'productId', oi.product_id, 'name', oi.product_name,
                  'price', oi.unit_price, 'quantity', oi.quantity
                )) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
         FROM orders o
         LEFT JOIN deliveries d ON d.order_id = o.id
         LEFT JOIN payments p ON p.order_id = o.id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.customer_id = $1
         GROUP BY o.id, d.id, p.id
         ORDER BY o.created_at DESC`,
        [req.auth.userId],
      );
      return res.json(rows);
    } catch (error) {
      console.error("Order list failed:", error.message);
      return res.status(500).json({ message: "Unable to load your orders." });
    }
  });

  router.get("/orders/:orderId", requireCustomer, async (req, res) => {
    const orderId = toSafeInteger(req.params.orderId);
    if (!orderId) return res.status(400).json({ message: "Invalid order number." });
    try {
      const { rows } = await pool.query(
        `SELECT o.id, o.status, o.total, o.created_at AS "createdAt",
                d.status AS "deliveryStatus", d.tracking_id AS "trackingId",
                d.carrier, d.expected_delivery AS "expectedDelivery",
                p.status AS "paymentStatus", p.refund_status AS "refundStatus",
                COALESCE(json_agg(json_build_object(
                  'productId', oi.product_id, 'name', oi.product_name,
                  'price', oi.unit_price, 'quantity', oi.quantity
                )) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
         FROM orders o
         LEFT JOIN deliveries d ON d.order_id = o.id
         LEFT JOIN payments p ON p.order_id = o.id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.id = $1 AND o.customer_id = $2
         GROUP BY o.id, d.id, p.id`,
        [orderId, req.auth.userId],
      );
      if (!rows[0]) return res.status(404).json({ message: "Order not found." });
      return res.json(rows[0]);
    } catch (error) {
      console.error("Order lookup failed:", error.message);
      return res.status(500).json({ message: "Unable to load that order." });
    }
  });

  router.post("/orders", requireCustomer, async (req, res) => {
    const items = req.body?.items;
    if (!Array.isArray(items) || items.length < 1 || items.length > 30) {
      return res.status(400).json({ message: "Provide between 1 and 30 cart items." });
    }
    const quantities = new Map();
    for (const item of items) {
      const productId = toSafeInteger(item?.productId ?? item?.id);
      const quantity = Number(item?.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return res.status(400).json({ message: "Each item needs a valid product and quantity (1–20)." });
      }
      quantities.set(productId, (quantities.get(productId) || 0) + quantity);
    }
    if ([...quantities.values()].some((quantity) => quantity > 20)) {
      return res.status(400).json({ message: "A cart item cannot exceed 20 units." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const ids = [...quantities.keys()];
      const { rows: products } = await client.query(
        "SELECT id, name, price, stock_quantity FROM products WHERE id = ANY($1::int[]) FOR UPDATE",
        [ids],
      );
      if (products.length !== ids.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "One or more products are no longer available." });
      }
      for (const product of products) {
        if (product.stock_quantity !== null && quantities.get(product.id) > product.stock_quantity) {
          await client.query("ROLLBACK");
          return res.status(409).json({ message: `${product.name} does not have enough stock.` });
        }
      }
      const subtotal = products.reduce(
        (sum, product) => sum + Number(product.price) * quantities.get(product.id),
        0,
      );
      const total = subtotal * 1.08;
      const { rows: orders } = await client.query(
        `INSERT INTO orders (customer_id, status, total)
         VALUES ($1, 'processing', $2) RETURNING id, status, total, created_at AS "createdAt"`,
        [req.auth.userId, total.toFixed(2)],
      );
      const order = orders[0];
      for (const product of products) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, product.id, product.name, product.price, quantities.get(product.id)],
        );
      }
      await client.query(
        "INSERT INTO payments (order_id, status, amount) VALUES ($1, 'pending', $2)",
        [order.id, total.toFixed(2)],
      );
      await client.query(
        "INSERT INTO deliveries (order_id, status) VALUES ($1, 'not_shipped')",
        [order.id],
      );
      await client.query(
        `DELETE FROM cart_items WHERE cart_id IN
         (SELECT id FROM carts WHERE customer_id = $1)`,
        [req.auth.userId],
      );
      await client.query("COMMIT");
      return res.status(201).json({ ...order, paymentStatus: "pending", message: "Order created. Complete payment through the secure checkout provider." });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Order creation failed:", error.message);
      return res.status(500).json({ message: "Unable to place your order." });
    } finally {
      client.release();
    }
  });

  router.get("/tickets", requireCustomer, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, subject, description, category, status, priority,
                order_id AS "orderId", created_at AS "createdAt",
                updated_at AS "updatedAt"
         FROM support_tickets WHERE customer_id = $1 ORDER BY created_at DESC`,
        [req.auth.userId],
      );
      return res.json(rows);
    } catch (error) {
      console.error("Ticket list failed:", error.message);
      return res.status(500).json({ message: "Unable to load your support tickets." });
    }
  });

  router.get("/tickets/:ticketId", requireCustomer, async (req, res) => {
    const ticketId = toSafeInteger(req.params.ticketId);
    if (!ticketId) return res.status(400).json({ message: "Invalid ticket number." });
    try {
      const { rows } = await pool.query(
        `SELECT id, subject, description, category, status, priority,
                order_id AS "orderId", created_at AS "createdAt",
                updated_at AS "updatedAt"
         FROM support_tickets WHERE id = $1 AND customer_id = $2`,
        [ticketId, req.auth.userId],
      );
      if (!rows[0]) return res.status(404).json({ message: "Ticket not found." });
      return res.json(rows[0]);
    } catch (error) {
      console.error("Ticket lookup failed:", error.message);
      return res.status(500).json({ message: "Unable to load that ticket." });
    }
  });

  router.post("/tickets", requireCustomer, async (req, res) => {
    const subject = String(req.body?.subject || "").trim().slice(0, 200);
    const description = String(req.body?.description || "").trim().slice(0, 5000);
    const category = String(req.body?.category || "general_complaint").slice(0, 100);
    const priority = ["low", "medium", "high", "critical"].includes(req.body?.priority)
      ? req.body.priority
      : "medium";
    const orderId = req.body?.orderId ? toSafeInteger(req.body.orderId) : null;
    if (!subject || !description) {
      return res.status(400).json({ message: "Subject and description are required." });
    }
    try {
      if (req.body?.orderId && !orderId) {
        return res.status(400).json({ message: "Invalid order number." });
      }
      if (orderId) {
        const ownedOrder = await pool.query(
          "SELECT id FROM orders WHERE id = $1 AND customer_id = $2",
          [orderId, req.auth.userId],
        );
        if (!ownedOrder.rowCount) return res.status(404).json({ message: "Order not found." });
      }
      const { rows } = await pool.query(
        `INSERT INTO support_tickets
          (user_email, customer_id, subject, description, category, priority, order_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, subject, description, category, status, priority,
                   order_id AS "orderId", created_at AS "createdAt"`,
        [req.auth.email, req.auth.userId, subject, description, category, priority, orderId],
      );
      return res.status(201).json(rows[0]);
    } catch (error) {
      console.error("Ticket creation failed:", error.message);
      return res.status(500).json({ message: "Unable to create your support ticket." });
    }
  });

  return router;
}
