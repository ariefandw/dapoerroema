-- Add username column to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "username" TEXT UNIQUE;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS "user_username_idx" ON "user"("username");
