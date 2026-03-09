"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import { useTransition } from "react";
import { updateOrderStatus } from "@/app/actions";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Calendar, Package, CalendarDays, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "./ui/button";

export function OrdersTable({ orders, currentDate, userRole = "admin" }: { orders: any[]; currentDate?: string; userRole?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const today = format(new Date(), "yyyy-MM-dd");
    const displayValue = currentDate || today;

    const handleStatusChange = (orderId: number, currentStatus: string, newStatus: string) => {
        if (currentStatus === newStatus) return;
        startTransition(async () => {
            const result = await updateOrderStatus(orderId, currentStatus, newStatus, pathname);
            if (result.success) {
                toast.success("Status order berhasil diperbarui!");
            } else {
                toast.error(result.error || "Gagal memperbarui status");
            }
        });
    };

    const getAvailableStatuses = (role: string) => {
        const allStatuses = ["pending", "accepted", "in_production", "ready", "shipping", "delivered", "cancelled"];
        if (role === "admin") return allStatuses;
        if (role === "baker") return ["pending", "accepted", "in_production", "ready"];
        if (role === "runner") return ["ready", "shipping", "delivered"];
        return [];
    };

    const availableStatuses = getAvailableStatuses(userRole);

    function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        const params = new URLSearchParams(searchParams.toString());
        if (val) {
            params.set("date", val);
        } else {
            params.delete("date");
        }
        router.push(`?${params.toString()}`);
    }
    return (
        <Card className="overflow-hidden border-border/50">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Order Aktif
                        </CardTitle>
                        <CardDescription>Lacak status order Anda pada tanggal terpilih.</CardDescription>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial min-w-[170px]">
                            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
                            <Input
                                type="date"
                                value={displayValue}
                                onChange={handleDateChange}
                                className="pl-9 h-9 bg-background border-border/40 focus:ring-primary/20 text-xs font-bold ring-offset-background transition-all hover:bg-muted/50"
                            />
                        </div>
                        {userRole === "admin" && (
                            <Button
                                asChild
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 bg-background border-border/40 hover:bg-muted font-bold shadow-sm"
                                title="Pantau Lokasi Runner"
                            >
                                <Link href="/admin/map">
                                    <MapPin className="h-4 w-4 text-primary" />
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {orders.length === 0 ? (
                    <div className="py-12 text-center border-t border-border/10">
                        <div className="flex flex-col items-center gap-2">
                            <Package className="h-8 w-8 text-muted-foreground/30" />
                            <p className="text-muted-foreground font-medium text-sm">Tidak ada order ditemukan untuk tanggal ini.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Desktop View */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                                        <TableHead className="w-[200px]">Tanggal Order</TableHead>
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
                                                    {availableStatuses.includes(order.status) && availableStatuses.length > 0 ? (
                                                        <Select
                                                            defaultValue={order.status}
                                                            onValueChange={(val) => handleStatusChange(order.id, order.status, val)}
                                                            disabled={isPending}
                                                        >
                                                            <SelectTrigger className={`w-[130px] ml-auto h-7 text-[10px] font-black uppercase tracking-wider ${ui?.colorClass ?? "bg-primary/10 text-primary"}`}>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableStatuses.map(status => (
                                                                    <SelectItem key={status} value={status} className="text-xs">
                                                                        {STATUS_UI_MAP[status as OrderStatus]?.label || status}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${ui?.colorClass ?? "bg-primary/10 text-primary"}`}>
                                                            {ui?.label ?? order.status}
                                                        </span>
                                                    )}
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
                                            {availableStatuses.includes(order.status) && availableStatuses.length > 0 ? (
                                                <Select
                                                    defaultValue={order.status}
                                                    onValueChange={(val) => handleStatusChange(order.id, order.status, val)}
                                                    disabled={isPending}
                                                >
                                                    <SelectTrigger className={`w-[120px] h-7 text-[10px] font-black uppercase tracking-wider ${ui?.colorClass ?? "bg-primary/10 text-primary"}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableStatuses.map(status => (
                                                            <SelectItem key={status} value={status} className="text-xs">
                                                                {STATUS_UI_MAP[status as OrderStatus]?.label || status}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${ui?.colorClass ?? "bg-primary/10 text-primary"}`}>
                                                    {ui?.label ?? order.status}
                                                </span>
                                            )}
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
                    </>
                )}
            </CardContent>
        </Card >
    );
}

