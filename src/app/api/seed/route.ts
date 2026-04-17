import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

// Simple security check - only allow in production with a secret
const SEED_SECRET = process.env.SEED_SECRET || "change-me-in-production";

export async function POST(request: Request) {
    // Check for secret
    const body = await request.json().catch(() => ({}));
    if (body.secret !== SEED_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });

        // First create tables (safe — IF NOT EXISTS)
        await pool.query(`
            -- Brands table
            CREATE TABLE IF NOT EXISTS brands (
                id serial PRIMARY KEY,
                name text NOT NULL,
                description text,
                created_at timestamp DEFAULT now() NOT NULL
            );

            -- Outlets table
            CREATE TABLE IF NOT EXISTS outlets (
                id serial PRIMARY KEY,
                brand_id integer REFERENCES brands(id),
                name text NOT NULL,
                contact_info text,
                created_at timestamp DEFAULT now() NOT NULL
            );

            -- Products table
            CREATE TABLE IF NOT EXISTS products (
                id serial PRIMARY KEY,
                name text NOT NULL,
                category text NOT NULL,
                base_price integer DEFAULT 0 NOT NULL,
                image_url text,
                shelf_life integer,
                created_at timestamp DEFAULT now() NOT NULL
            );

            -- Brand Products table
            CREATE TABLE IF NOT EXISTS brand_products (
                id serial PRIMARY KEY,
                brand_id integer REFERENCES brands(id) NOT NULL,
                product_id integer REFERENCES products(id) NOT NULL,
                price integer NOT NULL,
                created_at timestamp DEFAULT now() NOT NULL,
                updated_at timestamp DEFAULT now() NOT NULL,
                CONSTRAINT brand_products_unq UNIQUE (brand_id, product_id)
            );

            -- Orders table (with runner_id)
            CREATE TABLE IF NOT EXISTS orders (
                id serial PRIMARY KEY,
                outlet_id integer REFERENCES outlets(id) NOT NULL,
                status text DEFAULT 'pending' NOT NULL,
                payment_status text,
                payment_method text,
                discount_type text,
                discount_amount integer DEFAULT 0,
                subtotal integer,
                total_amount integer,
                notes text,
                runner_id text,
                order_date timestamp NOT NULL,
                delivery_photo_url text,
                delivery_signature_url text,
                created_at timestamp DEFAULT now() NOT NULL,
                updated_at timestamp DEFAULT now() NOT NULL
            );

            -- Order Items table
            CREATE TABLE IF NOT EXISTS order_items (
                id serial PRIMARY KEY,
                order_id integer REFERENCES orders(id) NOT NULL,
                product_id integer REFERENCES products(id) NOT NULL,
                quantity integer NOT NULL,
                unit_price integer
            );

            -- Order Status Logs table
            CREATE TABLE IF NOT EXISTS order_status_logs (
                id serial PRIMARY KEY,
                order_id integer REFERENCES orders(id) NOT NULL,
                from_status text,
                to_status text NOT NULL,
                changed_by text,
                notes text,
                created_at timestamp DEFAULT now() NOT NULL
            );

            -- Stock table
            CREATE TABLE IF NOT EXISTS stock (
                id serial PRIMARY KEY,
                product_id integer REFERENCES products(id) NOT NULL,
                outlet_id integer REFERENCES outlets(id),
                quantity integer DEFAULT 0 NOT NULL,
                min_stock integer DEFAULT 5,
                stock_date timestamp DEFAULT now(),
                updated_at timestamp DEFAULT now() NOT NULL
            );

            -- Stock Transactions table
            CREATE TABLE IF NOT EXISTS stock_transactions (
                id serial PRIMARY KEY,
                product_id integer REFERENCES products(id) NOT NULL,
                outlet_id integer REFERENCES outlets(id),
                transaction_type text NOT NULL,
                quantity integer NOT NULL,
                reference_outlet_id integer REFERENCES outlets(id),
                notes text,
                created_by text,
                created_at timestamp DEFAULT now() NOT NULL
            );

            -- Runner Trail table
            CREATE TABLE IF NOT EXISTS runner_trail (
                id serial PRIMARY KEY,
                user_id text NOT NULL,
                order_id integer REFERENCES orders(id),
                lat real NOT NULL,
                lng real NOT NULL,
                created_at timestamp DEFAULT now() NOT NULL
            );

            -- Settings table
            CREATE TABLE IF NOT EXISTS settings (
                key text PRIMARY KEY,
                value text NOT NULL,
                updated_at timestamp DEFAULT now() NOT NULL
            );

            -- Better Auth: User table (with username)
            CREATE TABLE IF NOT EXISTS "user" (
                id text PRIMARY KEY,
                name text NOT NULL,
                email text NOT NULL UNIQUE,
                username text UNIQUE,
                "emailVerified" boolean DEFAULT false NOT NULL,
                image text,
                role text DEFAULT 'admin' NOT NULL,
                "current_outlet_id" integer REFERENCES outlets(id),
                "last_lat" real,
                "last_lng" real,
                "last_seen_at" timestamp,
                banned boolean,
                "banReason" text,
                "banExpires" timestamp,
                "createdAt" timestamp DEFAULT now() NOT NULL,
                "updatedAt" timestamp DEFAULT now() NOT NULL
            );

            -- Better Auth: Session table
            CREATE TABLE IF NOT EXISTS "session" (
                id text PRIMARY KEY,
                "expiresAt" timestamp NOT NULL,
                token text NOT NULL UNIQUE,
                "createdAt" timestamp DEFAULT now() NOT NULL,
                "updatedAt" timestamp DEFAULT now() NOT NULL,
                "ipAddress" text,
                "userAgent" text,
                "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
            );

            -- Better Auth: Account table
            CREATE TABLE IF NOT EXISTS "account" (
                id text PRIMARY KEY,
                "accountId" text NOT NULL,
                "providerId" text NOT NULL,
                "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                "accessToken" text,
                "refreshToken" text,
                "idToken" text,
                "accessTokenExpiresAt" timestamp,
                "refreshTokenExpiresAt" timestamp,
                scope text,
                password text,
                "createdAt" timestamp DEFAULT now() NOT NULL,
                "updatedAt" timestamp DEFAULT now() NOT NULL
            );

            -- Better Auth: Verification table
            CREATE TABLE IF NOT EXISTS "verification" (
                id text PRIMARY KEY,
                identifier text NOT NULL,
                value text NOT NULL,
                "expiresAt" timestamp NOT NULL,
                "createdAt" timestamp DEFAULT now(),
                "updatedAt" timestamp DEFAULT now()
            );

            -- Add indexes for better performance
            CREATE INDEX IF NOT EXISTS user_username_idx ON "user"("username");
            CREATE INDEX IF NOT EXISTS user_email_idx ON "user"(email);
            CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");
            CREATE INDEX IF NOT EXISTS orders_outlet_id_idx ON orders(outlet_id);
            CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
            CREATE INDEX IF NOT EXISTS runner_trail_user_id_idx ON runner_trail(user_id);
            CREATE INDEX IF NOT EXISTS runner_trail_order_id_idx ON runner_trail(order_id);
        `);

        // Then add columns to existing tables (safe — IF NOT EXISTS, tables now guaranteed to exist)
        await pool.query(`
            ALTER TABLE "user" ADD COLUMN IF NOT EXISTS username text UNIQUE;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS runner_id text;
            ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_lat" real;
            ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_lng" real;
            ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_seen_at" timestamp;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_photo_url text;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_signature_url text;
            ALTER TABLE products ADD COLUMN IF NOT EXISTS shelf_life integer;
            ALTER TABLE stock ADD COLUMN IF NOT EXISTS stock_date timestamp DEFAULT NOW();
        `);

        await pool.end();

        return NextResponse.json({
            success: true,
            message: "Database tables created successfully with updated schema",
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Database setup failed" },
            { status: 500 }
        );
    }
}
