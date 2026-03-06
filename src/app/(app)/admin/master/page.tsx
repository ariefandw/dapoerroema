import { PageContainer } from "@/components/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, Database, Warehouse, Truck } from "lucide-react";
import Link from "next/link";

const masterDataItems = [
    {
        title: "Produk",
        description: "Kelola katalog produk, harga, dan varian.",
        href: "/admin/master/products",
        icon: Package,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
    },
    {
        title: "Outlet",
        description: "Kelola lokasi toko dan detail kontak.",
        href: "/admin/master/outlets",
        icon: Store,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
    },
    {
        title: "Stok",
        description: "Kelola stok di gudang dan setiap outlet.",
        href: "/admin/master/stock",
        icon: Warehouse,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
    },
    {
        title: "Penerimaan Barang",
        description: "Catat barang masuk dari supplier ke gudang.",
        href: "/admin/receiving",
        icon: Truck,
        color: "text-cyan-500",
        bgColor: "bg-cyan-500/10",
    },
    {
        title: "User",
        description: "Kelola peran user dan outlet default.",
        href: "/admin/users",
        icon: Database,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
    },
];

export default function MasterDataHub() {
    return (
        <PageContainer>
            <div className="space-y-6 max-w-7xl mx-auto py-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
                        <Database className="h-6 w-6 text-primary" />
                        Data Induk
                    </h1>
                    <p className="text-muted-foreground">
                        Pilih kategori di bawah untuk mengelola entitas bisnis utama Anda.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {masterDataItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full border-border/50">
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <div className={`p-3 rounded-xl ${item.bgColor}`}>
                                        <item.icon className={`h-6 w-6 ${item.color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{item.title}</CardTitle>
                                        <CardDescription>{item.description}</CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </PageContainer>
    );
}
