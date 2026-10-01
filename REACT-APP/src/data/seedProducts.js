import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@127.0.0.1:5432/novacart",
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const seed = async () => {
  try {
    const products = Array.from({ length: 1000 }, (_, index) => ({
      name: `Nova ${["Audio", "Wearables", "Smart Devices", "Workspace"][index % 4]} Product ${index + 1}`,
      category: ["Audio", "Wearables", "Smart Devices", "Workspace"][index % 4],
      price: 49 + ((index * 17) % 1500),
      rating: Number((3.8 + (index % 13) * 0.1).toFixed(1)),
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
      description: "Premium product designed for performance, convenience, and modern lifestyle needs.",
      reviews: 20 + ((index * 7) % 400),
    }));

    await pool.query("TRUNCATE TABLE reviews, products RESTART IDENTITY CASCADE");
    for (const product of products) {
      await pool.query(
        `INSERT INTO products (name, category, price, rating, image, description, reviews)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          product.name,
          product.category,
          product.price,
          product.rating,
          product.image,
          product.description,
          product.reviews,
        ],
      );
    }
    console.log("Inserted 1000 product records into PostgreSQL");
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seed();
