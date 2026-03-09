import { LayoutDashboard, ClipboardList, Database } from "lucide-react";

export type NavLink = {
    href: string;
    label: string;
    roles?: string[]; // If undefined, all roles can see it
    icon: any;
};

export const NAVIGATION_LINKS: NavLink[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/order", label: "Order", roles: ["admin", "baker", "runner"], icon: ClipboardList },
    { href: "/admin/master", label: "Master Data", roles: ["admin"], icon: Database },
    // Default hidden for future feature usage:
    // { href: "/cashier", label: "Kasir", roles: ["admin", "cashier"], icon: Calculator },
];

export function getNavigationLinks(userRole: string | undefined): NavLink[] {
    if (!userRole) return [];

    return NAVIGATION_LINKS.filter(link =>
        !link.roles || link.roles.includes(userRole) || userRole === "admin"
    );
}
