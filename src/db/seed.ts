import { Pool } from "pg";
import * as dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: ".env.local" });
}

const PRODUCTS = [
    { name: "Soft Sourdough Coklat", category: "Sourdough", price: 25000 },
    { name: "Soft Sourdough Keju", category: "Sourdough", price: 26000 },
    { name: "Sourdough Plain", category: "Sourdough", price: 35000 },
    { name: "Soft Cookies Choco", category: "Cookies", price: 15000 },
    { name: "Garlic Bread", category: "Bread", price: 20000 },
    { name: "Croissant Butter", category: "Bread", price: 25000 },
    { name: "Cinnamon Roll", category: "Pastry", price: 18000 },
    { name: "Iced Americano", category: "Beverage", price: 15000 },
    { name: "Iced Latte", category: "Beverage", price: 22000 },
];

const BRANDS = [
    { name: "Toko Roema", description: "Premium Artisan Bakery" },
    { name: "Sender", description: "Modern Coffee & Bread" },
    { name: "YAP Cafe", description: "Yogyakarta Artisan Pastry" },
];

const OUTLETS = [
    { name: "Toko Roema Sapen", contact: "0812-5000-6000", brand: "Toko Roema", lat: -7.8198, lng: 110.3719 },
    { name: "Toko Roema Seturan", contact: "0812-5000-6001", brand: "Toko Roema", lat: -7.7691, lng: 110.4101 },
    { name: "Sender Malioboro", contact: "0812-3000-4000", brand: "Sender", lat: -7.7926, lng: 110.3658 },
    { name: "Sender Jakal", contact: "0812-3000-4001", brand: "Sender", lat: -7.7511, lng: 110.3765 },
    { name: "YAP Cafe Jogja", contact: "0812-1000-2000", brand: "YAP Cafe", lat: -7.7829, lng: 110.3725 },
];

function getImageUrl(seed: string) {
    return `https://picsum.photos/seed/${seed}/400/400`;
}

