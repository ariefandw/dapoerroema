"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus, History, Warehouse } from "lucide-react";
import { ReceivingDialog } from "./ReceivingDialog";
import { getProducts } from "@/app/actions";
import { getReceivingHistory } from "@/app/actions/receiving";

interface Product {
    id: number;
    name: string;
    category: string;
}

interface ReceivingHistoryItem {
    id: number;
    product_name: string;
    quantity: number;
    notes: string | null;
    created_at: Date;
}

interface ReceivingContentProps {
    products: Product[];
    initialHistory: ReceivingHistoryItem[];
}

export function ReceivingContent({ products, initialHistory }: ReceivingContentProps) {
    const [history, setHistory] = useState<ReceivingHistoryItem[]>(initialHistory);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleRefresh = async () => {
        const [productsData, historyData] = await Promise.all([
            getProducts(),
            getReceivingHistory(20),
        ]);
        setHistory(historyData);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Warehouse className="h-6 w-6 text-primary" />
                        Penerimaan Barang
                    </h1>
                    <p className="text-muted-foreground">
                        Catat barang masuk dari supplier ke Central Kitchen
                    </p>
                </div>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Catat Penerimaan
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription>Total Penerimaan</CardDescription>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{history.length}</div>
                        <p className="text-xs text-muted-foreground">transaksi tercatat</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription>Total Barang</CardDescription>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {history.reduce((sum, h) => sum + h.quantity, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">unit diterima</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription>Produk Terdaftar</CardDescription>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{products.length}</div>
                        <p className="text-xs text-muted-foreground">jenis produk</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent History */}
            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Penerimaan Terbaru</CardTitle>
                    <CardDescription>20 transaksi penerimaan terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Belum ada riwayat penerimaan</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{item.product_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.notes || "Tanpa catatan"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">+{item.quantity}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(item.created_at).toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <ReceivingDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) handleRefresh();
                }}
                products={products}
            />
        </div>
    );
}
