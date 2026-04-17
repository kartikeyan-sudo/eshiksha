-- EShikhsha Schema Extensions (v2)
-- Run AFTER the base schema.sql

-- Categories table for icon-based category management
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) UNIQUE NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'book',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add status and created_at to purchases for order management
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'completed';
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Seed default categories from existing ebook categories
INSERT INTO categories (name, icon)
SELECT DISTINCT category, 'book'
FROM ebooks
WHERE category IS NOT NULL AND category != ''
ON CONFLICT (name) DO NOTHING;
