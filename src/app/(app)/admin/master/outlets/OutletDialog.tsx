"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertOutlet } from "@/app/actions/master";
import { Loader2 } from "lucide-react";

interface OutletDialogProps {
    outlet?: { id: number; name: string; contact_info: string | null; brand_id: number | null };
    brands: { id: number; name: string }[];
    children: React.ReactNode;
}

export function OutletDialog({ outlet, brands, children }: OutletDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(outlet?.name || "");
    const [contact, setContact] = useState(outlet?.contact_info || "");
    const [brandId, setBrandId] = useState<string>(outlet?.brand_id?.toString() || "none");

    async function handleSave() {
        if (!name.trim()) return;

        setLoading(true);
        try {
            await upsertOutlet({
                id: outlet?.id,
                name,
                contact_info: contact || undefined,
                brand_id: brandId === "none" ? null : parseInt(brandId)
            });
            setOpen(false);
        } catch (error) {
            console.error("Failed to save outlet", error);
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
                    <DialogTitle>{outlet ? "Edit Outlet" : "Tambah Outlet Baru"}</DialogTitle>
                    <DialogDescription>
                        {outlet ? "Lakukan perubahan pada outlet Anda di sini." : "Masukkan detail untuk lokasi outlet baru."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="brand" className="text-right text-xs">
                            Brand
                        </Label>
                        <div className="col-span-3">
                            <Select value={brandId} onValueChange={setBrandId}>
                                <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Pilih Brand" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Tanpa Brand</SelectItem>
                                    {brands.map((brand) => (
                                        <SelectItem key={brand.id} value={brand.id.toString()}>
                                            {brand.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right text-xs">
                            Nama
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3 h-8"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contact" className="text-right text-xs">
                            Kontak
                        </Label>
                        <Input
                            id="contact"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            className="col-span-3 h-8"
                            placeholder="Opsional"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
                        Batal
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={loading || !name.trim()}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {outlet ? "Simpan Perubahan" : "Catat Outlet"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
