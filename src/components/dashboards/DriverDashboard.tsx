import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDriverOrders } from "@/app/actions";
import { Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function DriverDashboard() {
    const orders = await getDriverOrders();
    const pendingDeliveries = orders.filter(o => o.status === "Shipped" || o.status === "Production Ready").length;

    return (
        <div className="space-y-6">
            <div className="flex bg-amber-500/10 p-6 rounded-xl border border-amber-500/20 items-center gap-4">
                <div className="bg-amber-500 p-3 rounded-full text-amber-950">
                    <Truck className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Ringkasan Pengiriman</h2>
                    <p className="text-muted-foreground">Ada {pendingDeliveries} pesanan yang siap atau sedang dikirim.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>Pesanan Menunggu</CardTitle>
                        <CardDescription>Harus segera diantar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-amber-600">{pendingDeliveries}</div>
                        <div className="mt-4">
                            <Link href="/driver">
                                <Button variant="outline" className="w-full">Lihat Daftar Kirim</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
