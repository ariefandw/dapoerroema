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
    { name: "Toko Roema Prawirotaman", contact: "0812-5000-6000", brand: "Toko Roema", lat: -7.8198, lng: 110.3719 },
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
        console.log("🧹 Cleaning up...");
        await pool.query("TRUNCATE TABLE runner_trail, stock_transactions, stock, order_items, orders, order_status_logs, products, outlets, brands CASCADE");

        if (isCleanupOnly) {
            console.log("✅ Cleanup complete.");
            return { success: true, message: "Data removed successfully." };
        }

        await pool.query("BEGIN");

        // 1. Brands
        const brandIds: Record<string, number> = {};
        for (const b of BRANDS) {
            const res = await pool.query("INSERT INTO brands (name, description) VALUES ($1, $2) RETURNING id", [b.name, b.description]);
            brandIds[b.name] = res.rows[0].id;
        }

        // 2. Outlets
        const outletList: { id: number; name: string }[] = [];
        for (const o of OUTLETS) {
            const res = await pool.query(
                "INSERT INTO outlets (name, contact_info, brand_id) VALUES ($1, $2, $3) RETURNING id",
                [o.name, o.contact, brandIds[o.brand]]
            );
            outletList.push({ id: res.rows[0].id, name: o.name });
        }

        // 3. Products
        const productIds: number[] = [];
        for (const p of PRODUCTS) {
            const res = await pool.query(
                "INSERT INTO products (name, category, base_price, image_url) VALUES ($1, $2, $3, $4) RETURNING id",
                [p.name, p.category, Math.floor(p.price * 0.7), getImageUrl(p.name)]
            );
            productIds.push(res.rows[0].id);
        }

        // 4. Users
        const { auth } = await import("../lib/auth");
        const USERS = [
            { name: "Ariefan Admin", email: "admin@test.app", role: "admin" },
            { name: "Budi Baker", email: "baker@test.app", role: "baker" },
            { name: "Rudi Runner", email: "runner@test.app", role: "runner" },
            { name: "Customer User", email: "user@test.app", role: "user" },
        ];

        const userMap: Record<string, string> = {};
        for (const u of USERS) {
            let userId: string;
            const existing = await pool.query('SELECT id FROM "user" WHERE email = $1', [u.email]);

            if (existing.rows.length > 0) {
                userId = existing.rows[0].id;
                console.log(`   - User ${u.email} exists, updating role...`);
            } else {
                console.log(`   - Creating user ${u.email}...`);
                const res = await auth.api.signUpEmail({
                    body: { name: u.name, email: u.email, password: "Password123!" },
                });
                if (!res?.user) throw new Error(`Failed to create user ${u.email}`);
                userId = res.user.id;
            }

            userMap[u.role] = userId;
            // Assign user to first outlet if role is 'user' to enable brand restriction logic
            const outletUpdate = u.role === 'user' ? `, current_outlet_id = ${outletList[0].id}` : '';
            await pool.query(`UPDATE "user" SET role = $1 ${outletUpdate} WHERE id = $2`, [u.role, userId]);
        }

        // 5. Orders (Guaranteed 5+ per outlet)
        console.log("📦 Creating rich order history (H-3 to H+3)...");
        const stats = ['pending', 'accepted', 'in_production', 'ready', 'shipping', 'delivered'];

        for (const outlet of outletList) {
            console.log(`   - Seeding ${outlet.name}...`);
            // Every outlet gets 6 orders (one for each status)
            for (let i = 0; i < stats.length; i++) {
                const currentStatus = stats[i];
                const now = new Date();
                const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
                const orderDate = new Date(now.getTime() - threeDaysMs + (Math.random() * 2 * threeDaysMs));
                const subtotal = 100000 + Math.floor(Math.random() * 200000);

                const orderRes = await pool.query(
                    "INSERT INTO orders (outlet_id, status, subtotal, total_amount, order_date, created_at) VALUES ($1, $2, $3, $4, $5, $5) RETURNING id",
                    [outlet.id, currentStatus, subtotal, subtotal, orderDate]
                );
                const orderId = orderRes.rows[0].id;

                let prevStatus: string | null = null;
                const logChain = stats.slice(0, i + 1);
                for (const s of logChain) {
                    const logUser = s === 'pending' ? null : (s === 'accepted' || s === 'in_production' || s === 'ready' ? userMap['baker'] : userMap['runner']);
                    await pool.query(
                        "INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by, created_at) VALUES ($1, $2, $3, $4, $5)",
                        [orderId, prevStatus, s, logUser || null, new Date(orderDate.getTime() + 1000 * 60 * 30)]
                    );
                    prevStatus = s;
                }

                await pool.query(
                    "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
                    [orderId, productIds[0], 2, Math.floor(PRODUCTS[0].price * 1.1)]
                );

                if (['shipping', 'delivered'].includes(currentStatus) && userMap['runner']) {
                    const startLat = -7.78;
                    const startLng = 110.37;
                    for (let j = 0; j < 5; j++) {
                        await pool.query(
                            "INSERT INTO runner_trail (user_id, order_id, lat, lng, created_at) VALUES ($1, $2, $3, $4, $5)",
                            [userMap['runner'], orderId, startLat + (j * 0.002), startLng + (j * 0.002), new Date(orderDate.getTime() + 1000 * 60 * 60 + (j * 300000))]
                        );
                    }
                }
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
