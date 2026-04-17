import { Navbar } from "@/components/Navbar";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OrderNotificationManager } from "@/components/OrderNotificationManager";
import { BottomNav } from "@/components/BottomNav";
import { auth, Session } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GlobalStateProvider } from "@/lib/GlobalStateProvider";
import { AuthProvider } from "@/lib/auth-provider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    }) as Session | null;

    if (!session) {
        redirect("/login");
    }

    const userRole = session.user.role || "admin";
    const { getOutlets } = await import("@/app/actions");
    const outlets = await getOutlets();

    return (
        <AuthProvider>
            <GlobalStateProvider>
                <div className="min-h-screen flex flex-col pb-16 md:pb-0">
                    <Navbar session={session} userRole={userRole} outlets={outlets} />
                    <main className="flex-1">
                        {children}
                    </main>
                    <BottomNav userRole={userRole} />
                    <ServiceWorkerRegistration />
                    <PWAInstallPrompt />
                    <OrderNotificationManager userRole={userRole} currentOutletId={session.user.currentOutletId} />
                </div>
            </GlobalStateProvider>
        </AuthProvider>
    );
}
