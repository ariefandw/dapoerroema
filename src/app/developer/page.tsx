"use server";

import { PageContainer } from "@/components/PageContainer";
import { requireRole } from "@/lib/auth-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Trash2, RefreshCcw, ShieldAlert, Terminal as TerminalIcon } from "lucide-react";
import { seedDatabase } from "@/app/actions";
import { toast } from "sonner";
import { redirect } from "next/navigation";

export default async function DeveloperPage() {
    // Public access - no auth required

    const handleSeed = async () => {
        "use server";
        const res = await seedDatabase(false);
        if (res.success) {
            console.log("Seeding successful");
        }
    };

    const handleClear = async () => {
        "use server";
        const res = await seedDatabase(true);
        if (res.success) {
            console.log("Cleanup successful");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <PageContainer className="py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest bg-primary/10 w-fit px-2 py-1 rounded">
                    <TerminalIcon className="h-3 w-3" />
                    Developer Console
                </div>
                <h1 className="text-4xl font-black tracking-tighter">Sytem <span className="text-primary italic">Management</span></h1>
                <p className="text-muted-foreground">Advanced tools for database orchestration and state management. Exercise caution.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Seeder Card */}
                <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm group hover:border-primary/50 transition-all duration-300">
                    <CardHeader>
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                            <RefreshCcw className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">Re-Seed Data</CardTitle>
                        <CardDescription>
                            Destructive operation. This will wipe all existing order-related data and re-populate with fresh Yogyakarta-based samples.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <form action={handleSeed}>
                            <Button className="w-full font-bold h-12 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all border-b-4 border-primary/20 active:border-b-0 active:translate-y-1">
                                <Database className="mr-2 h-4 w-4" />
                                EXECUTE SEEDER
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Cleanup Card */}
                <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm group hover:border-destructive/50 transition-all duration-300">
                    <CardHeader>
                        <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">Clear Database</CardTitle>
                        <CardDescription>
                            Atomically remove all orders, trails, and transaction history. Use this for a complete reset before demonstration.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <form action={handleClear}>
                            <Button variant="destructive" className="w-full font-bold h-12 shadow-lg shadow-destructive/20 hover:shadow-destructive/40 transition-all border-b-4 border-destructive/20 active:border-b-0 active:translate-y-1">
                                <Trash2 className="mr-2 h-4 w-4" />
                                WIPE DATA
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
                <div className="flex items-center gap-4 p-6">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                        <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold text-sm text-destructive uppercase tracking-tight">Warning Domain</p>
                        <p className="text-xs text-destructive/80 leading-relaxed font-medium">
                            Executions are final. Ensure you are in the correct environment (Production vs Staging) before orchestrating data wipes. Logged activity will be audited.
                        </p>
                    </div>
                </div>
            </Card>
        </PageContainer>
        </div>
    );
}
