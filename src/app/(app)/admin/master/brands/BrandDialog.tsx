"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertBrand } from "@/app/actions/master";
import { Loader2 } from "lucide-react";

interface BrandDialogProps {
    brand?: { id: number; name: string; description: string | null };
    children: React.ReactNode;
}

export function BrandDialog({ brand, children }: BrandDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(brand?.name || "");
    const [description, setDescription] = useState(brand?.description || "");

    async function handleSave() {
        if (!name.trim()) return;

        setLoading(true);
        try {
            await upsertBrand({
                id: brand?.id,
                name,
                description: description || undefined
            });
            setOpen(false);
        } catch (error) {
            console.error("Failed to save brand", error);
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
                    <DialogTitle>{brand ? "Edit Brand" : "Tambah Brand Baru"}</DialogTitle>
                    <DialogDescription>
                        {brand ? "Lakukan perubahan pada brand Anda di sini." : "Masukkan detail untuk brand baru."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama Brand</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Dapoer Roema"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Keterangan singkat tentang brand"
                            className="resize-none"
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
                        Batal
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={loading || !name.trim()}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {brand ? "Simpan Perubahan" : "Simpan Brand"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
