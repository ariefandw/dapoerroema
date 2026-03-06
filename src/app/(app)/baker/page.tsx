import { getBakerItems } from "@/app/actions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/app/actions";
import { requireRole } from "@/lib/auth-guard";
import { PageContainer } from "@/components/PageContainer";

export default async function BakerPage() {
    await requireRole(["baker", "admin"]);
    const orders = await getBakerItems();

    return (
        <PageContainer>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Antrean Produksi</h1>
                <p className="text-muted-foreground">Daftar pesanan yang menunggu untuk dibuat.</p>
            </div>

            {orders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Tidak ada order yang menunggu produksi.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {/* Individual order breakdown to mark as ready */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {orders.map((order) => (
                                <Card key={order.id} className="flex flex-col relative overflow-hidden">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-base leading-tight">{order.outlet.name}</CardTitle>
                                                <CardDescription className="text-xs mt-0.5">Order #{order.id}</CardDescription>
                                            </div>
                                            <span className="inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-secondary text-secondary-foreground whitespace-nowrap">
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
                                            <form action={async () => {
                                                "use server";
                                                await updateOrderStatus(order.id, order.status, "Production Ready", "/baker");
                                            }} className="w-full">
                                                <Button type="submit" size="sm" className="w-full bg-secondary hover:bg-secondary/90 text-white mt-1">
                                                    Tandai Siap Produksi
                                                </Button>
                                            </form>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    );
}
