"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { transferStock, getStockByProductAndOutlet } from "@/app/actions/stock";
import { Loader2, ArrowRight } from "lucide-react";
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

interface StockTransferDialogProps {
  products: Product[];
  outlets: Outlet[];
  children: React.ReactNode;
}

const WAREHOUSE_OPTION = { id: -1, name: "Central Kitchen" };

export function StockTransferDialog({ products, outlets, children }: StockTransferDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStock, setCheckingStock] = useState(false);
  const [productId, setProductId] = useState("");
  const [fromOutletId, setFromOutletId] = useState<"warehouse" | string>("warehouse");
  const [toOutletId, setToOutletId] = useState<"warehouse" | string>("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [availableStock, setAvailableStock] = useState<number | null>(null);

  const locationOptions = [WAREHOUSE_OPTION, ...outlets];

  // Check available stock when product or source changes
  useEffect(() => {
    async function checkStock() {
      if (!productId || fromOutletId === "") {
        setAvailableStock(null);
        return;
      }

      setCheckingStock(true);
      try {
        const stock = await getStockByProductAndOutlet(
          parseInt(productId),
          fromOutletId === "warehouse" ? null : parseInt(fromOutletId)
        );
        setAvailableStock(stock?.quantity || 0);
      } catch (error) {
        setAvailableStock(0);
      } finally {
        setCheckingStock(false);
      }
    }

    checkStock();
  }, [productId, fromOutletId]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setProductId("");
      setFromOutletId("warehouse");
      setToOutletId("");
      setQuantity("1");
      setNotes("");
      setAvailableStock(null);
    }
  }, [open]);

  async function handleTransfer() {
    if (!productId) {
      toast.error("Pilih produk terlebih dahulu");
      return;
    }
    if (!toOutletId && toOutletId !== "warehouse") {
      toast.error("Pilih lokasi tujuan");
      return;
    }

    const from = fromOutletId === "warehouse" ? null : parseInt(fromOutletId);
    const to = toOutletId === "warehouse" ? null : parseInt(toOutletId);

    if (from === to) {
      toast.error("Lokasi asal dan tujuan tidak boleh sama");
      return;
    }

    setLoading(true);
    try {
      await transferStock({
        product_id: parseInt(productId),
        from_outlet_id: from,
        to_outlet_id: to,
        quantity: parseInt(quantity) || 0,
        notes: notes || undefined,
      });
      toast.success("Stok berhasil ditransfer");
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Failed to transfer stock", error);
      toast.error(error.message || "Gagal mentransfer stok");
    } finally {
      setLoading(false);
    }
  }

  const quantityNum = parseInt(quantity) || 0;
  const isInsufficientStock = availableStock !== null && quantityNum > availableStock;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Stok</DialogTitle>
          <DialogDescription>
            Pindahkan stok produk dari satu lokasi ke lokasi lain.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product" className="text-right text-xs">
              Produk
            </Label>
            <div className="col-span-3">
              <Select value={productId} onValueChange={setProductId}>
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
            <Label className="text-right text-xs">Dari</Label>
            <div className="col-span-3">
              <Select value={fromOutletId} onValueChange={setFromOutletId}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Pilih asal" />
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

          <div className="flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-xs">Ke</Label>
            <div className="col-span-3">
              <Select value={toOutletId} onValueChange={setToOutletId}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Pilih tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions
                    .filter((loc) => loc.id.toString() !== fromOutletId)
                    .map((loc) => (
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
              Jumlah
            </Label>
            <div className="col-span-3">
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-8"
              />
              {checkingStock ? (
                <p className="text-xs text-muted-foreground mt-1">Memeriksa stok...</p>
              ) : availableStock !== null ? (
                <p className="text-xs mt-1">
                  Stok tersedia:{" "}
                  <span className={isInsufficientStock ? "text-red-500 font-semibold" : "text-green-600"}>
                    {availableStock}
                  </span>
                  {isInsufficientStock && (
                    <span className="text-red-500 ml-1"> (tidak cukup!)</span>
                  )}
                </p>
              ) : null}
            </div>
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
              placeholder="Opsional: alasan transfer"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleTransfer}
            disabled={loading || isInsufficientStock || !productId || !toOutletId}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
