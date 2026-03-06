"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Database, ChevronDown, MapPin, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const adminLinks = [
    { href: "/admin/master/outlets", label: "Outlet", icon: MapPin },
    { href: "/admin/master/products", label: "Produk", icon: Package },
];

export function MasterDataMenu() {
    const pathname = usePathname();
    const isActive = pathname.startsWith("/admin/master");

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 gap-1 text-xs font-semibold px-2",
                        isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                >
                    <Database className="h-3.5 w-3.5" />
                    <span>Data Induk</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
                {adminLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                        <Link
                            href={link.href}
                            className={cn(
                                "flex items-center gap-2 w-full cursor-pointer",
                                pathname === link.href ? "bg-muted font-bold" : ""
                            )}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
