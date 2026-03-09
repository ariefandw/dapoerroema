import { db } from "@/db";
import { outlets, brands as brandsTable } from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Phone, Tag } from "lucide-react";
import { OutletDialog } from "./OutletDialog";
import { deleteOutlet } from "@/app/actions/master";
import { PageContainer } from "@/components/PageContainer";
import { DeleteActionButton } from "@/components/DeleteActionButton";

export const dynamic = "force-dynamic";

export default async function OutletsPage() {
    await requireRole(["admin"]);

    const [allOutlets, allBrands] = await Promise.all([
        db.query.outlets.findMany({
            with: {
                brand: true
            },
            orderBy: (outlets, { asc }) => [asc(outlets.name)]
        }),
        db.select().from(brandsTable).orderBy(brandsTable.name)
    ]);

    return (
        <PageContainer className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Outlet</h1>
                    <p className="text-muted-foreground text-sm">Kelola tujuan pengiriman roti</p>
                </div>
                <OutletDialog brands={allBrands}>
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
                            <TableHead>Brand</TableHead>
                            <TableHead>Info Kontak</TableHead>
                            <TableHead className="w-[100px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allOutlets.map((outlet) => (
                            <TableRow key={outlet.id}>
                                <TableCell className="font-medium">{outlet.name}</TableCell>
                                <TableCell>
                                    {outlet.brand ? (
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Tag className="h-3.5 w-3.5 text-blue-500" />
                                            {outlet.brand.name}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Tanpa Brand</span>
                                    )}
                                </TableCell>
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
                                        <OutletDialog outlet={outlet as any} brands={allBrands}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </OutletDialog>
                                        <DeleteActionButton
                                            action={deleteOutlet.bind(null, outlet.id)}
                                            title={`Hapus Outlet ${outlet.name}?`}
                                            description="Menghapus outlet akan berdampak pada sejarah pesanan yang terkait. Lanjutkan?"
                                        />
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
