import { Pool } from "pg";

let migrationDone = false;

export async function runMigrations() {
    if (migrationDone) return;
    migrationDone = true;

    if (!process.env.DATABASE_URL) {
        console.log("No DATABASE_URL, skipping migrations");
        return;
    }

    console.log("Running database migrations...");

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        // Create tables
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

        console.log("Database migrations completed successfully");

        // Check if we need to seed data (no outlets yet)
        const outlets = await pool.query("SELECT COUNT(*) FROM outlets");
        if (parseInt(outlets.rows[0].count) === 0) {
            console.log("No outlets found, running seed...");
            await runSeed(pool);
        }

    } catch (error: any) {
        console.error("Migration failed:", error?.message || error);
    } finally {
        await pool.end();
    }
}

async function runSeed(pool: any) {
    const { auth } = await import("../lib/auth");

    // Create outlets
    await pool.query(`
        INSERT INTO outlets (name, contact_info) VALUES
        ('YAP Cafe', '0812-1111-2222'),
        ('Kael - Sender', '0812-3333-4444'),
        ('Seken', '0812-5555-6666')
    `);

    // Create products
    const products = [
        ["Soft Sourdough Coklat", "Sourdough", 25000],
        ["Soft Sourdough Keju", "Sourdough", 26000],
        ["Soft Sourdough Kacang", "Sourdough", 26000],
        ["Sourdough Plain", "Sourdough", 35000],
        ["Soft Cookies Choco", "Cookies", 15000],
        ["Garlic Bread", "Bread", 20000],
        ["Croissant Butter", "Bread", 25000],
        ["Choco Roll", "Pastry", 12000],
        ["Cinnamon Roll", "Pastry", 18000],
        ["Iced Americano", "Beverage", 15000],
    ];

    for (const [name, category, price] of products) {
        const imageUrl = `https://picsum.photos/seed/${name.toLowerCase().replace(/\s+/g, '-')}/400/400`;
        await pool.query(
            "INSERT INTO products (name, category, base_price, image_url) VALUES ($1, $2, $3, $4)",
            [name, category, price, imageUrl]
        );
    }

    // Get first outlet for users
    const outletRes = await pool.query("SELECT id FROM outlets LIMIT 1");
    const defaultOutletId = outletRes.rows[0]?.id || null;

    // Create default admin user
    try {
        await auth.api.signUpEmail({
            body: {
                name: "Admin",
                email: "admin@test.app",
                password: "Password123!",
            },
        });

        // Update role
        await pool.query(
            `UPDATE "user" SET role = 'admin', "current_outlet_id" = $1 WHERE email = 'admin@test.app'`,
            [defaultOutletId]
        );
        console.log("Created default admin user: admin@test.app / Password123!");
    } catch (e: any) {
        console.log("Admin user may already exist:", e?.message);
    }

    console.log("Database seeding completed!");
}
