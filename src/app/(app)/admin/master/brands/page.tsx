import { db } from "@/db";
import { brands } from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Tag } from "lucide-react";
import { BrandDialog } from "./BrandDialog";
import { deleteBrand } from "@/app/actions/master";
import { PageContainer } from "@/components/PageContainer";
import { DeleteActionButton } from "@/components/DeleteActionButton";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
    await requireRole(["admin"]);

    const allBrands = await db.select().from(brands).orderBy(desc(brands.created_at));

    return (
        <PageContainer className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Brand</h1>
                    <p className="text-muted-foreground text-sm">Kelola brand untuk pengelompokan outlet</p>
                </div>
                <BrandDialog>
                    <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Tambah Brand
                    </Button>
                </BrandDialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Brand</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead className="w-[100px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allBrands.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                                    Belum ada brand yang terdaftar
                                </TableCell>
                            </TableRow>
                        ) : (
                            allBrands.map((brand) => (
                                <TableRow key={brand.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-blue-500" />
                                            {brand.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                                        {brand.description || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <BrandDialog brand={brand}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </BrandDialog>
                                            <DeleteActionButton
                                                action={deleteBrand.bind(null, brand.id)}
                                                title={`Hapus Brand ${brand.name}?`}
                                                description="Menghapus brand tidak akan menghapus outlet, tetapi hubungan mereka akan terputus. Lanjutkan?"
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </PageContainer>
    );
}
