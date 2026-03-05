"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, CookingPot, Truck, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

const links = [
    { href: "/dashboard", label: "Home", roles: ["admin", "owner"], icon: LayoutDashboard },
    { href: "/admin", label: "Product Order", roles: ["admin"], icon: ClipboardList },
    { href: "/baker", label: "Baker", roles: ["admin", "baker"], icon: CookingPot },
    { href: "/driver", label: "Delivery", roles: ["admin", "driver"], icon: Truck },
    { href: "/admin/master", label: "Master", roles: ["admin"], icon: Database },
];

interface BottomNavProps {
    userRole: string;
}

export function BottomNav({ userRole }: BottomNavProps) {
    const pathname = usePathname();

    // Show all links for admin, or filter by role
    const filteredLinks = links.filter(l =>
        !l.roles ||
        (userRole && l.roles.includes(userRole)) ||
        userRole === "admin"
    );

    if (filteredLinks.length === 0) return null;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-lg border-t safe-area-bottom">
            <div className="flex items-center justify-around h-16">
                {filteredLinks.map(({ href, label, icon: Icon }) => {
                    const isActive = href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(href);

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive ? "fill-primary/10" : "")} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
                            {isActive && (
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    );
}
