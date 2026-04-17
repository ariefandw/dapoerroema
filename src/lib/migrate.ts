import { Pool } from "pg";

export async function runMigrations() {
    if (!process.env.DATABASE_URL) {
        console.log("No DATABASE_URL, skipping migrations");
        return;
    }

    console.log("Running database migrations...");

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        // ... (CREATE TABLE logic)
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
                runner_id text REFERENCES "user"(id),
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
                user_id text REFERENCES "user"(id) NOT NULL,
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
            CREATE INDEX IF NOT EXISTS orders_runner_id_idx ON orders(runner_id);
            CREATE INDEX IF NOT EXISTS runner_trail_user_id_idx ON runner_trail(user_id);
            CREATE INDEX IF NOT EXISTS runner_trail_order_id_idx ON runner_trail(order_id);
        `);

        // Add new columns to existing tables (safe after CREATE TABLE)
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

        console.log("Database migrations completed successfully");

        // Force check for outlets
        const outletCheck = await pool.query("SELECT id FROM outlets LIMIT 1");
        if (outletCheck.rows.length === 0) {
            console.log("No outlets found, running seed...");
            await runSeed(pool);
        }

    } catch (error: any) {
        console.error("Migration failed:", error?.message || error);
    } finally {
        await pool.end();
    }
}

async function runSeed(pool: Pool) {
    const { auth } = await import("../lib/auth");

    // Clean up storyteller data if exists to avoid confusion
    await pool.query("DELETE FROM outlets WHERE name = 'Sultan Malioboro'");
    await pool.query("DELETE FROM brands WHERE name = 'Roti Sultan'");

    // Create brands
    await pool.query(`
        INSERT INTO brands (name, description) VALUES
        ('Toko Roema', 'Premium Artisan Bakery'),
        ('Sender', 'Modern Coffee & Bread'),
        ('YAP Cafe', 'Yogyakarta Artisan Pastry')
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `);

    // Create outlets
    await pool.query(`
        INSERT INTO outlets (name, contact_info, brand_id) VALUES
        ('Toko Roema Sapen', '0812-5000-6000', (SELECT id FROM brands WHERE name = 'Toko Roema' LIMIT 1)),
        ('Toko Roema Seturan', '0812-5000-6001', (SELECT id FROM brands WHERE name = 'Toko Roema' LIMIT 1)),
        ('Sender Malioboro', '0812-3000-4000', (SELECT id FROM brands WHERE name = 'Sender' LIMIT 1)),
        ('Sender Jakal', '0812-3000-4001', (SELECT id FROM brands WHERE name = 'Sender' LIMIT 1)),
        ('YAP Cafe Jogja', '0812-1000-2000', (SELECT id FROM brands WHERE name = 'YAP Cafe' LIMIT 1))
        ON CONFLICT DO NOTHING
    `);

    // Create products
    const products = [
        ["Soft Sourdough Coklat", "Sourdough", 25000],
        ["Soft Sourdough Keju", "Sourdough", 26000],
        ["Garlic Bread", "Bread", 20000],
        ["Croissant Butter", "Bread", 25000],
        ["Cinnamon Roll", "Pastry", 18000],
        ["Iced Americano", "Beverage", 15000],
        ["Iced Latte", "Beverage", 22000],
    ];

    for (const product of products) {
        const [name, category, price] = product;
        const imageUrl = `https://picsum.photos/seed/${String(name).toLowerCase().replace(/\s+/g, '-')}/400/400`;
        await pool.query(
            "INSERT INTO products (name, category, base_price, image_url) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
            [name, category, price, imageUrl]
        );
    }

    // Create brand products with pricing
    await pool.query(`
        INSERT INTO brand_products (brand_id, product_id, price)
        SELECT 1, p.id, p.base_price * 1.2 FROM products p
        ON CONFLICT (brand_id, product_id) DO NOTHING
    `);

    // Get first outlet for users
    const outletRes = await pool.query("SELECT id FROM outlets LIMIT 1");
    const defaultOutletId = outletRes.rows[0]?.id || null;

    // Create demo users with usernames
    const users = [
        { name: "Ariefan Admin", email: "admin@test.app", username: "ariefan_admin", role: "admin" },
        { name: "Budi Baker", email: "baker@test.app", username: "budi_baker", role: "baker" },
        { name: "Rudi Runner", email: "runner@test.app", username: "rudi_runner", role: "runner" },
        { name: "Customer User", email: "user@test.app", username: "customer_user", role: "user" },
    ];

    for (const u of users) {
        try {
            await auth.api.signUpEmail({
                body: {
                    name: u.name,
                    email: u.email,
                    password: "Password123!",
                },
            });
        } catch (e) {
            // User may already exist
        }

        // Update user with role, username, and outlet
        await pool.query(
            `UPDATE "user" SET role = $1, username = $2, "current_outlet_id" = $3 WHERE email = $4`,
            [u.role, u.username, defaultOutletId, u.email]
        );
    }

    console.log("Created default users:");
    console.log("  admin@test.app / Password123! (@ariefan_admin)");
    console.log("  baker@test.app / Password123! (@budi_baker)");
    console.log("  runner@test.app / Password123! (@rudi_runner)");
    console.log("  user@test.app / Password123! (@customer_user)");

    console.log("Database seeding completed!");
}
