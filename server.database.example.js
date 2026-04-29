// DATABASE RECOMMENDATION
// Recommended database: PostgreSQL.
//
// Why PostgreSQL fits this application:
// 1. Product, batch, QC, material, and traceability data are strongly related.
// 2. Traceability needs reliable joins from product -> material -> parent product -> child product.
// 3. Product characteristics can stay flexible using JSONB, so the table does not need to change
//    every time a new product attribute is added.
// 4. PostgreSQL is mature for reporting queries, indexes, audit trails, and future integration
//    with ERP/MES systems.
//
// Suggested production architecture:
// Frontend -> Backend API -> PostgreSQL
//
// Important:
// Do not connect the browser directly to PostgreSQL. Database credentials must stay on the server.

// ---------------------------------------------------------------------------
// 1. Install packages when this file is activated later:
// ---------------------------------------------------------------------------
// npm install express pg dotenv cors

// ---------------------------------------------------------------------------
// 2. Example .env values:
// ---------------------------------------------------------------------------
// DATABASE_URL=postgres://postgres:your_password@localhost:5432/product_intelligence
// API_PORT=3000

// ---------------------------------------------------------------------------
// 3. Example PostgreSQL schema:
// ---------------------------------------------------------------------------
// CREATE TABLE products (
//   id TEXT PRIMARY KEY,
//   batch CHAR(10) NOT NULL UNIQUE CHECK (batch ~ '^[0-9]{10}$'),
//   code CHAR(6) NOT NULL CHECK (code ~ '^(JR|SR)[A-Z0-9]{3}[IO]$'),
//   name TEXT NOT NULL,
//   type TEXT NOT NULL CHECK (type IN ('Jumbo Roll', 'Slit Roll')),
//   production_time TIMESTAMP NOT NULL,
//   location TEXT NOT NULL,
//   qc_status TEXT NOT NULL CHECK (qc_status IN ('PASS', 'FAIL')),
//   characteristics JSONB NOT NULL DEFAULT '{}'::jsonb
// );
//
// CREATE TABLE product_qc_details (
//   id BIGSERIAL PRIMARY KEY,
//   product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
//   parameter TEXT NOT NULL,
//   value TEXT NOT NULL,
//   result TEXT NOT NULL CHECK (result IN ('PASS', 'FAIL')),
//   assessment TEXT,
//   reason TEXT
// );
//
// CREATE TABLE product_timeline (
//   id BIGSERIAL PRIMARY KEY,
//   product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
//   event_time TIMESTAMP NOT NULL,
//   place TEXT NOT NULL,
//   note TEXT NOT NULL,
//   related_product_id TEXT REFERENCES products(id)
// );
//
// CREATE TABLE product_materials (
//   id BIGSERIAL PRIMARY KEY,
//   product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
//   material_id TEXT NOT NULL,
//   material_type TEXT NOT NULL,
//   material_name TEXT NOT NULL,
//   material_batch TEXT NOT NULL,
//   quantity TEXT NOT NULL,
//   parent_product_id TEXT REFERENCES products(id)
// );
//
// CREATE INDEX idx_products_production_time ON products (production_time DESC);
// CREATE INDEX idx_products_batch_code ON products (batch, code);
// CREATE INDEX idx_product_materials_parent ON product_materials (parent_product_id);
// CREATE INDEX idx_product_timeline_product ON product_timeline (product_id, event_time);

