import { db } from "@/db";
import { brands, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth-guard";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Tag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandPriceList } from "./BrandPriceList";

export const dynamic = "force-dynamic";

interface BrandPricesPageProps {
    params: Promise<{ id: string }>;
}

export default async function BrandPricesPage({ params }: BrandPricesPageProps) {
    await requireRole(["admin"]);
    const { id } = await params;
    const brandId = parseInt(id);

    const brand = await db.query.brands.findFirst({
        where: eq(brands.id, brandId),
        with: {
            brandPrices: true
        }
    });

    if (!brand) notFound();

    const allProducts = await db.select().from(products).orderBy(products.category, products.name);

    return (
        <PageContainer className="space-y-6">
            <div className="flex flex-col gap-4">
                <Link href="/admin/master/brands">
                    <Button variant="ghost" size="sm" className="-ml-2 h-8 gap-1 text-muted-foreground">
                        <ChevronLeft className="h-4 w-4" /> Kembali ke Brand
                    </Button>
                </Link>

                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Tag className="h-5 w-5 text-blue-500" />
                            <h1 className="text-2xl font-bold tracking-tight">{brand.name}</h1>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Atur harga khusus produk untuk brand ini. Jika kosong, akan menggunakan harga dasar produk.
                        </p>
                    </div>
                </div>
            </div>

            <BrandPriceList
                brandId={brandId}
                products={allProducts}
                initialPrices={brand.brandPrices}
            />
        </PageContainer>
    );
}
