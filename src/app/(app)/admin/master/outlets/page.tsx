import { db } from "@/db";
import { outlets } from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Phone } from "lucide-react";
import { OutletDialog } from "./OutletDialog";
import { deleteOutlet } from "@/app/actions/master";
import { PageContainer } from "@/components/PageContainer";

export const dynamic = "force-dynamic";

export default async function OutletsPage() {
    await requireRole(["admin"]);

    const allOutlets = await db.select().from(outlets).orderBy(outlets.name);

    return (
        <PageContainer className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Outlet</h1>
                    <p className="text-muted-foreground text-sm">Kelola tujuan pengiriman roti</p>
                </div>
                <OutletDialog>
                    <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Tambah Outlet
                    </Button>
                </OutletDialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Outlet</TableHead>
                            <TableHead>Info Kontak</TableHead>
                            <TableHead className="w-[100px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allOutlets.map((outlet) => (
                            <TableRow key={outlet.id}>
                                <TableCell className="font-medium">{outlet.name}</TableCell>
                                <TableCell>
                                    {outlet.contact_info ? (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Phone className="h-3 w-3" /> {outlet.contact_info}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Tidak ada info kontak</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <OutletDialog outlet={outlet}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </OutletDialog>
                                        <form action={deleteOutlet.bind(null, outlet.id)}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </PageContainer>
    );
}
