import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load from .env.local in development, or use environment variables in production
if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: ".env.local" });
}

// Product catalog with categories and prices
const PRODUCTS = [
    // Sourdough
    { name: "Soft Sourdough Coklat", category: "Sourdough", price: 25000 },
    { name: "Soft Sourdough Keju", category: "Sourdough", price: 26000 },
    { name: "Soft Sourdough Kacang", category: "Sourdough", price: 26000 },
    { name: "Soft Sourdough Blueberry Creamcheese", category: "Sourdough", price: 30000 },
    { name: "Sourdough Plain", category: "Sourdough", price: 35000 },
    { name: "Sourdough Garlic", category: "Sourdough", price: 32000 },
    { name: "Sourdough Rosemary", category: "Sourdough", price: 32000 },

    // Cookies
    { name: "Soft Cookies Choco", category: "Cookies", price: 15000 },
    { name: "Soft Cookies Red Velvet", category: "Cookies", price: 16000 },
    { name: "Brownies Cookies", category: "Cookies", price: 15000 },
    { name: "Choco Chip Cookies", category: "Cookies", price: 14000 },
    { name: "Almond Cookies", category: "Cookies", price: 18000 },

    // Bread
    { name: "Garlic Bread", category: "Bread", price: 20000 },
    { name: "Roti Sosis Cartepillar", category: "Bread", price: 22000 },
    { name: "Roti Sisir Keju", category: "Bread", price: 15000 },
    { name: "Roti Sisir Coklat Kacang", category: "Bread", price: 15000 },
    { name: "Roti Sisir Biscoff", category: "Bread", price: 18000 },
    { name: "Roti Sisir Coklat Keju", category: "Bread", price: 15000 },
    { name: "Roti Tawar Premium", category: "Bread", price: 12000 },
    { name: "Croissant Butter", category: "Bread", price: 25000 },
    { name: "Croissant Almond", category: "Bread", price: 28000 },

    // Pastry
    { name: "Choco Roll", category: "Pastry", price: 12000 },
    { name: "Bolo Bun", category: "Pastry", price: 12000 },
    { name: "Cinnamon Roll", category: "Pastry", price: 18000 },
    { name: "Danish Chocolate", category: "Pastry", price: 20000 },
    { name: "Danish Cheese", category: "Pastry", price: 20000 },
    { name: "Muffin Coklat", category: "Pastry", price: 18000 },
    { name: "Muffin Keju", category: "Pastry", price: 18000 },
    { name: "Muffin Blueberry", category: "Pastry", price: 19000 },

    // Beverages
    { name: "Iced Americano", category: "Beverage", price: 15000 },
    { name: "Hot Latte", category: "Beverage", price: 22000 },
    { name: "Iced Latte", category: "Beverage", price: 22000 },
    { name: "Cappuccino", category: "Beverage", price: 24000 },
    { name: "Matcha Latte", category: "Beverage", price: 25000 },
    { name: "Choco Latte", category: "Beverage", price: 23000 },
    { name: "Caramel Macchiato", category: "Beverage", price: 28000 },
    { name: "Earl Grey Tea", category: "Beverage", price: 18000 },
];

// Generate Picsum image URLs
function getImageUrl(seed: string) {
    return `https://picsum.photos/seed/${seed}/400/400`;
}

