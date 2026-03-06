"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChefHat, LayoutDashboard, ClipboardList, CookingPot, Truck, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/UserMenu";
import { OutletSwitcher } from "@/components/OutletSwitcher";
import { Session } from "@/lib/auth";

import { getNavigationLinks } from "@/config/navigation";

interface NavbarProps {
    session: Session | null;
    userRole: string;
    outlets: any[];
}

export function Navbar({ session, userRole, outlets }: NavbarProps) {
    const router = useRouter();
    const pathname = usePathname();

    const filteredLinks = getNavigationLinks(userRole);

    return (
        <nav className="border-b bg-background sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-4">
                {/* Outlet Switcher / Logo (Left) */}
                <div className="flex items-center">
                    <OutletSwitcher
                        outlets={outlets}
                        currentOutletId={session?.user?.currentOutletId}
                    />
                </div>

                {/* Desktop links */}
                <div className="hidden md:flex gap-1 flex-1">
                    {filteredLinks.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
                                pathname.startsWith(href) && !href.includes("/master") && href !== "/"
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
                    <ThemeToggle />

                    {/* User Menu */}
                    {session ? (
                        <UserMenu
                            user={{
                                name: session.user.name,
                                email: session.user.email,
                                role: userRole,
                            }}
                        />
                    ) : (
                        <Link href="/login">
                            <Button variant="outline" size="sm" className="h-8 text-xs">Masuk</Button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
