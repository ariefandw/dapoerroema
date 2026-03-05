import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function seed() {
    console.log("Seeding database with enriched and diverse data...");

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await pool.query("BEGIN");

        // Cleanup existing data to avoid conflicts on re-seed
        await pool.query("TRUNCATE TABLE order_items, orders, products, outlets CASCADE");

        // 1. Outlets (9 from spreadsheet + 3 extra)
        const outletsRes = await pool.query(`
            INSERT INTO outlets (name, contact_info) VALUES 
            ('YAP Cafe', '0812-1111-2222'),
            ('Seken', '0812-3333-4444'),
            ('Soragan', '0812-5555-6666'),
            ('Kusumanegara', '0812-7777-8888'),
            ('Batikan', '0812-9999-0000'),
            ('Kael', '0813-1111-2222'),
            ('UNY', '0813-3333-4444'),
            ('Emma', '0813-5555-6666'),
            ('Nusantara', '0813-7777-8888'),
            ('Malioboro', '0814-1111-2222'),
            ('Jakal', '0814-3333-4444'),
            ('Godean', '0814-5555-6666')
            RETURNING id, name;
        `);
        const outletMap = new Map(outletsRes.rows.map(o => [o.name, o.id]));

        // 2. Products (16 from spreadsheet + extras)
        const productsRes = await pool.query(`
            INSERT INTO products (name, category, base_price) VALUES 
            ('Soft Sourdough Coklat', 'Sourdough', 25000),
            ('Soft Sourdough Keju', 'Sourdough', 26000),
            ('Soft Sourdough Kacang', 'Sourdough', 26000),
            ('Soft Sourdough Blueberry Creamcheese', 'Sourdough', 30000),
            ('Soft Cookies Choco', 'Cookies', 15000),
            ('Soft Cookies Red Velvet', 'Cookies', 16000),
            ('Garlic Bread', 'Bread', 20000),
            ('Brownies Cookies', 'Cookies', 15000),
            ('Roti Sosis Cartepillar', 'Bread', 22000),
            ('Muffin Coklat', 'Pastry', 18000),
            ('Roti Sisir Keju', 'Bread', 15000),
            ('Roti Sisir Coklat Kacang', 'Bread', 15000),
            ('Roti Sisir Biscoff', 'Bread', 18000),
            ('Roti Sisir Coklat Keju', 'Bread', 15000),
            ('Choco Roll', 'Pastry', 12000),
            ('Bolo Bun', 'Pastry', 12000),
            ('Sourdough Plain', 'Sourdough', 35000),
            ('Cinnamon Roll', 'Pastry', 18000),
            ('Iced Americano', 'Beverage', 15000),
            ('Hot Latte', 'Beverage', 22000)
            RETURNING id, name;
        `);
        const productMap = new Map(productsRes.rows.map(p => [p.name, p.id]));

        // 3. Orders with Diverse Statuses
        const statuses = ['Draft', 'Sent to Baker', 'Production Ready', 'Shipped', 'Delivered'];
        const outletsList = ['YAP Cafe', 'Seken', 'Soragan', 'Kusumanegara', 'Batikan', 'Kael', 'UNY', 'Emma', 'Nusantara', 'Malioboro', 'Jakal', 'Godean'];

        const now = new Date();

        for (let i = 0; i < 20; i++) {
            const status = statuses[i % statuses.length];
            const outletName = outletsList[Math.floor(Math.random() * outletsList.length)];
            const outletId = outletMap.get(outletName);

            const orderDate = new Date(now.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000)); // Within last 7 days

            let sentAt = null, readyAt = null, shippedAt = null, deliveredAt = null;

            if (status !== 'Draft') {
                sentAt = new Date(orderDate.getTime() + 60 * 60 * 1000).toISOString();
            }
            if (['Production Ready', 'Shipped', 'Delivered'].includes(status)) {
                readyAt = new Date(new Date(sentAt!).getTime() + 4 * 60 * 60 * 1000).toISOString();
            }
            if (['Shipped', 'Delivered'].includes(status)) {
                shippedAt = new Date(new Date(readyAt!).getTime() + 1 * 60 * 60 * 1000).toISOString();
            }
            if (status === 'Delivered') {
                deliveredAt = new Date(new Date(shippedAt!).getTime() + 30 * 60 * 1000).toISOString();
            }

            const orderRes = await pool.query(`
                INSERT INTO orders (outlet_id, order_date, status, sent_to_baker_at, production_ready_at, shipped_at, delivered_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id;
            `, [outletId, orderDate.toISOString(), status, sentAt, readyAt, shippedAt, deliveredAt]);

            const orderId = orderRes.rows[0].id;

            // Add 1-3 random items to each order
            const itemCount = 1 + Math.floor(Math.random() * 3);
            const productNames = Array.from(productMap.keys());
            for (let j = 0; j < itemCount; j++) {
                const prodName = productNames[Math.floor(Math.random() * productNames.length)];
                const prodId = productMap.get(prodName);
                const qty = 5 + Math.floor(Math.random() * 20);

                await pool.query(`
                    INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3);
                `, [orderId, prodId, qty]);
            }
        }

        await pool.query("COMMIT");
        console.log("Enriched seed complete.");
    } catch (e) {
        await pool.query("ROLLBACK");
        console.error("Seed failed:", e);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seed();
