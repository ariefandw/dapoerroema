import { PageContainer } from "@/components/PageContainer";
import { requireRole } from "@/lib/auth-guard";
import { getRunnerLocations } from "@/app/actions";
import RunnerMapWrapper from "./RunnerMapWrapper";

export const revalidate = 0;

import { MapPin, Navigation, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminMapPage() {
    await requireRole(["admin"]);
    const initialData = await getRunnerLocations();

    return (
        <PageContainer className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight">Runner Monitoring</h1>
                    </div>
                    <p className="text-muted-foreground">Lacak posisi runner dan progres pengiriman secara real-time.</p>
                </div>
                <Button asChild variant="outline" size="sm" className="font-bold border-border/40 bg-background/50 backdrop-blur-sm">
                    <Link href="/order">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Order
                    </Link>
                </Button>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <RunnerMapWrapper initialData={initialData} />
            </div>
        </PageContainer>
    );
}
