-- Migration: Add shelf_life to products and stock_date to stock
ALTER TABLE products ADD COLUMN IF NOT EXISTS shelf_life integer;
ALTER TABLE stock ADD COLUMN IF NOT EXISTS stock_date timestamp DEFAULT NOW();
