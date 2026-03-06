import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { STATUS_UI_MAP, OrderStatus } from "@/lib/status-dictionary";
import { Calendar, Package } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function OrdersTable({ orders }: { orders: any[] }) {
    if (orders.length === 0) {
        return (
            <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-muted-foreground font-medium">Tidak ada pesanan ditemukan.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden border-border/50">
            <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Pesanan Aktif
                </CardTitle>
                <CardDescription>Lacak status pesanan Anda saat ini.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {/* Desktop View */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/20 hover:bg-muted/20">
                                <TableHead className="w-[200px]">Tanggal Pesanan</TableHead>
                                <TableHead>Outlet</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => {
                                const ui = STATUS_UI_MAP[order.status as OrderStatus];
                                return (
                                    <TableRow key={order.id} className="group transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{format(new Date(order.order_date), "PP")}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {format(new Date(order.order_date), "p")}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium">{order.outlet.name}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 py-1">
                                                {order.items.map((item: any) => (
                                                    <div key={item.id} className="text-xs whitespace-nowrap">
                                                        <span className="font-bold text-primary mr-1.5">{item.quantity}</span>
                                                        <span className="text-muted-foreground font-medium">{item.product.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${ui?.colorClass ?? "bg-primary/10 text-primary"}`}>
                                                {ui?.label ?? order.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden">
                    {orders.map((order, orderIdx) => {
                        const ui = STATUS_UI_MAP[order.status as OrderStatus];
                        return (
                            <div key={order.id} className="hover:bg-muted/10 transition-colors">
                                <div className="flex justify-between items-center px-4 pt-4">
                                    <span className="text-sm font-black text-primary uppercase tracking-tight">{order.outlet.name}</span>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${ui?.colorClass ?? "bg-primary/10 text-primary"}`}>
                                        {ui?.label ?? order.status}
                                    </span>
                                </div>

                                <div className="px-4 py-2">
                                    <div>
                                        {order.items.map((item: any, idx: number) => (
                                            <div key={item.id}>
                                                <div className="flex justify-between items-center text-xs py-0.5">
                                                    <span className="font-medium text-muted-foreground">{item.product.name}</span>
                                                    <span className="font-bold text-primary">{item.quantity}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="px-2 pb-4">
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium bg-muted/30 px-2 py-1 rounded w-fit">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(order.order_date), "PP p")}
                                    </div>
                                </div>
                                <Separator className="h-2 bg-muted/20 border-y border-border/10" />
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

