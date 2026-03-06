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

        // Run basic migrations first
        await pool.query(`
            CREATE TABLE IF NOT EXISTS outlets (
                id serial PRIMARY KEY,
                name text NOT NULL,
                contact_info text,
                created_at timestamp DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS products (
                id serial PRIMARY KEY,
                name text NOT NULL,
                category text NOT NULL,
                base_price integer DEFAULT 0 NOT NULL,
                image_url text,
                created_at timestamp DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS orders (
                id serial PRIMARY KEY,
                outlet_id integer REFERENCES outlets(id),
                status text DEFAULT 'pending' NOT NULL,
                payment_status text,
                payment_method text,
                discount_type text,
                discount_amount integer DEFAULT 0,
                subtotal integer,
                total_amount integer,
                order_date timestamp NOT NULL,
                sent_to_baker_at timestamp,
                production_ready_at timestamp,
                shipped_at timestamp,
                delivered_at timestamp,
                created_at timestamp DEFAULT now() NOT NULL,
                updated_at timestamp DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id serial PRIMARY KEY,
                order_id integer REFERENCES orders(id) NOT NULL,
                product_id integer REFERENCES products(id) NOT NULL,
                quantity integer NOT NULL
            );

            CREATE TABLE IF NOT EXISTS stock (
                id serial PRIMARY KEY,
                product_id integer REFERENCES products(id) NOT NULL,
                outlet_id integer REFERENCES outlets(id),
                quantity integer DEFAULT 0 NOT NULL,
                min_stock integer DEFAULT 5,
                created_at timestamp DEFAULT now() NOT NULL,
                updated_at timestamp DEFAULT now() NOT NULL
            );

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

            -- Better Auth tables
            CREATE TABLE IF NOT EXISTS "user" (
                id text PRIMARY KEY,
                name text NOT NULL,
                email text NOT NULL UNIQUE,
                "emailVerified" boolean DEFAULT false NOT NULL,
                image text,
                role text DEFAULT 'admin' NOT NULL,
                "current_outlet_id" integer REFERENCES outlets(id),
                banned boolean,
                "banReason" text,
                "banExpires" timestamp,
                "createdAt" timestamp DEFAULT now() NOT NULL,
                "updatedAt" timestamp DEFAULT now() NOT NULL
            );

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

            CREATE TABLE IF NOT EXISTS "verification" (
                id text PRIMARY KEY,
                identifier text NOT NULL,
                value text NOT NULL,
                "expiresAt" timestamp NOT NULL,
                "createdAt" timestamp DEFAULT now(),
                "updatedAt" timestamp DEFAULT now()
            );
        `);

        await pool.end();

        return NextResponse.json({
            success: true,
            message: "Database tables created successfully",
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Database setup failed" },
            { status: 500 }
        );
    }
}
