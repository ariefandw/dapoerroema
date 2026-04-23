"use client";

import { useState } from "react";
import { CreateOrderForm } from "@/components/CreateOrderForm";
import { OrdersTable } from "@/components/OrdersTable";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LocationGate } from "@/components/LocationGate";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { STATUS_UI_MAP, OrderStatus } from "@/lib/status-dictionary";
import { useGlobalState } from "@/lib/GlobalStateProvider";

const fetcher = (url: string) => fetch(url).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch');
    return data;
});

export function OrderClientPage({ orders: initialOrders, products, outlets, userRole, outletId, date }: any) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();

    const { data: orders = initialOrders } = useSWR(
        `/api/orders${date ? `?date=${date}` : ""}`,
        fetcher,
        {
            fallbackData: initialOrders,
            refreshInterval: 5000,
            revalidateOnFocus: true,
        }
    );

    const prevOrdersRef = useRef(orders);
    const { revalidateOrders } = useGlobalState();

    useEffect(() => {
        if (orders && Array.isArray(orders) && prevOrdersRef.current && Array.isArray(prevOrdersRef.current)) {
            orders.forEach((order: any) => {
                const prevOrder = prevOrdersRef.current.find((o: any) => o.id === order.id);
                if (prevOrder && prevOrder.status !== order.status) {
                    toast.info(`Status order #${order.id} berubah menjadi: ${STATUS_UI_MAP[order.status as OrderStatus]?.label}`);
                }
            });
        }
        prevOrdersRef.current = orders;
    }, [orders]);

    const handleSuccess = (orderId?: number) => {
        setIsDialogOpen(false);
        revalidateOrders(); // Revalidate orders after creating a new one
        if (orderId) {
            router.push(`/order/${orderId}`);
        }
    };

    const content = (
        <PageContainer>
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Order</h1>
                {["admin", "user"].includes(userRole as string) && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Buat Order Baru
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] max-sm:max-w-[100vw] max-sm:w-screen max-sm:h-[100dvh] max-sm:rounded-none max-sm:border-none max-sm:m-0 max-sm:!top-0 max-sm:!translate-y-0 max-sm:content-start overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Penerimaan Order Baru</DialogTitle>
                                <DialogDescription>
                                    Buat order baru untuk outlet.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                                <CreateOrderForm
                                    key={outletId}
                                    currentOutletId={outletId}
                                    products={products}
                                    outlets={outlets}
                                    userRole={userRole}
                                    onSuccess={handleSuccess}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="w-full mt-8">
                <OrdersTable orders={orders} currentDate={date} userRole={userRole} />
            </div>
        </PageContainer>
    );

    if (userRole === "runner") {
        return <LocationGate>{content}</LocationGate>;
    }

    return content;
}
