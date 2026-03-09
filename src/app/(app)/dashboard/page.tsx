import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { requireRole } from "@/lib/auth-guard";
import { PageContainer } from "@/components/PageContainer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) redirect("/login");
    const role = (session.user as any).role ?? "admin";

    return (
        <PageContainer>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Beranda</h1>
                <p className="text-muted-foreground">Ringkasan harian untuk pekerjaan Anda.</p>
            </div>

            {role === "admin" || role === "owner" ? (
                <AdminDashboard session={session} />
            ) : (
                <div className="rounded-xl border border-border bg-muted/20 p-8 text-center space-y-2">
                    <p className="text-lg font-semibold">Selamat datang, {session.user.name}!</p>
                    <p className="text-sm text-muted-foreground">
                        Gunakan menu <strong>Order</strong> untuk mengelola dan memperbarui status pesanan.
                    </p>
                </div>
            )}
        </PageContainer>
    );
}
