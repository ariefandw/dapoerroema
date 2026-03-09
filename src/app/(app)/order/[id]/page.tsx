import { getOrderWithDetails } from "@/app/actions";
import { PageContainer } from "@/components/PageContainer";
import { requireRole } from "@/lib/auth-guard";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, Package, MapPin, Clock, Info, CheckCircle2, User, Phone, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { STATUS_UI_MAP, OrderStatus } from "@/lib/status-dictionary";
import { Badge } from "@/components/ui/badge";
import OrderTrackingMapWrapper from "./OrderTrackingMapWrapper";
import { VerticalStatusStepper } from "@/components/VerticalStatusStepper";
import { notFound } from "next/navigation";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    await requireRole(["admin", "baker", "runner"]);
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) notFound();

    const order = await getOrderWithDetails(orderId);

    if (!order) notFound();

    const statusUi = STATUS_UI_MAP[order.status as OrderStatus];

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
                        Dibuat pada {format(new Date(order.order_date), "PPP p", { locale: localeId })}
                    </p>
                </div>

                <Badge className={`${statusUi.text} ${statusUi.bg} border-none font-bold px-3 py-1 text-sm shadow-sm`}>
                    <statusUi.icon className="mr-2 h-4 w-4" />
                    {statusUi.label}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Order Stats & Items */}
                <div className="lg:col-span-2 space-y-6">
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
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/20 text-muted-foreground font-medium border-b border-border/10">
                                        <tr>
                                            <th className="px-6 py-3">Produk</th>
                                            <th className="px-6 py-3 text-center">Jumlah</th>
                                            <th className="px-6 py-3 text-right">Harga Satuan</th>
                                            <th className="px-6 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/10">
                                        {order.items.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                                                <td className="px-6 py-4 font-medium">{item.product.name}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <Badge variant="secondary" className="font-bold">{item.quantity}x</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">Rp {(item.unit_price ?? 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-bold text-primary">
                                                    Rp {(item.quantity * (item.unit_price ?? 0)).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted/10 border-t-2 border-border/20">
                                        <tr>
                                            <td colSpan={3} className="px-6 py-4 font-bold text-right uppercase tracking-wider text-xs">Total Pembayaran</td>
                                            <td className="px-6 py-4 text-right font-black text-lg text-primary">
                                                Rp {(order.total_amount ?? 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tracking Map */}
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
                            {order.activeRunner && (
                                <>
                                    <Separator className="bg-border/10" />
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Runner Bertugas</p>
                                            <p className="text-sm font-bold">{order.activeRunner.name}</p>
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

                    {/* Status Tracking */}
                    <Card className="border-border/50 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Clock className="h-24 w-24" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Riwayat Status
                            </CardTitle>
                            <CardDescription className="text-xs">Update real-time perjalanan pesanan Anda.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <VerticalStatusStepper
                                currentStatus={order.status as OrderStatus}
                                statusLogs={order.statusLogs}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageContainer>
    );
}
