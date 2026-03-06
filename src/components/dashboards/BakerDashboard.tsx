import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getBakerItems } from "@/app/actions";
import { CookingPot } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function BakerDashboard({ session }: { session: any }) {
    const outletId = (session?.user as any)?.currentOutletId;
    const orders = await getBakerItems(outletId);

    // Aggregate items by product name
    const aggregatedItems: Record<string, number> = {};
    let totalItems = 0;

    orders.forEach((order) => {
        order.items.forEach((item: any) => {
            const productName = item.product.name;
            aggregatedItems[productName] = (aggregatedItems[productName] || 0) + item.quantity;
            totalItems += item.quantity;
        });
    });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Rincian Kebutuhan Produksi</CardTitle>
                    <CardDescription>Total akumulasi pesanan saat ini. Ada {totalItems} roti yang perlu diproduksi saat ini.</CardDescription>
                </CardHeader>
                <CardContent>
                    {totalItems === 0 ? (
                        <p className="text-muted-foreground text-center py-6">Semua pesanan sudah selesai.</p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(aggregatedItems).map(([productName, quantity]) => (
                                <div key={productName} className="p-4 bg-muted/50 rounded-lg text-center">
                                    <div className="text-3xl font-black mb-1">{quantity}x</div>
                                    <div className="text-sm font-medium text-muted-foreground">{productName}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <Link href="/baker">
                            <Button>Lihat Detail Antrean Produksi</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
