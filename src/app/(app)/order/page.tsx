import { getOutlets, getProducts, getActiveOrders } from "@/app/actions";
import { CreateOrderForm } from "@/components/CreateOrderForm";
import { OrdersTable } from "@/components/OrdersTable";
import { requireRole } from "@/lib/auth-guard";
import { PageContainer } from "@/components/PageContainer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LocationGate } from "@/components/LocationGate";

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    await requireRole(["admin", "baker", "runner"]);
    const { date } = await searchParams;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const userRole: string = (session?.user as any)?.role ?? "admin";
    const outletId = (session?.user as any)?.currentOutletId;

    const [outlets, products, orders] = await Promise.all([
        getOutlets(),
        getProducts(),
        getActiveOrders(outletId, date),
    ]);

    const content = (
        <PageContainer className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Order</h1>
                    <p className="text-muted-foreground">Kelola penerimaan roti dan lacak order aktif.</p>
                </div>
                {userRole === "admin" && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="font-bold shadow-lg shadow-primary/20">
                                <Plus className="mr-2 h-4 w-4" />
                                Buat Order Baru
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Penerimaan Order Baru</DialogTitle>
                                <DialogDescription>
                                    Buat order baru untuk outlet.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                                <CreateOrderForm outlets={outlets} products={products} />
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

    // Runners must have location permission to access this page
    if (userRole === "runner") {
        return <LocationGate>{content}</LocationGate>;
    }

    return content;
}
