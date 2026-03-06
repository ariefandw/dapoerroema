import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { TopProductsChart, OutletPieChart, VolumeLineChart } from "@/components/Charts";
import { getAnalytics } from "@/app/actions";
import { STATUS_UI_MAP, OrderStatus } from "@/lib/status-dictionary";
import { TrendingUp, ShoppingBag, CheckCircle2, DollarSign } from "lucide-react";

function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

export async function AdminDashboard({ session }: { session: any }) {
    const outletId = (session?.user as any)?.currentOutletId;
    const { totalOrders, totalDelivered, totalRevenue, topProducts, ordersByOutlet, volumeByDay, statusDist } =
        await getAnalytics(outletId);

    const deliveryRate = totalOrders > 0 ? ((totalDelivered / totalOrders) * 100).toFixed(0) : 0;

    return (
        <div className="space-y-6">
            {/* KPI Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Orders</span>
                        </div>
                        <div className="text-3xl md:text-4xl font-black tracking-tighter">{totalOrders}</div>
                        <div className="text-[10px] text-muted-foreground font-medium mt-1">Total Pesanan</div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Success</span>
                        </div>
                        <div className="text-3xl md:text-4xl font-black tracking-tighter">{totalDelivered}</div>
                        <div className="text-[10px] text-muted-foreground font-medium mt-1">Terkirim</div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="h-4 w-4 text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rate</span>
                        </div>
                        <div className="text-3xl md:text-4xl font-black tracking-tighter">{deliveryRate}%</div>
                        <div className="text-[10px] text-muted-foreground font-medium mt-1">Efisiensi</div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="h-4 w-4 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Revenue</span>
                        </div>
                        <div className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter truncate">{formatRupiah(totalRevenue).replace("Rp", "Rp ")}</div>
                        <div className="text-[10px] text-muted-foreground font-medium mt-1">Pendapatan</div>
                    </CardContent>
                </Card>
            </div>

            {/* Status distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Rincian Status Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        {statusDist.map((s: { status: string; count: number }) => {
                            const uiConfig = STATUS_UI_MAP[s.status as OrderStatus];
                            return (
                                <div
                                    key={s.status}
                                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${uiConfig?.colorClass ?? "bg-gray-100 text-gray-700"}`}
                                >
                                    <span>{uiConfig?.label ?? s.status}</span>
                                    <span className="bg-black/10 rounded-full px-2 py-0.5 text-xs">{s.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Produk Teratas</CardTitle>
                        <CardDescription>Unit terjual per produk, sepanjang waktu.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TopProductsChart data={topProducts} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pesanan per Outlet</CardTitle>
                        <CardDescription>Bagian pesanan per outlet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OutletPieChart data={ordersByOutlet} />
                    </CardContent>
                </Card>
            </div>

            {/* Charts row 2 */}
            <Card>
                <CardHeader>
                    <CardTitle>Volume Pesanan — 30 Hari Terakhir</CardTitle>
                    <CardDescription>Jumlah pesanan per hari.</CardDescription>
                </CardHeader>
                <CardContent>
                    <VolumeLineChart data={volumeByDay} />
                </CardContent>
            </Card>
        </div>
    );
}
