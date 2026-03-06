"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { upsertStock } from "@/app/actions/stock";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  category: string;
}

interface Outlet {
  id: number;
  name: string;
}

interface StockItem {
  id: number;
  product_id: number;
  product_name: string;
  outlet_id: number | null;
  outlet_name: string | null;
  quantity: number;
  min_stock: number;
}

interface StockDialogProps {
  stock?: StockItem;
  products: Product[];
  outlets: Outlet[];
  initialProductId?: number;
  children: React.ReactNode;
}

const WAREHOUSE_OPTION = { id: -1, name: "Central Kitchen" };

export function StockDialog({ stock, products, outlets, initialProductId, children }: StockDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState(stock?.product_id?.toString() || initialProductId?.toString() || "");
  const [outletId, setOutletId] = useState(stock?.outlet_id?.toString() || "warehouse");
  const [quantity, setQuantity] = useState(stock?.quantity?.toString() || "0");
  const [minStock, setMinStock] = useState(stock?.min_stock?.toString() || "5");
  const [notes, setNotes] = useState("");

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setProductId(stock?.product_id?.toString() || initialProductId?.toString() || "");
      setOutletId(stock?.outlet_id?.toString() || "warehouse");
      setQuantity(stock?.quantity?.toString() || "0");
      setMinStock(stock?.min_stock?.toString() || "5");
      setNotes("");
    }
  }, [open, stock, initialProductId]);

  async function handleSave() {
    if (!productId) {
      toast.error("Pilih produk terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      await upsertStock({
        id: stock?.id,
        product_id: parseInt(productId),
        outlet_id: outletId === "warehouse" ? null : parseInt(outletId),
        quantity: parseInt(quantity) || 0,
        min_stock: parseInt(minStock) || 5,
        notes: notes || undefined,
      });
      toast.success(stock ? "Stok berhasil diperbarui" : "Stok berhasil ditambahkan");
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Failed to save stock", error);
      toast.error(error.message || "Gagal menyimpan stok");
    } finally {
      setLoading(false);
    }
  }

  const locationOptions = [WAREHOUSE_OPTION, ...outlets];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{stock ? "Edit Stok" : "Tambah Stok Baru"}</DialogTitle>
          <DialogDescription>
            {stock
              ? "Perbarui jumlah stok dan batas minimum."
              : "Tambahkan stok produk ke lokasi tertentu."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product" className="text-right text-xs">
              Produk
            </Label>
            <div className="col-span-3">
              <Select value={productId} onValueChange={setProductId} disabled={!!stock}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right text-xs">
              Lokasi
            </Label>
            <div className="col-span-3">
              <Select value={outletId} onValueChange={setOutletId} disabled={!!stock}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id.toString()}>
                      {loc.id === -1 ? "🏠 " : "🏪 "}{loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right text-xs">
              Jumlah Stok
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="col-span-3 h-8"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minStock" className="text-right text-xs">
              Min. Stok
            </Label>
            <Input
              id="minStock"
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="col-span-3 h-8"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right text-xs pt-1.5">
              Catatan
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3 min-h-[60px] text-sm"
              placeholder="Opsional: alasan perubahan stok"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
            Batal
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {stock ? "Simpan Perubahan" : "Tambah Stok"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
