-- Fix missing columns in production database
-- Run this on the server: ssh root@194.31.53.215

-- First, find the database container name:
-- docker ps | grep dapoerroema-db

-- Then run:
-- docker exec -it <container-name> psql -U dapoerroema -d dapoerroema

-- And execute these commands:
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_lat" real;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_lng" real;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_seen_at" timestamp;

-- Verify the columns were added:
\d "user"
