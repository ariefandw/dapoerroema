import { PageContainer } from "@/components/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, Database } from "lucide-react";
import Link from "next/link";

const masterDataItems = [
    {
        title: "Products",
        description: "Manage product catalog, prices, and variants.",
        href: "/admin/master/products",
        icon: Package,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
    },
    {
        title: "Outlets",
        description: "Manage store locations and contact details.",
        href: "/admin/master/outlets",
        icon: Store,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
    },
];

export default function MasterDataHub() {
    return (
        <PageContainer>
            <div className="space-y-6 max-w-2xl mx-auto py-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
                        <Database className="h-6 w-6 text-primary" />
                        Master Data
                    </h1>
                    <p className="text-muted-foreground">
                        Select a category below to manage your core business entities.
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
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>{item.description}</CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </PageContainer>
    );
}
