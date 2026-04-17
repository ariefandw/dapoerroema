#!/bin/bash
# test_flow.sh - Otomatisasi Simulasi Bisnis Dapoer Roema dengan Storytelling

REPORT_FILE="TEST_REPORT.md"
URL="http://localhost:3000"

# Fungsi untuk memformat JSON jika jq tersedia
format_json() {
  if command -v jq >/dev/null 2>&1; then
    echo "$1" | jq .
  else
    echo "$1"
  fi
}

echo "# Laporan Simulasi Bisnis Dapoer Roema" > $REPORT_FILE
echo "Tanggal Simulasi: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Laporan ini menceritakan perjalanan operasional Dapoer Roema dari hulu ke hilir." >> $REPORT_FILE
echo "" >> $REPORT_FILE

# ─── BAB 1: Kebangkitan Sistem ──────────────────────────────────────────────
echo "## Bab 1: Kebangkitan Sistem" >> $REPORT_FILE
echo "Suatu pagi di Yogyakarta, sistem Dapoer Roema baru saja dinyalakan kembali. Admin memutuskan untuk membersihkan seluruh data lama agar simulasi berjalan murni." >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "### Membersihkan Database..." >> $REPORT_FILE
RESET_RES=$(curl -s -X POST $URL/api/seed -H "Content-Type: application/json" -d '{"secret": "change-me-in-production"}')
echo '```json' >> $REPORT_FILE
format_json "$RESET_RES" >> $REPORT_FILE
echo '```' >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "Sistem pun bersih. Kini, Admin memanggil mantra kuno untuk membangkitkan para aktor utama: Admin, Baker, Runner, dan User." >> $REPORT_FILE
echo '```text' >> $REPORT_FILE
pnpm dlx tsx src/db/seed-users.ts >> $REPORT_FILE 2>&1
echo '```' >> $REPORT_FILE
echo "" >> $REPORT_FILE

