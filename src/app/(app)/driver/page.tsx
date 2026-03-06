import { getDriverOrders, updateOrderStatus } from "@/app/actions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-guard";
import { PageContainer } from "@/components/PageContainer";

export default async function DriverPage() {
    await requireRole(["driver", "admin"]);
    const orders = await getDriverOrders();

    return (
        <PageContainer>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Daftar Kirim</h1>
                <p className="text-muted-foreground">Rute pengiriman aktif dan serah terima pesanan.</p>
            </div>

            {orders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Tidak ada order yang siap dikirim atau sedang dalam pengiriman.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orders.map((order) => (
                        <Card key={order.id} className="flex flex-col relative overflow-hidden">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base leading-tight">{order.outlet.name}</CardTitle>
                                        <CardDescription className="text-xs mt-0.5">Order #{order.id}</CardDescription>
                                    </div>
                                    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap ${order.status === "Shipped" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col">
                                <div className="mb-3">
                                    <ul className="space-y-1">
                                        {order.items.map((item: any) => (
                                            <li key={item.id} className="text-sm flex justify-between items-center border-b border-border/50 last:border-0">
                                                <span className="text-muted-foreground">{item.product.name}</span>
                                                <span className="font-bold">{item.quantity}x</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-auto">
                                    {order.status === "Production Ready" ? (
                                        <form action={async () => {
                                            "use server";
                                            await updateOrderStatus(order.id, order.status, "Shipped", "/driver");
                                        }} className="w-full">
                                            <Button type="submit" size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-1">
                                                Tandai Siap Dikirim
                                            </Button>
                                        </form>
                                    ) : order.status === "Shipped" ? (
                                        <form action={async () => {
                                            "use server";
                                            await updateOrderStatus(order.id, order.status, "Delivered", "/driver");
                                        }} className="w-full">
                                            <Button type="submit" size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-black hover:text-white mt-1">
                                                Konfirmasi Pengiriman
                                            </Button>
                                        </form>
                                    ) : null}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </PageContainer>
    );
}
