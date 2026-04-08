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

export function OrderClientPage({ orders, products, userRole, outletId, date }: any) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();

    const handleSuccess = (orderId?: number) => {
        setIsDialogOpen(false);
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
                                    currentOutletId={outletId}
                                    products={products}
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