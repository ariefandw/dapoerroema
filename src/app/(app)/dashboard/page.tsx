import { requireRole } from "@/lib/auth-guard";
import { PageContainer } from "@/components/PageContainer";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { BakerDashboard } from "@/components/dashboards/BakerDashboard";
import { DriverDashboard } from "@/components/dashboards/DriverDashboard";
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
            ) : role === "baker" ? (
                <BakerDashboard session={session} />
            ) : role === "driver" ? (
                <DriverDashboard session={session} />
            ) : (
                <div className="p-8 text-center text-muted-foreground">
                    Peran tidak dikenali. Silakan hubungi administrator.
                </div>
            )}
        </PageContainer>
    );
}
