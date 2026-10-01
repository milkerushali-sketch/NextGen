import express from "express";
import { requireAuth } from "./authMiddleware.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

export function agentRouter({ pool }) {
  const router = express.Router();

  router.post("/query", async (req, res) => {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/agent/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: req.body?.message,
          user_id: req.auth?.userId || null,
          email: req.auth?.email || req.body?.email || "guest",
          context: req.body?.context || {},
        }),
      });
      const payload = await response.json();
      if (!response.ok) return res.status(response.status).json(payload);
      return res.json(payload);
    } catch (error) {
      return res.status(502).json({
        message: "AI service is unavailable",
        error: error.message,
      });
    }
  });

  router.get("/tickets", requireAuth, async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, subject, status, priority, created_at AS "createdAt",
              updated_at AS "updatedAt"
       FROM support_tickets WHERE user_email = $1 ORDER BY created_at DESC`,
      [req.auth.email],
    );
    return res.json(rows);
  });

  router.post("/tickets", requireAuth, async (req, res) => {
    const { subject, description, priority = "normal" } = req.body || {};
    if (!subject || !description) {
      return res
        .status(400)
        .json({ message: "Subject and description are required" });
    }
    const { rows } = await pool.query(
      `INSERT INTO support_tickets (user_email, subject, description, priority)
       VALUES ($1, $2, $3, $4)
       RETURNING id, subject, description, status, priority,
                 created_at AS "createdAt"`,
      [req.auth.email, subject, description, priority],
    );
    return res.status(201).json(rows[0]);
  });

  return router;
}

