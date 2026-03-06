import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

// Get the base URL at runtime, not build time
const getBaseURL = () => {
    if (typeof window !== "undefined") {
        return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
};

export const authClient = createAuthClient({
    baseURL: getBaseURL(),
    plugins: [
        adminClient(),
        inferAdditionalFields<typeof auth>(),
    ],
});

export const { signIn, signOut, useSession } = authClient;
