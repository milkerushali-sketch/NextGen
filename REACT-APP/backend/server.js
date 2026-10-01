import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assistantRouter } from "./assistant.js";
import { agentRouter } from "./agentRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = Number(process.env.PORT) || 5000;
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@127.0.0.1:5432/novacart",
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const frontendUrl = process.env.FRONTEND_URL || "";
app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || !frontendUrl || origin === frontendUrl || true),
    credentials: true,
  }),
);
app.use(express.json());

const toProduct = (row) => ({ ...row, _id: String(row.id), id: row.id });

const initDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      category VARCHAR(100) NOT NULL,
      price NUMERIC(12,2) NOT NULL,
      rating NUMERIC(2,1) NOT NULL DEFAULT 4.5,
      image TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      reviews INTEGER NOT NULL DEFAULT 0,
      old_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      tags TEXT[] NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_email VARCHAR(255) NOT NULL,
      user_name VARCHAR(80) NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      text VARCHAR(1000) NOT NULL,
      image_url VARCHAR(500) NOT NULL DEFAULT '',
      verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON reviews(product_id);
    CREATE TABLE IF NOT EXISTS chats (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(120),
      user_email VARCHAR(255) NOT NULL DEFAULT 'guest',
      query TEXT NOT NULL,
      response TEXT NOT NULL DEFAULT '',
      intent VARCHAR(80) NOT NULL DEFAULT 'shopping-help',
      recommendations JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS support_tickets (
      id SERIAL PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      subject VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'open',
      priority VARCHAR(20) NOT NULL DEFAULT 'normal',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS support_tickets_user_email_idx
      ON support_tickets(user_email);
  `);
};

const seedUsers = async () => {
  const password = await bcrypt.hash("admin123", 10);
  await pool.query(
    `INSERT INTO users (name, email, password) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING`,
    ["Nova Admin", "admin@novacart.com", password],
  );
};

const parseCsvRow = (line) => {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.replace(/^\s+|\s+$/g, "").replace(/""/g, '"'));
};

const parseArchiveProducts = async () => {
  const archiveDir = path.join(__dirname, "..", "archive");
  const files = (await fs.readdir(archiveDir))
    .filter((file) => file.toLowerCase().endsWith(".csv") && file.toLowerCase() !== "combined_dataset.csv")
    .sort();

  const rows = [];

  for (const file of files) {
    const filePath = path.join(archiveDir, file);
    const content = await fs.readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) continue;

    const headers = parseCsvRow(lines[0]).map((header) => header.trim().toLowerCase().replace(/\s+/g, "_"));

    for (let i = 1; i < lines.length; i += 1) {
      const values = parseCsvRow(lines[i]);
      const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));

      if (!row.title && !row.product_id && !row.product_description) continue;
      if (!row.final_price && !row.initial_price && !row.price) continue;

      rows.push({
        fileName: file,
        ...row,
      });
    }
  }

  return rows;
};

const safeNumber = (value, fallback = 0) => {
  const numeric = Number(String(value || "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(numeric) ? numeric : fallback;
};

const buildProductSeed = async () => {
  const staticProducts = [
    ["Aero X Headphones", "Audio", 249, 4.8, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80", "Immersive wireless headphones with a comfortable premium fit.", 151],
    ["Nova Smartwatch", "Wearables", 199, 4.7, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80", "A sleek smartwatch for everyday activity and notifications.", 128],
    ["Beam Pro Speaker", "Smart Devices", 179, 4.6, "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80", "Room-filling sound in a compact, modern design.", 84],
    ["Orbit Laptop Stand", "Workspace", 99, 4.8, "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80", "An ergonomic aluminum stand for a cleaner desk setup.", 96],
    ["Pulse Earbuds", "Audio", 159, 4.5, "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80", "Compact wireless earbuds with clear sound for daily listening.", 112],
    ["Glow Desk Lamp", "Workspace", 89, 4.7, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80", "Warm adjustable lighting for work, reading, and relaxing.", 63],
  ];

  try {
    const archiveRows = await parseArchiveProducts();
    const datasetProducts = archiveRows
      .map((row) => {
        const title = (row.title || row.product_name || row.name || "Untitled Product").trim();
        const category = (row.category || row.breadcrumbs || row.fileName || "General").trim();
        const price = safeNumber(row.final_price || row.price || row.initial_price, 0);
        const oldPrice = safeNumber(row.initial_price || row.final_price || row.price, price);
        const rating = Math.min(5, Math.max(1, safeNumber(row.rating, 4.4)));
        const reviews = Math.max(0, Math.round(safeNumber(row.ratings_count, 50)));
        const images = String(row.images || "").split(",").map((item) => item.trim().replace(/^"|"$/g, "")).filter(Boolean);
        const description = (row.product_description || row.product_details || row.description || "Popular catalog find").trim();
        const tags = [category, title, row.seller_name || "", row.product_details || ""]
          .flatMap((value) => String(value).split(/\s+/))
          .filter((tag) => tag && tag.length > 2)
          .slice(0, 8);

        if (!title || !price) return null;

        return [
          title,
          category || "General",
          Number(price.toFixed(2)),
          Number(rating.toFixed(1)),
          images[0] || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
          description.length > 400 ? `${description.slice(0, 397)}...` : description,
          reviews,
          Number(oldPrice.toFixed(2)),
          tags,
        ];
      })
      .filter(Boolean)
      .slice(0, 120);

    return [...staticProducts, ...datasetProducts];
  } catch {
    return staticProducts;
  }
};

const seedProducts = async () => {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM products");
  if (rows[0].count > 0) return;

  const products = await buildProductSeed();

  for (const product of products) {
    const [name, category, price, rating, image, description, reviews, oldPrice, tags] = product;
    await pool.query(
      `INSERT INTO products (name, category, price, rating, image, description, reviews, old_price, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [name, category, price, rating, image, description, reviews, oldPrice || price, tags || []],
    );
  }
};

