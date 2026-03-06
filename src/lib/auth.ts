import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "@/db";
import { user, session, account, verification } from "@/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: { user, session, account, verification },
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        admin(),
    ],
    user: {
        additionalFields: {
            currentOutletId: {
                type: "number",
                required: false,
                defaultValue: null,
                input: true,
            },
        },
    },
});

export type Session = typeof auth.$Infer.Session & {
    user: {
        role: string;
        currentOutletId?: number | null;
        banned?: boolean | null;
        banReason?: string | null;
        banExpires?: Date | null;
    }
};
