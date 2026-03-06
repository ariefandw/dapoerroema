import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { STATUS_UI_MAP, OrderStatus } from "@/lib/status-dictionary";

export function OrdersTable({ orders }: { orders: any[] }) {
    if (orders.length === 0) {
        return (
            <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                    Tidak ada pesanan ditemukan.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pesanan Aktif</CardTitle>
                <CardDescription>Lacak status pesanan Anda saat ini.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col">
                    {orders.map((order, index) => {
                        const ui = STATUS_UI_MAP[order.status as OrderStatus];
                        const isLast = index === orders.length - 1;
                        return (
                            <div key={order.id} className={`py-4 flex flex-col gap-2 ${!isLast ? 'border-b border-border/50' : ''}`}>
                                {/* Header Row: Order ID, Date, Status */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">#{order.id}</span>
                                        <span className="text-xs text-muted-foreground">{format(new Date(order.order_date), "dd MMM HH:mm")}</span>
                                    </div>
                                    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${ui?.colorClass ?? "bg-primary/10 text-primary"}`}>
                                        {ui?.label ?? order.status}
                                    </span>
                                </div>

                                {/* Content Row: Outlet & Items */}
                                <div>
                                    <h3 className="font-semibold text-sm leading-none mb-1.5">{order.outlet.name}</h3>
                                    <div className="text-sm text-muted-foreground leading-snug space-y-0.5">
                                        {order.items.map((item: any) => (
                                            <div key={item.id}>{item.quantity}x {item.product.name}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
