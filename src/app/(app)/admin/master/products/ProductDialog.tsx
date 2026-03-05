"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertProduct } from "@/app/actions/master";
import { Loader2 } from "lucide-react";

const CATEGORIES = ["Sourdough", "Cookies", "Bread", "Pastry", "Beverage", "Cake", "Savory"];

interface ProductDialogProps {
    product?: { id: number; name: string; category: string; base_price: number };
    children: React.ReactNode;
}

export function ProductDialog({ product, children }: ProductDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(product?.name || "");
    const [category, setCategory] = useState(product?.category || "Bread");
    const [price, setPrice] = useState(product?.base_price?.toString() || "0");

    async function handleSave() {
        setLoading(true);
        try {
            await upsertProduct({
                id: product?.id,
                name,
                category,
                base_price: parseInt(price) || 0
            });
            setOpen(false);
        } catch (error) {
            console.error("Failed to save product", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
                    <DialogDescription>
                        {product ? "Update product details here." : "Enter the specifications for the new bakery item."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right text-xs">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3 h-8"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right text-xs">
                            Category
                        </Label>
                        <div className="col-span-3">
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right text-xs">
                            Base Price
                        </Label>
                        <Input
                            id="price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="col-span-3 h-8"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {product ? "Update Product" : "Add to Catalog"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
