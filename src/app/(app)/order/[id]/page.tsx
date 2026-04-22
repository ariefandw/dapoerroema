import { getOrderWithDetails, getOutlets } from "@/app/actions";
import { PageContainer } from "@/components/PageContainer";
import { auth, Session } from "@/lib/auth";
import { headers } from "next/headers";
import { format, differenceInHours } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, Package, MapPin, Clock, CheckCircle2, User, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { STATUS_UI_MAP, OrderStatus } from "@/lib/status-dictionary";
import { Badge } from "@/components/ui/badge";
import OrderTrackingMapWrapper from "./OrderTrackingMapWrapper";
import { OrderStatusChanger } from "./OrderStatusChanger";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { cn } from "@/lib/utils";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) notFound();

    const order = await getOrderWithDetails(orderId);

    if (!order) notFound();

    // Check auth
    const session = await auth.api.getSession({
        headers: await headers(),
    }) as Session | null;

    const userRole = session?.user?.role || "user";
    const isStaff = ["admin", "baker", "runner"].includes(userRole);
    
    // Public access rule: less than 24 hours old
    const orderAgeHours = differenceInHours(new Date(), new Date(order.order_date));
    const isPubliclyViewable = orderAgeHours < 24;

    if (!isStaff && !isPubliclyViewable) {
        if (!session) {
            redirect("/login");
        }
        notFound();
    }

    const outlets = await getOutlets();
    const statusUi = STATUS_UI_MAP[order.status as OrderStatus];

    return (
        <PageContainer className="pb-20 sm:pb-6 mt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            {isStaff && (
                                <Button asChild variant="ghost" size="icon" className="h-8 w-8 -ml-2 rounded-full">
                                    <Link href="/order">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                            <h1 className="text-2xl font-black tracking-tight underline underline-offset-8 decoration-primary/30 decoration-4">Order #{order.id.toString().padStart(3, '0')}</h1>
                        </div>
                        <p className={cn("text-muted-foreground flex items-center gap-2 text-sm", isStaff && "ml-8")}>
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
                                                {userRole !== "baker" && <th className="px-6 py-3 text-right">Harga Satuan</th>}
                                                {userRole !== "baker" && <th className="px-6 py-3 text-right">Total</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/10">
                                            {order.items.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{item.product.name}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge variant="secondary" className="font-bold">{item.quantity}x</Badge>
                                                    </td>
                                                    {userRole !== "baker" && <td className="px-6 py-4 text-right">Rp {(item.unit_price ?? 0).toLocaleString()}</td>}
                                                    {userRole !== "baker" && <td className="px-6 py-4 text-right font-bold text-primary">
                                                        Rp {(item.quantity * (item.unit_price ?? 0)).toLocaleString()}
                                                    </td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                        {userRole !== "baker" && (
                                        <tfoot className="bg-muted/10 border-t-2 border-border/20">
                                            <tr>
                                                <td colSpan={3} className="px-6 py-4 font-bold text-right uppercase tracking-wider text-xs">Total Pembayaran</td>
                                                <td className="px-6 py-4 text-right font-black text-lg text-primary">
                                                    Rp {(order.total_amount ?? 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                        )}
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tracking Map — intentionally hidden for future use */}
                        {false && (
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

                        {/* Delivery Evidence */}
                        {(order.delivery_photo_url || order.delivery_signature_url) && (
                            <Card className="border-border/50 shadow-sm overflow-hidden">
                                <CardHeader className="bg-muted/30">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        Bukti Penerimaan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                                <div className="bg-white rounded-lg border p-2 flex items-center justify-center shadow-inner aspect-video">
                                                    <img
                                                        src={order.delivery_signature_url}
                                                        alt="Tanda Tangan Penerima"
                                                        className="max-h-24 object-contain invert dark:invert-0"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Info */}
                    <div className="space-y-6">
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
                                <OrderStatusChanger
                                    orderId={order.id}
                                    currentStatus={order.status as OrderStatus}
                                    statusLogs={order.statusLogs}
                                    userRole={session ? userRole : undefined}
                                />
                            </CardContent>
                        </Card>

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
                    </div>
                </div>
            </PageContainer>
    );
}
