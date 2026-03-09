"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Save, RotateCcw } from "lucide-react";
import { updateBrandPrice } from "@/app/actions/master";
import { toast } from "sonner";

interface Product {
    id: number;
    name: string;
    category: string;
    base_price: number;
}

interface BrandPriceListProps {
    brandId: number;
    products: Product[];
    initialPrices: { product_id: number; price: number }[];
}

export function BrandPriceList({ brandId, products, initialPrices }: BrandPriceListProps) {
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState<number | null>(null);
    const [prices, setPrices] = useState<Record<number, string>>(() => {
        const p: Record<number, string> = {};
        initialPrices.forEach(ip => {
            p[ip.product_id] = ip.price.toString();
        });
        return p;
    });

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    async function handleUpdatePrice(productId: number) {
        const priceStr = prices[productId];
        if (priceStr === undefined || priceStr === "") {
            // If empty, we might want to delete the override, but for now we just don't allow it
            // or the user can just set it back to base price.
            toast.error("Harga tidak boleh kosong");
            return;
        }

        const price = parseInt(priceStr);
        if (isNaN(price)) return;

        setSaving(productId);
        try {
            await updateBrandPrice(brandId, productId, price);
            toast.success("Harga berhasil diperbarui");
        } catch (error) {
            toast.error("Gagal memperbarui harga");
        } finally {
            setSaving(null);
        }
    }

    function resetPrice(productId: number, basePrice: number) {
        setPrices(prev => ({
            ...prev,
            [productId]: basePrice.toString()
        }));
    }

    function formatRupiah(amount: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    }

    return (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari produk atau kategori..."
                    className="pl-9 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produk</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead className="text-right">Harga Dasar</TableHead>
                            <TableHead className="w-[200px] text-right">Harga Brand</TableHead>
                            <TableHead className="w-[80px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product) => {
                            const currentPrice = prices[product.id] || "";
                            const isChanged = currentPrice !== "" && parseInt(currentPrice) !== product.base_price;
                            const isOverridden = initialPrices.some(ip => ip.product_id === product.id);

                            return (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground uppercase">{product.category}</TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        {formatRupiah(product.base_price)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-2">
                                            <Input
                                                type="number"
                                                className={`h-8 w-32 text-right ${isOverridden ? 'border-blue-500/50 bg-blue-500/5' : ''}`}
                                                value={currentPrice === "" ? product.base_price : currentPrice}
                                                onChange={(e) => setPrices(prev => ({ ...prev, [product.id]: e.target.value }))}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {isOverridden && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground"
                                                    onClick={() => resetPrice(product.id, product.base_price)}
                                                    title="Reset ke harga dasar"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-8 ${saving === product.id ? 'animate-pulse' : 'text-primary'}`}
                                                onClick={() => handleUpdatePrice(product.id)}
                                                disabled={saving === product.id}
                                            >
                                                {saving === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
