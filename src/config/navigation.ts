import { LayoutDashboard, ClipboardList, CookingPot, Truck, Database, Calculator } from "lucide-react";

export type NavLink = {
    href: string;
    label: string;
    roles?: string[]; // If undefined, all roles can see it
    icon: any;
};

export const NAVIGATION_LINKS: NavLink[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, // Everyone gets the dashboard
    // Default hidden for future feature usage:
    // { href: "/cashier", label: "Kasir", roles: ["admin", "cashier"], icon: Calculator },
    { href: "/order", label: "Order", roles: ["admin"], icon: ClipboardList },
    { href: "/baker", label: "Produksi", roles: ["admin", "baker"], icon: CookingPot },
    { href: "/driver", label: "Pengiriman", roles: ["admin", "driver"], icon: Truck },
    { href: "/admin/master", label: "Master Data", roles: ["admin"], icon: Database },
];

export function getNavigationLinks(userRole: string | undefined): NavLink[] {
    if (!userRole) return [];

    return NAVIGATION_LINKS.filter(link =>
        !link.roles || link.roles.includes(userRole) || userRole === "admin"
    );
}
