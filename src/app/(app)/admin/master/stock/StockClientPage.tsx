"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Warehouse, AlertTriangle, RefreshCw, AlertCircle, TrendingUp } from "lucide-react";
import { StockDialog } from "./StockDialog";
import { StockTransferDialog } from "./StockTransferDialog";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/PageContainer";
import { useGlobalState } from "@/lib/GlobalStateProvider";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch');
    return data;
});

interface StockClientPageProps {
    initialStock: any[];
    products: any[];
    outlets: any[];
    userRole: string;
    currentOutletId: number | null;
}

export function StockClientPage({ initialStock, products, outlets, userRole, currentOutletId }: StockClientPageProps) {
    const { revalidateStock } = useGlobalState();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filter outlets based on user role
    const filteredOutlets = userRole === "user"
        ? outlets.filter(o => o.id === currentOutletId)
        : outlets;

    const { data: stockLevels = initialStock, mutate } = useSWR(
        '/api/stock',
        fetcher,
        {
            fallbackData: initialStock,
            refreshInterval: 5000,
            revalidateOnFocus: true,
        }
    );

    // Calculate low stock alerts
    const lowStockAlerts = stockLevels.filter((s: any) => s.is_low_stock);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await mutate();
            toast.success("Data stok diperbarui");
        } catch (error) {
            toast.error("Gagal memperbarui data stok");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleStockUpdate = () => {
        // Revalidate stock after any stock update
        mutate();
        revalidateStock();
    };

    const getLocationName = (outletId: number | null, outletName: string | null) => {
        if (outletId === null) return "Central Kitchen";
        return outletName || `Outlet #${outletId}`;
    };

    const getStatusBadge = (quantity: number, minStock: number) => {
        if (quantity === 0) {
            return (
                <Badge variant="destructive" className="text-sm uppercase font-bold">
                    Kosong
                </Badge>
            );
        }
        if (quantity < minStock) {
            return (
                <Badge variant="outline" className="text-sm uppercase font-bold border-orange-500 text-orange-500">
                    Stok Rendah
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="text-sm uppercase font-bold border-green-500 text-green-500">
                Aman
            </Badge>
        );
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
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <StockTransferDialog
                        products={products}
                        outlets={filteredOutlets}
                        userRole={userRole}
                        currentOutletId={currentOutletId}
                        onSuccess={handleStockUpdate}
                    >
                        <Button variant="outline" size="sm" className="gap-2">
                            <ArrowRight className="h-4 w-4" /> Transfer Stok
                        </Button>
                    </StockTransferDialog>
                    <StockDialog
                        products={products}
                        outlets={filteredOutlets}
                        userRole={userRole}
                        currentOutletId={currentOutletId}
                        onSuccess={handleStockUpdate}
                    >
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
                            {lowStockAlerts.slice(0, 5).map((alert: any) => (
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
                            <TableHead>Outlet</TableHead>
                            <TableHead className="text-right">Stok</TableHead>
                            <TableHead className="text-right">Min. Stok</TableHead>
                            <TableHead className="text-right">Shelf Life</TableHead>
                            <TableHead className="text-right">Tgl Stok</TableHead>
                            <TableHead className="text-right">Up Selling</TableHead>
                            <TableHead className="text-right">Expired</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stockLevels.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                                    Belum ada data stok. Tambahkan stok untuk memulai.
                                </TableCell>
                            </TableRow>
                        ) : (
                            stockLevels.map((stockItem: any) => (
                                <TableRow
                                    key={stockItem.id}
                                    className={stockItem.is_low_stock ? "bg-orange-500/5" : undefined}
                                >
                                    <TableCell className="font-medium">
                                        {stockItem.product_name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {stockItem.outlet_id === null ? (
                                                <Warehouse className="h-3 w-3 text-muted-foreground" />
                                            ) : null}
                                            {getLocationName(stockItem.outlet_id, stockItem.outlet_name)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums font-medium">
                                        {stockItem.quantity}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">
                                        {stockItem.min_stock}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">
                                        {stockItem.shelf_life ? `${stockItem.shelf_life} hari` : "-"}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">
                                        {stockItem.stock_date ? new Date(stockItem.stock_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {stockItem.up_selling_qty > 0 ? (
                                            <Badge variant="outline" className="text-xs border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                                {stockItem.up_selling_qty}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {stockItem.expired_qty > 0 ? (
                                            <Badge variant="outline" className="text-xs border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20">
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                {stockItem.expired_qty}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(stockItem.quantity, stockItem.min_stock)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <StockDialog
                                                products={products}
                                                outlets={filteredOutlets}
                                                userRole={userRole}
                                                currentOutletId={currentOutletId}
                                                stock={{
                                                    id: stockItem.id,
                                                    product_id: stockItem.product_id,
                                                    product_name: stockItem.product_name,
                                                    outlet_id: stockItem.outlet_id,
                                                    outlet_name: stockItem.outlet_name,
                                                    quantity: stockItem.quantity,
                                                    min_stock: stockItem.min_stock,
                                                    shelf_life: stockItem.shelf_life,
                                                    stock_date: stockItem.stock_date,
                                                }}
                                                onSuccess={handleStockUpdate}
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
                        {products
                            .filter((p) => !stockLevels.some((s: any) => s.product_id === p.id))
                            .map((product) => (
                                <StockDialog
                                    key={product.id}
                                    products={products}
                                    outlets={filteredOutlets}
                                    userRole={userRole}
                                    currentOutletId={currentOutletId}
                                    initialProductId={product.id}
                                    onSuccess={handleStockUpdate}
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
