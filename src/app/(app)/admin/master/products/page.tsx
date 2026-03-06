import { db } from "@/db";
import { products } from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Tag, Utensils } from "lucide-react";
import { ProductDialog } from "./ProductDialog";
import { deleteProduct } from "@/app/actions/master";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/PageContainer";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
    await requireRole(["admin"]);

    const allProducts = await db.select().from(products).orderBy(products.category, products.name);

    return (
        <PageContainer className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Produk</h1>
                    <p className="text-muted-foreground text-sm">Kelola katalog roti Anda</p>
                </div>
                <ProductDialog>
                    <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Tambah Produk
                    </Button>
                </ProductDialog>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Nama Produk</TableHead>
                            <TableHead className="text-right">Harga Dasar</TableHead>
                            <TableHead className="w-[100px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">
                                        {product.category}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Utensils className="h-3 w-3 text-muted-foreground" />
                                        {product.name}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    Rp {product.base_price.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <ProductDialog product={product}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </ProductDialog>
                                        <form action={deleteProduct.bind(null, product.id)}>
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
