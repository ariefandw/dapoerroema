"use client";

import { PageContainer } from "@/components/PageContainer";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, Package, MapPin, Clock, Info, CheckCircle2, User, Phone, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { STATUS_UI_MAP, OrderStatus } from "@/lib/status-dictionary";
import { Badge } from "@/components/ui/badge";
import { OrderTrackingMapWrapper } from "./MapWrapper";
import { VerticalStatusStepper } from "@/components/VerticalStatusStepper";
import { notFound } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";
import { useEffect, useRef, useTransition } from "react";
import { updateOrderStatus } from "@/app/actions";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch');
    return data;
});

export function OrderDetailClient({ initialOrder, isAdmin, userRole }: { initialOrder: any; isAdmin: boolean; userRole: string }) {
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const { data: order = initialOrder } = useSWR(
        `/api/orders/${initialOrder.id}`,
        fetcher,
        {
            fallbackData: initialOrder,
            refreshInterval: 5000,
            revalidateOnFocus: true,
        }
    );

    const prevStatusRef = useRef(order.status);

    useEffect(() => {
        if (order && prevStatusRef.current && prevStatusRef.current !== order.status) {
            toast.info(`Status order berubah menjadi: ${STATUS_UI_MAP[order.status as OrderStatus]?.label}`);
            prevStatusRef.current = order.status;
        } else if (order) {
            prevStatusRef.current = order.status;
        }
    }, [order?.status]);

    if (!order) return null;

    const statusUi = STATUS_UI_MAP[order.status as OrderStatus];

    const { mutate } = useSWRConfig();

    const handleStatusChange = (orderId: number, currentStatus: string, newStatus: string, deliveryData?: { photoUrl: string; signatureUrl: string }) => {
        if (currentStatus === newStatus) return;
        startTransition(async () => {
            const result = await updateOrderStatus(orderId, currentStatus, newStatus, pathname, deliveryData);
            if (result.success) {
                toast.success("Status order berhasil diperbarui!");
                mutate(`/api/orders/${orderId}`); // Optimistically update immediately
            } else {
                toast.error(result.error || "Gagal memperbarui status");
            }
        });
    };

    return (
        <PageContainer className="max-w-7xl mx-auto space-y-6 pb-20 sm:pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 -ml-2 rounded-full">
                            <Link href="/order">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">Order #{order.id}</h1>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2 text-sm ml-8">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(order.order_date), "dd/MM/yyyy HH:mm")}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Details & Items */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Timeline */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Info className="h-5 w-5 text-primary" />
                                        Riwayat Status
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                        Update real-time perjalanan pesanan Anda. Klik ikon status untuk memperbarui.
                                    </CardDescription>
                                </div>
                                <Badge className={cn(statusUi.text, statusUi.bg, "border-none font-bold px-3 py-1 text-sm shadow-sm flex items-center gap-2")}>
                                    <statusUi.icon className="h-4 w-4" />
                                    {statusUi.label}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <VerticalStatusStepper
                                orderId={order.id}
                                currentStatus={order.status as OrderStatus}
                                statusLogs={order.statusLogs}
                                userRole={userRole}
                                onStatusChange={handleStatusChange}
                                disabled={isPending}
                            />
                        </CardContent>
                    </Card>

                    {/* Order Items */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                Daftar Pesanan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm hidden md:table">
                                    <thead className="bg-muted/50 border-b border-border/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-bold uppercase tracking-wider text-xs">Produk</th>
                                            <th className="px-6 py-3 text-center font-bold uppercase tracking-wider text-xs">Qty</th>
                                            <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-xs">Harga Satuan</th>
                                            {isAdmin && <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-xs">HPP</th>}
                                            {isAdmin && <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-xs">Margin</th>}
                                            <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-xs">Total Jual</th>
                                            {isAdmin && <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-xs">Net Profit</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {order.items.map((item: any) => {
                                            const qty = item.quantity;
                                            const sellPrice = item.unit_price ?? 0;
                                            const hpp = item.product?.base_price ?? 0;
                                            const margin = sellPrice - hpp;
                                            const totalJual = qty * sellPrice;
                                            const netProfit = qty * margin;
                                            return (
                                                <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{item.product.name}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge variant="secondary" className="font-bold">{qty}x</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">Rp {sellPrice.toLocaleString()}</td>
                                                    {isAdmin && <td className="px-6 py-4 text-right text-orange-600">Rp {hpp.toLocaleString()}</td>}
                                                    {isAdmin && <td className="px-6 py-4 text-right text-blue-600">Rp {margin.toLocaleString()}</td>}
                                                    <td className="px-6 py-4 text-right font-bold text-primary">
                                                        Rp {totalJual.toLocaleString()}
                                                    </td>
                                                    {isAdmin && <td className="px-6 py-4 text-right font-bold text-green-600">Rp {netProfit.toLocaleString()}</td>}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-muted/10 border-t-2 border-border/20">
                                        <tr>
                                            <td colSpan={isAdmin ? 5 : 3} className="px-6 py-4 font-bold text-right uppercase tracking-wider text-xs">Total Pembayaran</td>
                                            <td colSpan={isAdmin ? 2 : 1} className="px-6 py-4 text-right font-black text-lg text-primary">
                                                Rp {(order.total_amount ?? 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>

                                {/* Mobile view */}
                                <div className="flex flex-col gap-4 md:hidden p-4">
                                    {order.items.map((item: any) => {
                                        const qty = item.quantity;
                                        const sellPrice = item.unit_price ?? 0;
                                        const hpp = item.product?.base_price ?? 0;
                                        const margin = sellPrice - hpp;
                                        const totalJual = qty * sellPrice;
                                        const netProfit = qty * margin;

                                        return (
                                            <div key={item.id} className="bg-muted/10 p-4 rounded-lg border border-border/10 flex flex-col gap-2">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold">{item.product.name}</span>
                                                    <Badge variant="secondary" className="font-bold">{qty}x</Badge>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Harga Satuan</span>
                                                    <span>Rp {sellPrice.toLocaleString()}</span>
                                                </div>
                                                {isAdmin && (
                                                    <>
                                                        <div className="flex justify-between text-sm text-orange-600">
                                                            <span>HPP</span>
                                                            <span>Rp {hpp.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm text-blue-600">
                                                            <span>Margin</span>
                                                            <span>Rp {margin.toLocaleString()}</span>
                                                        </div>
                                                    </>
                                                )}
                                                <Separator className="my-1" />
                                                <div className="flex justify-between font-bold">
                                                    <span>Total Jual</span>
                                                    <span className="text-primary">Rp {totalJual.toLocaleString()}</span>
                                                </div>
                                                {isAdmin && (
                                                    <div className="flex justify-between font-bold text-green-600">
                                                        <span>Net Profit</span>
                                                        <span>Rp {netProfit.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div className="mt-4 bg-muted/20 p-4 rounded-lg border border-primary/20 flex flex-col gap-2">
                                        <div className="flex justify-between font-bold uppercase tracking-wider text-sm">
                                            <span>Total Pembayaran</span>
                                            <span className="text-primary text-xl">Rp {(order.total_amount ?? 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tracking Map */}
                    {["ready", "shipping", "delivered"].includes(order.status) && (
                        <Card className="border-border/50 shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Map className="h-5 w-5 text-primary" />
                                    Pelacakan Pengiriman
                                </CardTitle>
                                <CardDescription>Visualisasi lokasi runner dan rute pengiriman.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <OrderTrackingMapWrapper order={order} />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Info & Evidence */}
                <div className="space-y-6">
                    {/* Outlet Info */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                Lokasi Outlet
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-primary uppercase tracking-tight">{order.outlet.name}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {order.outlet.contact_info || "Tidak ada informasi kontak tersedia."}
                                </p>
                            </div>
                            {order.runner && (
                                <>
                                    <Separator className="bg-border/10" />
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Runner Bertugas</p>
                                            <p className="text-sm font-bold">{order.runner.name}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Delivery Evidence */}
                    {(order.delivery_photo_url || order.delivery_signature_url) && (
                        <Card className="border-border/50 shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    Bukti Penerimaan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {order.delivery_photo_url && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Foto Bukti</p>
                                        <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted/20 shadow-inner group">
                                            <img
                                                src={order.delivery_photo_url}
                                                alt="Bukti Pengiriman"
                                                className="object-cover w-full h-full transition-transform group-hover:scale-105"
                                            />
                                        </div>
                                    </div>
                                )}
                                {order.delivery_signature_url && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tanda Tangan</p>
                                        <div className="bg-white rounded-lg border p-2 flex items-center justify-center shadow-inner">
                                            <img
                                                src={order.delivery_signature_url}
                                                alt="Tanda Tangan Penerima"
                                                className="max-h-24 object-contain invert dark:invert-0"
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                </div>
            </div>
        </PageContainer>
    );
}
