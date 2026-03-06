import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// All routes that require a logged-in session
const PROTECTED_ROUTES = ["/admin", "/order", "/baker", "/driver", "/dashboard"];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
    if (!isProtected) return NextResponse.next();

    // getSessionCookie is Edge-compatible — only reads the cookie, no DB call
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Session exists — let the page through.
    // Role enforcement happens in each server component page via auth.api.getSession.
    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/order/:path*", "/baker/:path*", "/driver/:path*", "/dashboard/:path*"],
};