export async function runSeed(isCleanupOnly = false) {
    console.log("🌋 Seeding Yogyakarta Data...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        // Check if outlets exist - if yes, database is already seeded
        const outletCheck = await pool.query("SELECT COUNT(*)::int FROM outlets");
        const hasData = parseInt(outletCheck.rows[0].count) > 0;

        if (hasData && !isCleanupOnly) {
            console.log("✅ Database already seeded. Use reset button to re-seed.");
            return { success: true, message: "Database already seeded." };
        }

        if (isCleanupOnly) {
            console.log("🧹 Cleaning up data...");
            await pool.query("TRUNCATE TABLE runner_trail, stock_transactions, stock, order_items, orders, order_status_logs, brand_products, products, outlets, settings, brands CASCADE");
            console.log("✅ Cleanup complete.");
            return { success: true, message: "Data cleared successfully." };
        }

        await pool.query("BEGIN");

        // 0. Settings
        console.log("   - Seeding settings...");
        await pool.query(
            "INSERT INTO settings (key, value) VALUES ($1, $2), ($3, $4) ON CONFLICT (key) DO NOTHING",
            ["app_name", "Orbery Central Kitchen", "maintenance_mode", "false"]
        );

        // 1. Brands
        const brandIds: Record<string, number> = {};
        for (const b of BRANDS) {
            const res = await pool.query("INSERT INTO brands (name, description) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id", [b.name, b.description]);
            if (res.rows.length > 0) {
                brandIds[b.name] = res.rows[0].id;
            } else {
                const existing = await pool.query("SELECT id FROM brands WHERE name = $1", [b.name]);
                brandIds[b.name] = existing.rows[0].id;
            }
        }

        // 2. Outlets
        const outletList: { id: number; name: string }[] = [];
        for (const o of OUTLETS) {
            const res = await pool.query(
                "INSERT INTO outlets (name, contact_info, brand_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id",
                [o.name, o.contact, brandIds[o.brand]]
            );
            if (res.rows.length > 0) {
                outletList.push({ id: res.rows[0].id, name: o.name });
            } else {
                const existing = await pool.query("SELECT id FROM outlets WHERE name = $1", [o.name]);
                outletList.push({ id: existing.rows[0].id, name: o.name });
            }
        }

        // 3. Products & Brand Pricing & Initial Stock
        const productIds: number[] = [];
        console.log("   - Seeding products, pricing, and initial stock...");
        for (const p of PRODUCTS) {
            const basePrice = Math.floor(p.price * 0.7);
            const res = await pool.query(
                "INSERT INTO products (name, category, base_price, image_url) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING id",
                [p.name, p.category, basePrice, getImageUrl(p.name)]
            );
            let productId: number;
            if (res.rows.length > 0) {
                productId = res.rows[0].id;
            } else {
                const existing = await pool.query("SELECT id FROM products WHERE name = $1", [p.name]);
                productId = existing.rows[0].id;
            }
            productIds.push(productId);

            // Add brand pricing
            for (const b of BRANDS) {
                const bId = brandIds[b.name];
                const markup = b.name === "Toko Roema" ? 1.2 : (b.name === "YAP Cafe" ? 1.5 : 1.1);
                await pool.query(
                    "INSERT INTO brand_products (brand_id, product_id, price) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                    [bId, productId, Math.floor(basePrice * markup)]
                );
            }

            // Initial central stock (outlet_id = null)
            await pool.query(
                "INSERT INTO stock (product_id, outlet_id, quantity, min_stock) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
                [productId, null, 1000, 100]
            );

            // Log initial stock transaction
            await pool.query(
                "INSERT INTO stock_transactions (product_id, outlet_id, transaction_type, quantity, notes, created_by) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
                [productId, null, "add", 1000, "Initial System Seeding", "system"]
            );
        }

        // 4. Users
        const { auth } = await import("../lib/auth");
        const USERS = [
            { name: "Ariefan Admin", email: "admin@test.app", username: "ariefan_admin", role: "admin" },
            { name: "Budi Baker", email: "baker@test.app", username: "budi_baker", role: "baker" },
            { name: "Rudi Runner", email: "runner@test.app", username: "rudi_runner", role: "runner" },
            { name: "Customer User", email: "user@test.app", username: "customer_user", role: "user" },
        ];

        const targetOutlet = outletList.find(o => o.name === "Toko Roema Sapen") || outletList[0];
        for (const u of USERS) {
            const existing = await pool.query('SELECT id FROM "user" WHERE email = $1', [u.email]);
            let userId: string;

            if (existing.rows.length === 0) {
                console.log(`   - Creating user ${u.email} with signUpEmail...`);
                const res = await auth.api.signUpEmail({
                    body: {
                        name: u.name,
                        email: u.email,
                        password: "Password123",
                    },
                });
                userId = res?.user?.id || crypto.randomUUID();
            } else {
                userId = existing.rows[0].id;
                // Delete and recreate account with fresh password
                await pool.query('DELETE FROM "account" WHERE "userId" = $1', [userId]);
                const res = await auth.api.signUpEmail({
                    body: {
                        name: u.name,
                        email: u.email,
                        password: "Password123",
                    },
                });
            }

            // Update username and role
            await pool.query(`UPDATE "user" SET username = $1, role = $2, "current_outlet_id" = $3 WHERE email = $4`,
                [u.username, u.role, targetOutlet.id, u.email]);
        }

        // 5. Orders (sample data)
        console.log("📦 Creating sample orders...");
        const stats = ['pending', 'accepted', 'in_production', 'ready', 'shipping', 'delivered'];

        for (const outlet of outletList) {
            for (let i = 0; i < 3; i++) {
                const status = stats[i % stats.length];
                const subtotal = 100000 + Math.floor(Math.random() * 200000);

                const orderRes = await pool.query(
                    "INSERT INTO orders (outlet_id, status, subtotal, total_amount, order_date, created_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id",
                    [outlet.id, status, subtotal, subtotal]
                );
                const orderId = orderRes.rows[0].id;

                await pool.query(
                    "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
                    [orderId, productIds[0], 2, Math.floor(PRODUCTS[0].price * 1.1)]
                );
            }
        }

        await pool.query("COMMIT");
        console.log("✅ Yogyakarta Seeded!");
        return { success: true, message: "Yogyakarta data seeded successfully!" };
    } catch (e: any) {
        await pool.query("ROLLBACK");
        console.error(e);
        return { success: false, error: e.message };
    } finally {
        await pool.end();
    }
}

// Allow running as script
if (require.main === module) {
    runSeed().catch(console.error);
}