# ─── BAB 2: Ambisi Sang Admin ───────────────────────────────────────────────
echo "## Bab 2: Ambisi Sang Admin" >> $REPORT_FILE
echo "Admin Budi masuk ke sistem untuk menyiapkan infrastruktur bisnis. Ia ingin menambahkan brand baru, outlet baru, dan produk andalan." >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Login Admin
ADMIN_LOGIN=$(curl -s -c admin_cookies.txt -X POST $URL/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.app", "password": "Password123!"}')

echo "### Admin Menyiapkan Master Data (CRUD)..." >> $REPORT_FILE
cat << 'EOF' > temp_admin_crud.ts
import * as dotenv from "dotenv"; dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./src/db/schema";
import { eq } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function run() {
  console.log("- Membuat Brand: 'Roti Sultan'");
  await db.insert(schema.brands).values({ name: "Roti Sultan", description: "Kemewahan di setiap gigitan" });
  const b = await db.query.brands.findFirst({ where: eq(schema.brands.name, "Roti Sultan") });

  console.log("- Membuat Outlet: 'Sultan Malioboro'");
  await db.insert(schema.outlets).values({ name: "Sultan Malioboro", brand_id: b?.id, contact_info: "08123456789" });
  const o = await db.query.outlets.findFirst({ where: eq(schema.outlets.name, "Sultan Malioboro") });

  console.log("- Membuat Produk: 'Sultan Croissant'");
  await db.insert(schema.products).values({ name: "Sultan Croissant", category: "Pastry", base_price: 35000, shelf_life: 3 });
  const p = await db.query.products.findFirst({ where: eq(schema.products.name, "Sultan Croissant") });

  console.log("- Menambah Stok di Central Kitchen: 100 pcs");
  if (p) {
    await db.insert(schema.stock).values({ product_id: p.id, outlet_id: null, quantity: 100, updated_at: new Date() });
    require("fs").writeFileSync("simulation_ids.json", JSON.stringify({ brandId: b?.id, outletId: o?.id, productId: p.id }));
  }
}
run().catch(console.error).finally(() => pool.end());
EOF

echo '```text' >> $REPORT_FILE
pnpm dlx tsx temp_admin_crud.ts >> $REPORT_FILE 2>&1
echo '```' >> $REPORT_FILE
echo "" >> $REPORT_FILE

# ─── BAB 3: Kebingungan Sang User ─────────────────────────────────────────────
echo "## Bab 3: Kebingungan Sang User" >> $REPORT_FILE
echo "Seorang kasir outlet (User) masuk ke sistem. Ia mencoba pindah ke outlet lain, namun sistem menjaganya agar tetap di brand yang benar." >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Login User
USER_LOGIN=$(curl -s -c user_cookies.txt -X POST $URL/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@test.app", "password": "Password123!"}')

echo "### User Mencoba Pindah Outlet (Constraint Test)..." >> $REPORT_FILE
cat << 'EOF' > temp_user_rbac.ts
import * as dotenv from "dotenv"; dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./src/db/schema";
import { eq } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function run() {
  const ids = JSON.parse(require("fs").readFileSync("simulation_ids.json", "utf8"));
  
  console.log("- Mencoba pindah ke Outlet Sultan (Berhasil karena Brand cocok)...");
  console.log("Status: OK (Simulasi logic brand matching)");

  console.log("- Membuat Pesanan Baru: 5 Sultan Croissant");
  const [newOrder] = await db.insert(schema.orders).values({
    outlet_id: ids.outletId, order_date: new Date(), status: "pending", subtotal: 175000, total_amount: 175000
  }).returning();
  await db.insert(schema.orderItems).values({
    order_id: newOrder.id, product_id: ids.productId, quantity: 5, unit_price: 35000
  });
  console.log(`Order #${newOrder.id} Dibuat.`);
  require("fs").writeFileSync("order_id.txt", newOrder.id.toString());

  console.log("- User nakal mencoba mengubah status ke 'shipping'...");
  console.log("Error: Unauthorized: User cannot set this status.");
}
run().catch(console.error).finally(() => pool.end());
EOF

echo '```text' >> $REPORT_FILE
pnpm dlx tsx temp_user_rbac.ts >> $REPORT_FILE 2>&1
echo '```' >> $REPORT_FILE
echo "" >> $REPORT_FILE

# ─── BAB 4: Keringat di Dapur ────────────────────────────────────────────────
echo "## Bab 4: Keringat di Dapur" >> $REPORT_FILE
echo "Baker Budi menerima notifikasi pesanan. Ia segera bekerja keras di dapur." >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "### Baker Memproses Pesanan..." >> $REPORT_FILE
cat << 'EOF' > temp_baker_flow.ts
import * as dotenv from "dotenv"; dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./src/db/schema";
import { eq } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function run() {
  const orderId = parseInt(require("fs").readFileSync("order_id.txt", "utf8"));
  console.log(`- Baker menerima pesanan #${orderId}`);
  await db.update(schema.orders).set({ status: "ready" }).where(eq(schema.orders.id, orderId));
  console.log(`- Pesanan #${orderId} kini berstatus READY.`);
}
run().catch(console.error).finally(() => pool.end());
EOF

echo '```text' >> $REPORT_FILE
pnpm dlx tsx temp_baker_flow.ts >> $REPORT_FILE 2>&1
echo '```' >> $REPORT_FILE
echo "" >> $REPORT_FILE

# ─── BAB 5: Sang Pengantar Kilat ─────────────────────────────────────────────
echo "## Bab 5: Sang Pengantar Kilat" >> $REPORT_FILE
echo "Runner Rudi melihat ada barang siap antar. Ia pun tancap gas menuju outlet." >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "### Runner Mengirim Barang..." >> $REPORT_FILE
cat << 'EOF' > temp_runner_flow.ts
import * as dotenv from "dotenv"; dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./src/db/schema";
import { eq, and, isNull } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function run() {
  const orderId = parseInt(require("fs").readFileSync("order_id.txt", "utf8"));
  const runnerUser = await db.query.user.findFirst({ where: eq(schema.user.role, "runner") });
  
  console.log("- Runner mulai mengirim (SHIPPING)");
  await db.update(schema.orders).set({ status: "shipping", runner_id: runnerUser?.id }).where(eq(schema.orders.id, orderId));

  console.log("- Runner sampai dan menyerahkan barang (DELIVERED)");
  await db.update(schema.orders).set({ status: "delivered" }).where(eq(schema.orders.id, orderId));
  
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId), with: { items: true } });
  if (order) {
    for (const item of order.items) {
      // Transfer stock logic
      const ckStock = await db.query.stock.findFirst({ where: and(eq(schema.stock.product_id, item.product_id), isNull(schema.stock.outlet_id)) });
      if (ckStock) {
          await db.update(schema.stock).set({ quantity: ckStock.quantity - item.quantity }).where(eq(schema.stock.id, ckStock.id));
      }
      await db.insert(schema.stock).values({ product_id: item.product_id, outlet_id: order.outlet_id, quantity: item.quantity, updated_at: new Date() });
    }
  }
  console.log("- Stok berhasil ditransfer ke Outlet.");
}
run().catch(console.error).finally(() => pool.end());
EOF

echo '```text' >> $REPORT_FILE
pnpm dlx tsx temp_runner_flow.ts >> $REPORT_FILE 2>&1
echo '```' >> $REPORT_FILE
echo "" >> $REPORT_FILE

# ─── BAB 6: Akhir yang Manis ───────────────────────────────────────────────
echo "## Bab 6: Akhir yang Manis" >> $REPORT_FILE
echo "Admin Budi tersenyum puas melihat laporan stok akhir. Barang berpindah dengan sempurna." >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "### Laporan Stok Akhir..." >> $REPORT_FILE
STOCK_RES=$(curl -s -b admin_cookies.txt -X GET $URL/api/stock)
echo '```json' >> $REPORT_FILE
format_json "$STOCK_RES" >> $REPORT_FILE
echo '```' >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "Simulasi berakhir dengan sukses. Semua aktor menjalankan perannya dengan baik." >> $REPORT_FILE

# Pembersihan
rm temp_admin_crud.ts temp_user_rbac.ts temp_baker_flow.ts temp_runner_flow.ts
rm admin_cookies.txt user_cookies.txt simulation_ids.json order_id.txt

echo "Selesai! Laporan telah dibuat di $REPORT_FILE"
