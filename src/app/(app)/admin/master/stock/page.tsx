import { db } from "@/db";
import { products, outlets } from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Warehouse, AlertTriangle } from "lucide-react";
import { StockDialog } from "./StockDialog";
import { StockTransferDialog } from "./StockTransferDialog";
import { getStockLevels, getLowStockAlerts } from "@/app/actions/stock";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/PageContainer";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  await requireRole(["admin"]);

  const allProducts = await db.select().from(products).orderBy(products.category, products.name);
  const allOutlets = await db.select().from(outlets).orderBy(outlets.name);

  const stockLevels = await getStockLevels();
  const lowStockAlerts = await getLowStockAlerts();

  const getLocationName = (outletId: number | null, outletName: string | null) => {
    if (outletId === null) return "Central Kitchen";
    return outletName || `Outlet #${outletId}`;
  };

  const getStatusBadge = (quantity: number, minStock: number) => {
    if (quantity === 0) {
      return (
        <Badge variant="destructive" className="text-[10px] uppercase tracking-wider font-bold">
          Kosong
        </Badge>
      );
    }
    if (quantity < minStock) {
      return (
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold border-orange-500 text-orange-500">
          Stok Rendah
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold border-green-500 text-green-500">
        Aman
      </Badge>
    );
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      add: "Penambahan",
      deduct: "Pengurangan",
      transfer_out: "Transfer Keluar",
      transfer_in: "Transfer Masuk",
    };
    return labels[type] || type;
  };

  return (
    <PageContainer className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-primary" />
            Stok Produk
          </h1>
          <p className="text-muted-foreground text-sm">
            Kelola stok di gudang pusat dan setiap outlet
          </p>
        </div>
        <div className="flex gap-2">
          <StockTransferDialog products={allProducts} outlets={allOutlets}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowRight className="h-4 w-4" /> Transfer Stok
            </Button>
          </StockTransferDialog>
          <StockDialog products={allProducts} outlets={allOutlets}>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Stok
            </Button>
          </StockDialog>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockAlerts.length > 0 && (
        <div className="rounded-md border border-orange-500/50 bg-orange-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-orange-700 dark:text-orange-400">
              Peringatan Stok Rendah
            </h3>
            <p className="text-sm text-orange-600 dark:text-orange-500 mt-1">
              {lowStockAlerts.length} item di bawah batas minimum stok
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {lowStockAlerts.slice(0, 5).map((alert) => (
                <Badge key={alert.id} variant="outline" className="text-xs border-orange-500/50 text-orange-700 dark:text-orange-400">
                  {alert.product_name} ({getLocationName(alert.outlet_id, alert.outlet_name)}): {alert.quantity}
                </Badge>
              ))}
              {lowStockAlerts.length > 5 && (
                <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-700 dark:text-orange-400">
                  +{lowStockAlerts.length - 5} lainnya
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stock Table */}
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead className="text-right">Min. Stok</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockLevels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Belum ada data stok. Tambahkan stok untuk memulai.
                </TableCell>
              </TableRow>
            ) : (
              stockLevels.map((stock) => (
                <TableRow
                  key={stock.id}
                  className={stock.is_low_stock ? "bg-orange-500/5" : undefined}
                >
                  <TableCell className="font-medium">
                    {stock.product_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {stock.outlet_id === null ? (
                        <Warehouse className="h-3 w-3 text-muted-foreground" />
                      ) : null}
                      {getLocationName(stock.outlet_id, stock.outlet_name)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {stock.quantity}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {stock.min_stock}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(stock.quantity, stock.min_stock)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <StockDialog
                        products={allProducts}
                        outlets={allOutlets}
                        stock={{
                          id: stock.id,
                          product_id: stock.product_id,
                          product_name: stock.product_name,
                          outlet_id: stock.outlet_id,
                          outlet_name: stock.outlet_name,
                          quantity: stock.quantity,
                          min_stock: stock.min_stock,
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Edit
                        </Button>
                      </StockDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Products without stock */}
      {stockLevels.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            Produk Belum Memiliki Stok
          </h3>
          <div className="flex flex-wrap gap-2">
            {allProducts
              .filter((p) => !stockLevels.some((s) => s.product_id === p.id))
              .map((product) => (
                <StockDialog
                  key={product.id}
                  products={allProducts}
                  outlets={allOutlets}
                  initialProductId={product.id}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    + {product.name}
                  </Button>
                </StockDialog>
              ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
