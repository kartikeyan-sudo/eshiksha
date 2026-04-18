const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const { env } = require("../config/env");

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE
    );
  `);

  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ebooks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      file_key TEXT NOT NULL,
      cover_key TEXT NOT NULL,
      preview_pages INTEGER NOT NULL DEFAULT 3,
      category VARCHAR(80) NOT NULL DEFAULT 'General',
      tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      is_free BOOLEAN NOT NULL DEFAULT FALSE,
      views_count INTEGER NOT NULL DEFAULT 0
    );
  `);

  await pool.query("ALTER TABLE ebooks ADD COLUMN IF NOT EXISTS category VARCHAR(80) NOT NULL DEFAULT 'General'");
  await pool.query("ALTER TABLE ebooks ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]");
  await pool.query("ALTER TABLE ebooks ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT FALSE");
  await pool.query("ALTER TABLE ebooks ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ebook_id INTEGER NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
      UNIQUE (user_id, ebook_id)
    );
  `);

  await pool.query("ALTER TABLE purchases ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'completed'");
  await pool.query("ALTER TABLE purchases ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(80) UNIQUE NOT NULL,
      icon VARCHAR(50) NOT NULL DEFAULT 'book',
      description TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    INSERT INTO categories (name, icon)
    SELECT DISTINCT e.category, 'book'
    FROM ebooks e
    WHERE e.category IS NOT NULL AND e.category <> ''
    ON CONFLICT (name) DO NOTHING
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reading_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ebook_id INTEGER NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
      last_page INTEGER NOT NULL DEFAULT 1,
      progress_percent INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, ebook_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ebook_id INTEGER NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
      page_number INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, ebook_id, page_number)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ebook_id INTEGER NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
      page_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ebook_ratings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ebook_id INTEGER NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      review TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, ebook_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ebook_id INTEGER NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
      order_id TEXT NOT NULL UNIQUE,
      payment_id TEXT UNIQUE,
      amount NUMERIC(10, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      status VARCHAR(20) NOT NULL DEFAULT 'created',
      signature TEXT,
      gateway_payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(255) UNIQUE NOT NULL,
      value TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query("CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_reading_progress_user_ebook ON reading_progress(user_id, ebook_id)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_bookmarks_user_ebook ON bookmarks(user_id, ebook_id)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_notes_user_ebook ON notes(user_id, ebook_id)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_ebooks_category ON ebooks(category)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_ebooks_views_count ON ebooks(views_count DESC)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_ebook_ratings_ebook_id ON ebook_ratings(ebook_id)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_payment_transactions_ebook_id ON payment_transactions(ebook_id)");

  const adminEmail = "admin@eshiksha.com";
  const adminPasswordHash = await bcrypt.hash("admin", 10);

  await pool.query(
    `
    INSERT INTO users (email, password, role, is_blocked, is_active)
    VALUES ($1, $2, 'admin', FALSE, TRUE)
    ON CONFLICT (email)
    DO UPDATE SET
      password = EXCLUDED.password,
      role = 'admin',
      is_blocked = FALSE,
      is_active = TRUE
    `,
    [adminEmail, adminPasswordHash],
  );
}

module.exports = { pool, initDatabase };