// ---------------------------------------------------------------------------
// 4. Example Express API with PostgreSQL.
//    Uncomment this block when the project is converted from static data
//    to a backend API.
// ---------------------------------------------------------------------------
//
// import "dotenv/config";
// import cors from "cors";
// import express from "express";
// import pg from "pg";
//
// const { Pool } = pg;
// const app = express();
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });
//
// app.use(cors());
// app.use(express.json());
//
// function mapProduct(row) {
//   return {
//     id: row.id,
//     batch: row.batch,
//     code: row.code,
//     name: row.name,
//     type: row.type,
//     productionTime: row.production_time,
//     location: row.location,
//     qcStatus: row.qc_status,
//     characteristics: row.characteristics,
//   };
// }
//
// app.post("/api/login", async (req, res) => {
//   const { username, password } = req.body;
//
//   // Production note:
//   // Store users in a users table and compare hashed passwords with bcrypt/argon2.
//   if (username === "admin" && password === "admin123") {
//     return res.json({ username: "admin" });
//   }
//
//   return res.status(401).json({ message: "Username atau password tidak valid." });
// });
//
// app.get("/api/products", async (req, res) => {
//   const { q = "", type = "All", limit, offset = 0 } = req.query;
//   const params = [];
//   const where = [];
//
//   if (q) {
//     params.push(`%${q}%`);
//     where.push(`(batch ILIKE $${params.length} OR code ILIKE $${params.length} OR name ILIKE $${params.length})`);
//   }
//
//   if (type !== "All") {
//     params.push(type);
//     where.push(`type = $${params.length}`);
//   }
//
//   const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
//   const limitSql = limit ? `LIMIT ${Number(limit)} OFFSET ${Number(offset)}` : "";
//
//   const result = await pool.query(
//     `
//       SELECT id, batch, code, name, type, production_time, location, qc_status, characteristics
//       FROM products
//       ${whereSql}
//       ORDER BY production_time DESC
//       ${limitSql}
//     `,
//     params,
//   );
//
//   res.json(result.rows.map(mapProduct));
// });
//
// app.get("/api/products/:id", async (req, res) => {
//   const client = await pool.connect();
//
//   try {
//     const productResult = await client.query(
//       `
//         SELECT id, batch, code, name, type, production_time, location, qc_status, characteristics
//         FROM products
//         WHERE id = $1
//       `,
//       [req.params.id],
//     );
//
//     if (!productResult.rowCount) {
//       return res.status(404).json({ message: "Produk tidak ditemukan." });
//     }
//
//     const [qcResult, timelineResult, materialResult] = await Promise.all([
//       client.query(
//         `
//           SELECT parameter, value, result, assessment, reason
//           FROM product_qc_details
//           WHERE product_id = $1
//           ORDER BY id
//         `,
//         [req.params.id],
//       ),
//       client.query(
//         `
//           SELECT event_time AS time, place, note, related_product_id AS "relatedProductId"
//           FROM product_timeline
//           WHERE product_id = $1
//           ORDER BY event_time
//         `,
//         [req.params.id],
//       ),
//       client.query(
//         `
//           SELECT
//             material_id AS id,
//             material_type AS type,
//             material_name AS name,
//             material_batch AS batch,
//             quantity,
//             parent_product_id AS "parentProductId"
//           FROM product_materials
//           WHERE product_id = $1
//           ORDER BY id
//         `,
//         [req.params.id],
//       ),
//     ]);
//
//     res.json({
//       ...mapProduct(productResult.rows[0]),
//       qcDetails: qcResult.rows,
//       timeline: timelineResult.rows,
//       materials: materialResult.rows,
//     });
//   } finally {
//     client.release();
//   }
// });
//
// app.get("/api/reports/production-trend", async (req, res) => {
//   const { period = "day" } = req.query;
//   const allowedPeriods = new Set(["day", "week", "month", "quarter", "year"]);
//   const datePeriod = allowedPeriods.has(period) ? period : "day";
//
//   const result = await pool.query(
//     `
//       SELECT
//         date_trunc($1, production_time) AS period_start,
//         COUNT(*)::int AS total,
//         COUNT(*) FILTER (WHERE type = 'Jumbo Roll')::int AS jumbo,
//         COUNT(*) FILTER (WHERE type = 'Slit Roll')::int AS slit,
//         COUNT(*) FILTER (WHERE qc_status = 'PASS')::int AS pass,
//         COUNT(*) FILTER (WHERE qc_status = 'FAIL')::int AS fail
//       FROM products
//       GROUP BY period_start
//       ORDER BY period_start
//     `,
//     [datePeriod],
//   );
//
//   res.json(result.rows);
// });
//
// app.listen(process.env.API_PORT || 3000, () => {
//   console.log(`Product Intelligence API running on port ${process.env.API_PORT || 3000}`);
// });
