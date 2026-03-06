import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { TopProductsChart, OutletPieChart, VolumeLineChart } from "@/components/Charts";
import { getAnalytics } from "@/app/actions";
import { STATUS_UI_MAP, OrderStatus } from "@/lib/status-dictionary";

function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

export async function AdminDashboard() {
    const { totalOrders, totalDelivered, totalRevenue, topProducts, ordersByOutlet, volumeByDay, statusDist } =
        await getAnalytics();

    const deliveryRate = totalOrders > 0 ? ((totalDelivered / totalOrders) * 100).toFixed(0) : 0;

    return (
        <div className="space-y-6">
            {/* KPI Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-4xl font-black">{totalOrders}</div>
                        <div className="text-sm text-muted-foreground font-medium mt-1">Total Pesanan</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-4xl font-black">{totalDelivered}</div>
                        <div className="text-sm text-muted-foreground font-medium mt-1">Terkirim</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-4xl font-black">{deliveryRate}%</div>
                        <div className="text-sm text-muted-foreground font-medium mt-1">Tingkat Pengiriman</div>
                    </CardContent>
                </Card>
                <Card className="bg-primary text-primary-foreground">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-black">{formatRupiah(totalRevenue)}</div>
                        <div className="text-sm font-medium mt-1 opacity-80">Total Pendapatan</div>
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
