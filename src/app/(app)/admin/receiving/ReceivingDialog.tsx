"use client";

import { useState } from "react";
import { Plus, Trash2, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { recordReceiving } from "@/app/actions/receiving";

interface Product {
    id: number;
    name: string;
    category: string;
}

interface ReceivingItem {
    product_id: number;
    quantity: number;
    notes?: string;
}

interface ReceivingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: Product[];
}

export function ReceivingDialog({ open, onOpenChange, products }: ReceivingDialogProps) {
    const [items, setItems] = useState<ReceivingItem[]>([{ product_id: 0, quantity: 1 }]);
    const [supplier, setSupplier] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateItem = (index: number, field: keyof ReceivingItem, value: string | number) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    const addItem = () => {
        setItems((prev) => [...prev, { product_id: 0, quantity: 1 }]);
    };

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        // Validate items
        const validItems = items.filter((item) => item.product_id > 0 && item.quantity > 0);

        if (validItems.length === 0) {
            toast.error("Tambahkan minimal satu item dengan produk dan jumlah yang valid");
            return;
        }

        setIsSubmitting(true);
        try {
            await recordReceiving({
                items: validItems,
                supplier: supplier || undefined,
            });

            toast.success("Penerimaan barang berhasil dicatat");
            // Reset form
            setItems([{ product_id: 0, quantity: 1 }]);
            setSupplier("");
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to record receiving:", error);
            toast.error("Gagal mencatat penerimaan barang");
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = Array.from(new Set(products.map((p) => p.category)));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Penerimaan Barang
                    </DialogTitle>
                    <DialogDescription>
                        Catat barang masuk dari supplier ke gudang pusat
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Supplier Input */}
                    <div className="space-y-2">
                        <Label htmlFor="supplier">Supplier (Opsional)</Label>
                        <Input
                            id="supplier"
                            placeholder="Nama supplier"
                            value={supplier}
                            onChange={(e) => setSupplier(e.target.value)}
                        />
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                        <Label>Item yang Diterima</Label>
                        {items.map((item, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                                <div className="flex-1 space-y-2">
                                    <Select
                                        value={item.product_id.toString()}
                                        onValueChange={(val) =>
                                            updateItem(index, "product_id", Number(val))
                                        }
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Pilih produk" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <div key={cat}>
                                                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                                        {cat}
                                                    </div>
                                                    {products
                                                        .filter((p) => p.category === cat)
                                                        .map((p) => (
                                                            <SelectItem
                                                                key={p.id}
                                                                value={p.id.toString()}
                                                                className="text-sm"
                                                            >
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                </div>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Label className="text-sm uppercase text-muted-foreground">
                                                Jumlah
                                            </Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateItem(index, "quantity", Number(e.target.value) || 0)
                                                }
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-sm uppercase text-muted-foreground">
                                                Catatan
                                            </Label>
                                            <Input
                                                placeholder="Opsional"
                                                value={item.notes || ""}
                                                onChange={(e) =>
                                                    updateItem(index, "notes", e.target.value)
                                                }
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {items.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive shrink-0 mt-6"
                                        onClick={() => removeItem(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full border-dashed"
                            onClick={addItem}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Item Lain
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Memproses..." : "Simpan Penerimaan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
