import { db } from "@/db";
import { orders, orderItems, runnerTrail } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "@/lib/auth-guard";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, MapPin, Clock, Package, History, Truck } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { STATUS_UI_MAP, OrderStatus } from "@/lib/status-dictionary";
import { OrderTrackingMapWrapper } from "./MapWrapper";
import { VerticalStatusStepper } from "@/components/VerticalStatusStepper";
import { notFound } from "next/navigation";
import { getOrderWithDetails } from "@/app/actions";
import { PageContainer } from "@/components/PageContainer";
import { cn } from "@/lib/utils";

// Haversine formula to calculate distance in Km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    await requireRole(["admin"]);
    const { id } = await params;

    const order = await getOrderWithDetails(parseInt(id));
    if (!order) return notFound();

    // Calculate delivery metrics
    let totalKm = 0;
    if (order.trails && order.trails.length > 1) {
        for (let i = 0; i < order.trails.length - 1; i++) {
            const p1 = order.trails[i];
            const p2 = order.trails[i + 1];
            totalKm += calculateDistance(Number(p1.lat), Number(p1.lng), Number(p2.lat), Number(p2.lng));
        }
    }

    const shippedLog = order.statusLogs.find((l: any) => l.to_status === "shipped");
    const deliveredLog = order.statusLogs.find((l: any) => l.to_status === "delivered");
    let shippingTime = "";
    if (shippedLog && deliveredLog) {
        const diffMs = deliveredLog.created_at.getTime() - shippedLog.created_at.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins >= 60) {
            shippingTime = `${Math.floor(diffMins / 60)}j ${diffMins % 60}m`;
        } else {
            shippingTime = `${diffMins}m`;
        }
    }

    const statusConfig = STATUS_UI_MAP[order.status as OrderStatus];

    return (
        <PageContainer>
            {/* Header / Summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                        <h1 className="text-2xl font-black">Pesanan <span className="font-mono">#{order.id}</span></h1>
                        <Badge className={`${statusConfig?.bg} ${statusConfig?.text} border-none font-bold uppercase`}>
                            {statusConfig?.label}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground font-medium">
                        Dibuat <span className="font-mono">{format(order.created_at, "d MMMM yyyy, HH:mm", { locale: idLocale })}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items Table */}
                    <Card className="overflow-hidden border-border/10 shadow-xl shadow-primary/5">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                Daftar Pesanan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/20 text-muted-foreground font-bold border-b border-border/10 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-4">Produk</th>
                                            <th className="px-6 py-4 text-center">Qty</th>
                                            <th className="px-6 py-4 text-right text-emerald-600/80">HPP</th>
                                            <th className="px-6 py-4 text-right">Harga Jual</th>
                                            <th className="px-6 py-4 text-right text-emerald-600/80">Margin</th>
                                            <th className="px-6 py-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/10">
                                        {order.items.map((item: any) => {
                                            const hpp = item.product.base_price ?? 0;
                                            const sellPrice = item.unit_price ?? 0;
                                            const margin = sellPrice - hpp;
                                            const total = item.quantity * sellPrice;

                                            return (
                                                <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                                                    <td className="px-6 py-5 font-bold text-foreground/90">{item.product.name}</td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className="font-mono font-black text-primary bg-primary/5 px-2 py-1 rounded-md text-xs">{item.quantity}x</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right text-muted-foreground font-mono text-xs">
                                                        Rp {hpp.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-mono font-medium">
                                                        Rp {sellPrice.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-5 text-right text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                                                        Rp {(margin * item.quantity).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-mono font-black text-primary">
                                                        Rp {total.toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-muted/10 border-t border-border/10">
                                        <tr>
                                            <td colSpan={5} className="px-6 text-right font-bold text-muted-foreground uppercase text-xs">Total Pesanan</td>
                                            <td className="px-6 text-right font-mono font-black text-primary">Rp {order.total_amount?.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={5} className="px-6 text-right font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase">Estimasi Keuntungan</td>
                                            <td className="px-6 text-right font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                                                Rp {order.items.reduce((acc: number, item: any) => acc + ((item.unit_price - (item.product.base_price ?? 0)) * item.quantity), 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tracking Map Section */}
                    {order.status !== "pending" && (
                        <Card className="overflow-hidden border-border/10 shadow-xl shadow-primary/5">
                            <CardHeader className="bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        Pelacakan Pengiriman
                                    </CardTitle>
                                    <div className="flex gap-4">
                                        {totalKm > 0 && (
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Jarak Tempuh</p>
                                                <p className="text-sm font-mono font-black text-primary">{totalKm.toFixed(2)} Km</p>
                                            </div>
                                        )}
                                        {shippingTime && (
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Waktu Kirim</p>
                                                <p className="text-sm font-mono font-black text-primary">{shippingTime}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 h-[400px]">
                                <OrderTrackingMapWrapper order={order} />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar Details */}
                <div className="space-y-6">
                    {/* Outlet Info */}
                    <Card className="border-border/10 shadow-lg shadow-primary/5">
                        <CardHeader>
                            <CardTitle className="text-base">Informasi Pengiriman</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-muted">
                                    <Truck className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Outlet Tujuan</p>
                                    <p className="font-bold text-sm">
                                        <span className="text-primary">{order.outlet.brand?.name}</span> - {order.outlet.name}
                                    </p>
                                    {order.outlet.contact_info && <p className="text-xs text-muted-foreground font-mono">{order.outlet.contact_info}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* History Tracking */}
                    <Card className="border-border/10 shadow-lg shadow-primary/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <History className="h-24 w-24" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                Riwayat Pesanan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <VerticalStatusStepper
                                currentStatus={order.status as OrderStatus}
                                statusLogs={order.statusLogs}
                            />
                        </CardContent>
                    </Card>

                    {/* Payment Proof / Proof of Delivery would go here */}
                    {(order.delivery_photo_url || order.delivery_signature_url) && (
                        <Card className="border-border/10 shadow-lg shadow-primary/5 overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-base">Bukti Terkirim</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {order.delivery_photo_url && (
                                    <img src={order.delivery_photo_url} alt="Proof" className="w-full aspect-square object-cover" />
                                )}
                                {order.delivery_signature_url && (
                                    <div className="p-4 border-t border-border/10">
                                        <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Tanda Tangan</p>
                                        <img src={order.delivery_signature_url} alt="Signature" className="w-full h-24 object-contain invert dark:invert-0" />
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
