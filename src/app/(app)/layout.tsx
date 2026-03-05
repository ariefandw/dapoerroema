import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { BottomNav } from "@/components/BottomNav";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const userRole = (session.user as any)?.role;

    return (
        <div className="min-h-screen flex flex-col pb-16 md:pb-0">
            <Navbar session={session} userRole={userRole} />
            <main className="flex-1">
                {children}
            </main>
            <BottomNav userRole={userRole} />
            <Toaster richColors position="top-right" />
            <ServiceWorkerRegistration />
        </div>
    );
}
