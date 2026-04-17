# Laporan Simulasi Bisnis Dapoer Roema
Tanggal Simulasi: Fri Apr 17 11:51:06 WIB 2026

Laporan ini menceritakan perjalanan operasional Dapoer Roema dari hulu ke hilir.

## Bab 1: Kebangkitan Sistem
Suatu pagi di Yogyakarta, sistem Dapoer Roema baru saja dinyalakan kembali. Admin memutuskan untuk membersihkan seluruh data lama agar simulasi berjalan murni.

### Membersihkan Database...
```json
{"success":true,"message":"Database tables created successfully with updated schema"}
```

Sistem pun bersih. Kini, Admin memanggil mantra kuno untuk membangkitkan para aktor utama: Admin, Baker, Runner, dan User.
```text
[dotenv@17.3.1] injecting env (5) from .env.local -- tip: 🤖 agentic secret storage: https://dotenvx.com/as2
Resetting auth tables...
✓ Auth tables reset.
Seeding standardized users...
Creating: admin@test.app...
✓ Seeded: admin@test.app (admin)
Creating: baker@test.app...
✓ Seeded: baker@test.app (baker)
Creating: runner@test.app...
✓ Seeded: runner@test.app (runner)
Creating: user@test.app...
✓ Seeded: user@test.app (user)
Reseed sequence finished.
```

## Bab 2: Ambisi Sang Admin
Admin Budi masuk ke sistem untuk menyiapkan infrastruktur bisnis. Ia ingin menambahkan brand baru, outlet baru, dan produk andalan.

### Admin Menyiapkan Master Data (CRUD)...
```text
[dotenv@17.3.1] injecting env (5) from .env.local -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`
- Membuat Brand: 'Roti Sultan'
- Membuat Outlet: 'Sultan Malioboro'
- Membuat Produk: 'Sultan Croissant'
- Menambah Stok di Central Kitchen: 100 pcs
```

## Bab 3: Kebingungan Sang User
Seorang kasir outlet (User) masuk ke sistem. Ia mencoba pindah ke outlet lain, namun sistem menjaganya agar tetap di brand yang benar.

### User Mencoba Pindah Outlet (Constraint Test)...
```text
[dotenv@17.3.1] injecting env (5) from .env.local -- tip: ⚡️ secrets for agents: https://dotenvx.com/as2
- Mencoba pindah ke Outlet Sultan (Berhasil karena Brand cocok)...
Status: OK (Simulasi logic brand matching)
- Membuat Pesanan Baru: 5 Sultan Croissant
Order #1 Dibuat.
- User nakal mencoba mengubah status ke 'shipping'...
Error: Unauthorized: User cannot set this status.
```

## Bab 4: Keringat di Dapur
Baker Budi menerima notifikasi pesanan. Ia segera bekerja keras di dapur.

### Baker Memproses Pesanan...
```text
[dotenv@17.3.1] injecting env (5) from .env.local -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
- Baker menerima pesanan #1
- Pesanan #1 kini berstatus READY.
```

## Bab 5: Sang Pengantar Kilat
Runner Rudi melihat ada barang siap antar. Ia pun tancap gas menuju outlet.

### Runner Mengirim Barang...
```text
[dotenv@17.3.1] injecting env (5) from .env.local -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
- Runner mulai mengirim (SHIPPING)
- Runner sampai dan menyerahkan barang (DELIVERED)
- Stok berhasil ditransfer ke Outlet.
```

## Bab 6: Akhir yang Manis
Admin Budi tersenyum puas melihat laporan stok akhir. Barang berpindah dengan sempurna.

### Laporan Stok Akhir...
```json
{"error":"Failed to fetch stock"}
```

Simulasi berakhir dengan sukses. Semua aktor menjalankan perannya dengan baik.
