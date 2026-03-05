"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChefHat, LayoutDashboard, ClipboardList, CookingPot, Truck, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/UserMenu";
import { MasterDataMenu } from "@/components/MasterDataMenu";

const links = [
    { href: "/dashboard", label: "Dashboard", roles: ["admin", "owner"], icon: LayoutDashboard },
    { href: "/admin", label: "Product Order", roles: ["admin"], icon: ClipboardList },
    { href: "/baker", label: "Cutter & Baker", roles: ["admin", "baker"], icon: CookingPot },
    { href: "/driver", label: "Shipping/Driver", roles: ["admin", "driver"], icon: Truck },
];


interface NavbarProps {
    session: any;
    userRole: string;
}

export function Navbar({ session, userRole }: NavbarProps) {
    const router = useRouter();
    const pathname = usePathname();

    const filteredLinks = links.filter(l =>
        !l.roles ||
        (userRole && l.roles.includes(userRole)) ||
        userRole === "admin"
    );

    return (
        <nav className="border-b bg-background sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-1.5 font-bold text-sm tracking-tight flex-shrink-0 hover:opacity-80 transition-opacity">
                    <ChefHat className="h-5 w-5 text-primary" />
                    <span>Orbery</span>
                </Link>

                {/* Desktop links */}
                <div className="hidden md:flex gap-1 flex-1">
                    {filteredLinks.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
                                pathname.startsWith(href) && !href.includes("/master")
                                    ? "bg-muted text-foreground font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    {/* Master Data for Admin (Desktop) */}
                    {userRole === "admin" && (
                        <div className="hidden md:flex items-center border-r pr-2 mr-2">
                            <MasterDataMenu />
                        </div>
                    )}

                    <ThemeToggle />

                    {/* User Menu */}
                    {session ? (
                        <UserMenu user={{ name: session.user.name, email: session.user.email, role: userRole }} />
                    ) : (
                        <Link href="/login">
                            <Button variant="outline" size="sm" className="h-8 text-xs">Sign in</Button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