async function seed() {
    console.log("🌱 Seeding database with comprehensive data...");

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await pool.query("BEGIN");

        // Cleanup existing data
        console.log("🧹 Cleaning up existing data...");
        await pool.query("TRUNCATE TABLE stock_transactions, stock, order_items, orders, order_status_logs, products, outlets, brands CASCADE");
        await pool.query('TRUNCATE TABLE "session", "account", "verification", "user" CASCADE');

        // 0. Brands
        console.log("🏷️ Creating brands...");
        const brandsRes = await pool.query(`
            INSERT INTO brands (name, description) VALUES
            ('Toko Roema', 'Premium Artisan Bakery & Pastry'),
            ('Bake & Co', 'Modern Healthy Bread Division'),
            ('Roema Kopi', 'Specialty Coffee & Breakfast')
            RETURNING id, name;
        `);
        const brandsList = brandsRes.rows;
        console.log(`   ✓ Created ${brandsList.length} brands`);

        // 1. Outlets
        console.log("🏪 Creating outlets...");
        const outletsRes = await pool.query(`
            INSERT INTO outlets (name, contact_info, brand_id) VALUES
            ('YAP Cafe', '0812-1111-2222', ${brandsList[0].id}),
            ('Kael - Sender', '0812-3333-4444', ${brandsList[0].id}),
            ('Seken', '0812-5555-6666', ${brandsList[1].id}),
            ('Roema Kopi - Kebayoran', '0812-7777-8888', ${brandsList[2].id})
            RETURNING id, name;
        `);
        const outletMap = new Map(outletsRes.rows.map(o => [o.name, o.id]));
        const outletsList = outletsRes.rows;

        console.log(`   ✓ Created ${outletsList.length} outlets`);

        // 2. Products with images
        console.log("🍞 Creating products...");
        const productValues = PRODUCTS.map((p, i) => {
            const imageUrl = getImageUrl(`dapoer-roema-${p.name.toLowerCase().replace(/\s+/g, '-')}`);
            return `('${p.name}', '${p.category}', ${p.price}, '${imageUrl}')`;
        }).join(", ");

        const productsRes = await pool.query(`
            INSERT INTO products (name, category, base_price, image_url) VALUES
            ${productValues}
            RETURNING id, name, category;
        `);
        const productMap = new Map(productsRes.rows.map(p => [p.name, p.id]));
        const productsList = productsRes.rows;

        console.log(`   ✓ Created ${productsList.length} products`);

        // 3. Stock levels for Central Kitchen and all outlets
        console.log("📦 Creating stock levels...");
        const stockInserts: string[] = [];

        // Central Kitchen stock (outlet_id = NULL)
        productsList.forEach((p) => {
            const qty = 20 + Math.floor(Math.random() * 50); // 20-70 units
            const minStock = 10 + Math.floor(Math.random() * 10); // 10-20 min stock
            stockInserts.push(`(${p.id}, NULL, ${qty}, ${minStock})`);
        });

        // Stock for each outlet (100% availability guaranteed)
        outletsList.forEach((outlet) => {
            productsList.forEach((p) => {
                const qty = 5 + Math.floor(Math.random() * 30);
                const minStock = 5 + Math.floor(Math.random() * 10);
                stockInserts.push(`(${p.id}, ${outlet.id}, ${qty}, ${minStock})`);
            });
        });

        await pool.query(`
            INSERT INTO stock (product_id, outlet_id, quantity, min_stock) VALUES
            ${stockInserts.join(", ")}
        `);
        console.log(`   ✓ Created ${stockInserts.length} stock entries`);

        // 4. Stock transactions (history)
        console.log("📝 Creating stock transactions...");
        const transactionTypes = ["add", "deduct", "transfer_out", "transfer_in"];
        const transactionNotes = [
            "Initial stock",
            "Received from supplier",
            "Stock adjustment",
            "Transfer to outlet",
            "Transfer from warehouse",
            "Returned from order",
            "Damaged goods",
            "Expired items"
        ];

        const transactionsToInsert: string[] = [];
        const stockRes = await pool.query("SELECT id, product_id, outlet_id FROM stock");

        stockRes.rows.forEach((stock) => {
            // Add 1-5 transactions per stock entry
            const numTransactions = 1 + Math.floor(Math.random() * 5);
            for (let i = 0; i < numTransactions; i++) {
                const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
                const qty = 5 + Math.floor(Math.random() * 25);
                const notes = transactionNotes[Math.floor(Math.random() * transactionNotes.length)];
                const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days

                transactionsToInsert.push(`(${stock.product_id}, ${stock.outlet_id}, '${type}', ${qty}, '${notes}', NULL, '${createdAt.toISOString()}')`);
            }
        });

        await pool.query(`
            INSERT INTO stock_transactions (product_id, outlet_id, transaction_type, quantity, notes, reference_outlet_id, created_at) VALUES
            ${transactionsToInsert.slice(0, 100).join(", ")}
        `);
        console.log(`   ✓ Created ${Math.min(transactionsToInsert.length, 100)} stock transactions`);

        // 5. Orders with diverse statuses
        console.log("📋 Creating orders...");
        const statuses = ['pending', 'accepted', 'in_production', 'ready', 'shipping', 'delivered', 'cancelled'];
        const paymentMethods = ['cash', 'qris', 'transfer'];
        const paymentStatuses = ['paid', 'pending', 'failed'];

        const now = new Date();
        // Guarantee coverage: each outlet gets every status at least once
        const guaranteedOrders: { status: string; outlet: any }[] = [];
        for (const outlet of outletsList) {
            for (const status of statuses) {
                guaranteedOrders.push({ status, outlet });
            }
        }
        // Top up with random-outlet orders so we have at least 50 total
        const orderCount = Math.max(guaranteedOrders.length, 50);

        for (let i = 0; i < orderCount; i++) {
            const { status, outlet } = i < guaranteedOrders.length
                ? guaranteedOrders[i]
                : { status: statuses[i % statuses.length], outlet: outletsList[Math.floor(Math.random() * outletsList.length)] };

            const orderDate = new Date(now.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000));

            let sentAt = null, readyAt = null, shippedAt = null, deliveredAt = null;

            // Set timestamps based on status
            if (status !== 'pending' && status !== 'cancelled') {
                sentAt = new Date(orderDate.getTime() + 30 * 60 * 1000);
            }
            if (['in_production', 'ready', 'shipping', 'delivered'].includes(status)) {
                readyAt = new Date(sentAt!.getTime() + 2 * 60 * 60 * 1000);
            }
            if (['shipping', 'delivered'].includes(status)) {
                shippedAt = new Date(readyAt!.getTime() + 1 * 60 * 60 * 1000);
            }
            if (status === 'delivered') {
                deliveredAt = new Date(shippedAt!.getTime() + 30 * 60 * 1000);
            }

            // Calculate amounts
            const itemCount = 1 + Math.floor(Math.random() * 4);
            let subtotal = 0;
            const items: { product_id: number; quantity: number }[] = [];

            for (let j = 0; j < itemCount; j++) {
                const product = productsList[Math.floor(Math.random() * productsList.length)];
                const qty = 2 + Math.floor(Math.random() * 15);
                subtotal += product.category === 'Sourdough' ? 35000 :
                    product.category === 'Bread' ? 15000 :
                        product.category === 'Cookies' ? 15000 :
                            product.category === 'Pastry' ? 18000 : 22000;
                subtotal *= qty;
                items.push({ product_id: product.id, quantity: qty });
            }

            const hasDiscount = Math.random() > 0.7;
            const discountType = hasDiscount ? (Math.random() > 0.5 ? 'percentage' : 'fixed') : null;
            const discountAmount = hasDiscount ? (discountType === 'percentage' ? 10 : 15000) : 0;
            const totalAmount = Math.max(0, subtotal - (discountType === 'percentage' ? subtotal * discountAmount / 100 : discountAmount));

            const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            const paymentStatus = status === 'cancelled' ? 'failed' : paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];

            const orderRes = await pool.query(`
                INSERT INTO orders (
                    outlet_id, status, payment_status, payment_method,
                    discount_type, discount_amount, subtotal, total_amount,
                    order_date, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id;
            `, [
                outlet.id, status, paymentStatus, paymentMethod,
                discountType, discountAmount, subtotal, totalAmount,
                orderDate.toISOString(),
                orderDate.toISOString(),
                orderDate.toISOString()
            ]);

            const orderId = orderRes.rows[0].id;

            // Insert order items
            for (const item of items) {
                await pool.query(`
                    INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3);
                `, [orderId, item.product_id, item.quantity]);
            }

            // Seed status log: initial creation + current status (if not pending)
            await pool.query(`
                INSERT INTO order_status_logs (order_id, from_status, to_status, created_at)
                VALUES ($1, NULL, 'pending', $2);
            `, [orderId, orderDate.toISOString()]);

            if (status !== 'pending') {
                await pool.query(`
                    INSERT INTO order_status_logs (order_id, from_status, to_status, created_at)
                    VALUES ($1, 'pending', $2, $3);
                `, [orderId, status, new Date(orderDate.getTime() + 30 * 60 * 1000).toISOString()]);
            }
        }

        console.log(`   ✓ Created ${orderCount} orders (${outletsList.length} outlets × ${statuses.length} statuses guaranteed + extras)`);

        // Commit the transaction first so outlets are visible for foreign key constraints
        await pool.query("COMMIT");

        // 6. Users with roles (separate transaction after outlets are committed)
        console.log("👥 Creating users...");
        const { auth } = await import("../lib/auth");

        const USERS = [
            { name: "Admin", email: "admin@test.app", password: "Password123!", role: "admin", outlet: "YAP Cafe" },
            { name: "Baker", email: "baker@test.app", password: "Password123!", role: "baker", outlet: null },
            { name: "Runner", email: "runner@test.app", password: "Password123!", role: "runner", outlet: null },
            { name: "User", email: "user@test.app", password: "Password123!", role: "user", outlet: "YAP Cafe" },
        ];

        for (const u of USERS) {
            try {
                const result = await auth.api.signUpEmail({
                    body: {
                        name: u.name,
                        email: u.email,
                        password: u.password,
                    },
                });

                if (result?.user) {
                    const outletId = u.outlet ? outletMap.get(u.outlet) : null;
                    await pool.query(
                        `UPDATE "user" SET role = $1, "current_outlet_id" = $2 WHERE id = $3`,
                        [u.role, outletId, result.user.id]
                    );
                    console.log(`   ✓ Created ${u.email} (${u.role})`);
                }
            } catch (e: any) {
                console.error(`   ✗ Failed to create ${u.email}:`, e?.message || e);
            }
        }
        console.log("\n✅ Seed complete successfully!");
        console.log("\n📊 Summary:");
        console.log(`   - Outlets: ${outletsList.length}`);
        console.log(`   - Products: ${productsList.length}`);
        console.log(`   - Stock entries: ${stockInserts.length}`);
        console.log(`   - Orders: ${orderCount}`);
        console.log(`   - Users: ${USERS.length}`);
        console.log("\n🔐 Login credentials:");
        console.log(`   Email: admin@test.app | Password: Password123!`);

    } catch (e) {
        await pool.query("ROLLBACK");
        console.error("❌ Seed failed:", e);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seed().catch((e) => {
    console.error("Seed script fatal error:", e);
    process.exit(1);
});
