"use client";

import { useState, useEffect } from "react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createCashierOrder, getCashierStockLevels } from "@/app/actions/cashier";
import { QRISPaymentModal } from "@/components/QRISPaymentModal";
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Search,
    CreditCard,
    DollarSign,
    QrCode,
    Image as ImageIcon,
    Utensils,
    X,
    AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface Product {
    id: number;
    name: string;
    category: string;
    base_price: number;
    image_url?: string | null;
    stock?: number; // Current stock at outlet
}

interface CartItem extends Product {
    quantity: number;
}

export default function CashierPage() {
    // State
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [discountType, setDiscountType] = useState<"percentage" | "fixed" | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">("cash");
    const [showQRISModal, setShowQRISModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch products
    useEffect(() => {
        fetchProducts();
    }, []);

    // Filter products
    useEffect(() => {
        let filtered = allProducts;

        if (selectedCategory !== "all") {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }

        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredProducts(filtered);
    }, [allProducts, selectedCategory, searchQuery]);

    const fetchProducts = async () => {
        try {
            // Fetch products with stock levels
            const data = await getCashierStockLevels();
            setAllProducts(data);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        }
    };

    // Cart operations
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            const currentQuantity = existing?.quantity || 0;
            const newQuantity = currentQuantity + 1;
            const availableStock = product.stock ?? 0;

            // Check if adding would exceed stock
            if (newQuantity > availableStock && availableStock > 0) {
                toast.error(
                    `Stok ${product.name} tersisa ${availableStock}. Anda memesan ${newQuantity}.`,
                    { duration: 3000 }
                );
            } else if (availableStock === 0) {
                toast.error(`${product.name} sedang habis stok.`);
                return prev;
            }

            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: newQuantity }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => {
            return prev
                .map(item => {
                    if (item.id === productId) {
                        const newQuantity = Math.max(0, item.quantity + delta);
                        return { ...item, quantity: newQuantity };
                    }
                    return item;
                })
                .filter(item => item.quantity > 0);
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
        setDiscountType(null);
        setDiscountAmount(0);
    };

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.base_price * item.quantity), 0);

    const discountValue = discountType && discountAmount
        ? discountType === "percentage"
            ? Math.round(subtotal * (discountAmount / 100))
            : discountAmount
        : 0;

    const total = Math.max(0, subtotal - discountValue);

    const categories = ["all", ...Array.from(new Set(allProducts.map(p => p.category)))];

    // Checkout
    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error("Keranjang masih kosong");
            return;
        }

        if (paymentMethod === "qris") {
            setShowQRISModal(true);
        } else {
            await processOrder();
        }
    };

    const processOrder = async () => {
        setLoading(true);
        try {
            await createCashierOrder({
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.base_price
                })),
                discount_type: discountType || null,
                discount_amount: discountAmount || 0,
                payment_method: paymentMethod,
                subtotal,
                total_amount: total
            });

            toast.success("Pesanan berhasil dibuat!");
            clearCart();
            // Refresh products to update stock levels
            fetchProducts();
        } catch (error) {
            console.error("Failed to create order:", error);
            toast.error(error instanceof Error ? error.message : "Gagal membuat pesanan");
        } finally {
            setLoading(false);
            setShowQRISModal(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-4 p-4">
            {/* Main Content - Product Grid */}
            <div className="flex-1 space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari produk..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Kategori</SelectItem>
                            {categories.filter(c => c !== "all").map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {filteredProducts.map((product) => {
                        const stock = product.stock ?? 0;
                        const isLowStock = stock <= 5;
                        const isOutOfStock = stock === 0;

                        return (
                            <Card
                                key={product.id}
                                className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow group ${isOutOfStock ? "opacity-60" : ""
                                    }`}
                                onClick={() => !isOutOfStock && addToCart(product)}
                            >
                                <div className="aspect-square bg-muted relative">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                                        </div>
                                    )}
                                    <Badge className="absolute top-2 left-2 text-[10px]">
                                        {product.category}
                                    </Badge>
                                    {/* Stock Badge */}
                                    <Badge
                                        variant={isOutOfStock ? "destructive" : isLowStock ? "default" : "secondary"}
                                        className={`absolute top-2 right-2 text-[10px] flex items-center gap-1 ${isLowStock && !isOutOfStock ? "bg-amber-500 text-white" : ""
                                            }`}
                                    >
                                        {isOutOfStock ? (
                                            <>
                                                <X className="h-3 w-3" />
                                                Habis
                                            </>
                                        ) : isLowStock ? (
                                            <>
                                                <AlertTriangle className="h-3 w-3" />
                                                {stock}
                                            </>
                                        ) : (
                                            stock
                                        )}
                                    </Badge>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                        Rp {product.base_price.toLocaleString("id-ID")}
                                    </p>
                                    {isLowStock && !isOutOfStock && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                            Stok menipis
                                        </p>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Tidak ada produk ditemukan</p>
                    </div>
                )}
            </div>

            {/* Cart Sidebar */}
            <div className="w-full lg:w-96 space-y-4">
                <Card className="p-4 space-y-4 sticky top-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            <h2 className="font-semibold">Keranjang</h2>
                        </div>
                        <Badge variant="secondary">{cart.length} item</Badge>
                    </div>

                    <Separator />

                    {/* Cart Items */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {cart.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Keranjang kosong</p>
                            </div>
                        ) : (
                            cart.map((item) => {
                                const availableStock = item.stock ?? 0;
                                const hasStockIssue = item.quantity > availableStock && availableStock > 0;
                                const isOutOfStock = availableStock === 0;

                                return (
                                    <div key={item.id} className={`flex items-center gap-3 bg-muted/50 rounded-lg p-2 ${isOutOfStock ? "opacity-60" : ""}`}>
                                        {item.image_url && (
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-12 h-12 rounded object-cover"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Rp {item.base_price.toLocaleString("id-ID")}
                                            </p>
                                            {isOutOfStock ? (
                                                <p className="text-xs text-destructive font-medium">
                                                    <X className="h-3 w-3 inline mr-1" />
                                                    Stok habis
                                                </p>
                                            ) : hasStockIssue ? (
                                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                                                    Stok: {availableStock}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">
                                                    Stok: {availableStock}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => updateQuantity(item.id, -1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center text-sm font-medium">
                                                {item.quantity}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => updateQuantity(item.id, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <Separator />

                    {/* Discount Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Diskon</span>
                            <div className="flex gap-2">
                                <Button
                                    variant={discountType === "percentage" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setDiscountType(discountType === "percentage" ? null : "percentage")}
                                >
                                    %
                                </Button>
                                <Button
                                    variant={discountType === "fixed" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setDiscountType(discountType === "fixed" ? null : "fixed")}
                                >
                                    Rp
                                </Button>
                            </div>
                        </div>
                        {discountType && (
                            <Input
                                type="number"
                                placeholder={discountType === "percentage" ? "Persentase" : "Jumlah"}
                                value={discountAmount || ""}
                                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                                min={0}
                                max={discountType === "percentage" ? 100 : undefined}
                            />
                        )}
                        {(discountType && discountAmount) && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Diskon</span>
                                <span className="text-red-500 font-medium">
                                    - Rp {discountValue.toLocaleString("id-ID")}
                                </span>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex items-center justify-between text-lg font-bold">
                            <span>Total</span>
                            <span className="text-zinc-900 dark:text-zinc-100">
                                Rp {total.toLocaleString("id-ID")}
                            </span>
                        </div>
                    </div>

                    <Separator />

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Metode Pembayaran</label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={paymentMethod === "cash" ? "default" : "outline"}
                                className="gap-2"
                                onClick={() => setPaymentMethod("cash")}
                            >
                                <DollarSign className="h-4 w-4" />
                                Tunai
                            </Button>
                            <Button
                                variant={paymentMethod === "qris" ? "default" : "outline"}
                                className="gap-2"
                                onClick={() => setPaymentMethod("qris")}
                            >
                                <QrCode className="h-4 w-4" />
                                QRIS
                            </Button>
                        </div>
                    </div>

                    {/* Checkout Button */}
                    <div className="space-y-2">
                        <Button
                            className="w-full h-12 text-lg"
                            disabled={cart.length === 0 || loading}
                            onClick={handleCheckout}
                        >
                            {loading ? "Memproses..." : paymentMethod === "qris" ? "Scan QRIS" : "Bayar Tunai"}
                        </Button>
                        {cart.length > 0 && (
                            <Button
                                variant="ghost"
                                className="w-full text-destructive"
                                onClick={clearCart}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Kosongkan Keranjang
                            </Button>
                        )}
                    </div>
                </Card>
            </div>

            {/* QRIS Modal */}
            <QRISPaymentModal
                open={showQRISModal}
                onClose={() => setShowQRISModal(false)}
                amount={total}
                onConfirmPayment={processOrder}
            />
        </div>
    );
}