const seedReviews = async () => {
  const reviewTemplates = [
    ["Aarav Mehta", "aarav.demo@novacart.local", 5, "The build quality feels premium and the product looks exactly like the photos.", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"],
    ["Isha Kapoor", "isha.demo@novacart.local", 4, "Good value for the price. It arrived in good condition and works well for daily use.", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"],
    ["Rohan Shah", "rohan.demo@novacart.local", 5, "A stylish addition to my setup. I would recommend it to anyone comparing similar products.", "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=600&q=80"],
  ];
  const { rows: products } = await pool.query("SELECT id FROM products");
  for (const product of products) {
    const existing = await pool.query(
      "SELECT COUNT(*)::int AS count FROM reviews WHERE product_id = $1",
      [product.id],
    );
    if (existing.rows[0].count > 0) {
      for (const [, userEmail, , , imageUrl] of reviewTemplates) {
        await pool.query(
          "UPDATE reviews SET image_url = $1 WHERE product_id = $2 AND user_email = $3 AND image_url = ''",
          [imageUrl, product.id, userEmail],
        );
      }
      continue;
    }

    for (const [userName, userEmail, rating, text, imageUrl] of reviewTemplates) {
      await pool.query(
        `INSERT INTO reviews
          (product_id, user_email, user_name, rating, text, image_url, verified_purchase)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
        [product.id, userEmail, userName, rating, text, imageUrl],
      );
    }

    await pool.query(
      `UPDATE products
       SET rating = stats.rating, reviews = stats.review_count
       FROM (
         SELECT AVG(rating)::numeric(2,1) AS rating, COUNT(*)::int AS review_count
         FROM reviews WHERE product_id = $1
       ) stats
       WHERE products.id = $1`,
      [product.id],
    );
  }
};

app.use("/assistant", assistantRouter({ pool }));
app.use("/api/agent", agentRouter({ pool }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", message: "NovaCart backend is running" }));

app.get("/api/products", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM products ORDER BY rating DESC, reviews DESC LIMIT 100");
    res.json(rows.map(toProduct));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
});

app.get("/api/products/:productId/reviews", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, product_id AS "productId", user_email AS "userEmail", user_name AS "userName",
              rating, text, image_url AS "imageUrl", verified_purchase AS "verifiedPurchase", created_at AS "createdAt"
       FROM reviews WHERE product_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.params.productId],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
});

app.post("/api/products/:productId/reviews", async (req, res) => {
  try {
    const { userEmail, userName, rating, text, imageUrl = "" } = req.body || {};
    if (!userEmail || !userName || !text || !rating) {
      return res.status(400).json({ message: "Name, email, rating, and review text are required." });
    }
    const product = await pool.query("SELECT id FROM products WHERE id = $1", [req.params.productId]);
    if (!product.rowCount) return res.status(404).json({ message: "Product not found." });
    const review = await pool.query(
      `INSERT INTO reviews (product_id, user_email, user_name, rating, text, image_url)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, product_id AS "productId", user_email AS "userEmail", user_name AS "userName",
                 rating, text, image_url AS "imageUrl", verified_purchase AS "verifiedPurchase", created_at AS "createdAt"`,
      [req.params.productId, userEmail, userName, Number(rating), text, imageUrl],
    );
    await pool.query(
      `UPDATE products SET rating = stats.rating, reviews = stats.review_count
       FROM (SELECT AVG(rating)::numeric(2,1) AS rating, COUNT(*)::int AS review_count
             FROM reviews WHERE product_id = $1) stats WHERE products.id = $1`,
      [req.params.productId],
    );
    res.status(201).json(review.rows[0]);
  } catch (error) {
    res.status(400).json({ message: "Failed to submit review", error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || "super-secret-key", {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

const startServer = async () => {
  try {
    await initDatabase();
    await seedUsers();
    await seedProducts();
    await seedReviews();
    app.listen(PORT, () => console.log(`NovaCart backend running on http://localhost:${PORT}`));
  } catch (error) {
    console.error("PostgreSQL connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
