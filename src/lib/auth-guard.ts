import { auth, Session } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireRole(allowedRoles: string[]) {
    const session = await auth.api.getSession({
        headers: await headers(),
    }) as Session | null;

    if (!session) redirect("/login");

    const role = session.user.role ?? "admin";
    if (!allowedRoles.includes(role)) {
        // Everyone goes to the unified dashboard now.
        redirect("/dashboard");
    }

    return session;
}
