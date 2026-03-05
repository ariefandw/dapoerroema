"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChefHat, Loader2 } from "lucide-react";

const DEMO_ACCOUNTS = [
    { label: "Admin", email: "admin@orbery.local", password: "admin123" },
    { label: "Baker", email: "baker@orbery.local", password: "baker123" },
    { label: "Driver", email: "driver@orbery.local", password: "driver123" },
    { label: "Owner", email: "owner@orbery.local", password: "owner123" },
];

export default function OrberyLoginPage() {
    console.log("LOGIN PAGE MOUNTED - V2");
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await signIn.email({ email, password });
            if (res.error) {
                setError(res.error.message ?? "Invalid credentials.");
                setLoading(false);
                return;
            }
            const role = (res.data?.user as any)?.role ?? "admin";
            const dest = role === "baker" ? "/baker"
                : role === "driver" ? "/driver"
                    : role === "owner" ? "/dashboard"
                        : "/admin";
            router.push(dest);
            router.refresh();
        } catch {
            setError("Something went wrong. Try again.");
            setLoading(false);
        }
    }

    if (!mounted) return null;

    return (
        /* Full-screen background */
        <div
            id="login-page-root"
            className="min-h-screen flex items-center justify-center relative"
            style={{
                backgroundImage: "url('/login-bg.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Scrim so the card pops */}
            <div className="absolute inset-0 bg-black/60 shadow-inner" />

            {/* Standard Shadcn Card with custom centering and padding */}
            <Card className="relative z-10 w-full max-w-sm shadow-2xl border-white/10 bg-card/95 backdrop-blur-sm overflow-hidden" id="login-card">
                {/* Custom Header Area - Direct Flexbox to guarantee centering */}
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex justify-center w-full">
                        <ChefHat className="size-12 text-primary" strokeWidth={1.5} />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Orbery</CardTitle>
                    <CardDescription className="text-muted-foreground/80 mt-1">Bakery management system</CardDescription>
                </div>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@orbery.local"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-background/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-background/50"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20 text-center animate-in fade-in duration-300">
                                {error}
                            </p>
                        )}

                        <Button type="submit" className="w-full font-bold mt-2" disabled={loading}>
                            {loading
                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in…</>
                                : "Sign In"}
                        </Button>
                    </form>

                    {/* Demo section - Explicit 2-column grid */}
                    <div className="space-y-4 pt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="bg-white/5" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                                <span className="bg-card px-2 text-muted-foreground">Demo Accounts</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {DEMO_ACCOUNTS.map((acct) => (
                                <Button
                                    key={acct.label}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs border-muted/50 hover:bg-primary/5 hover:text-primary transition-all font-semibold"
                                    onClick={() => {
                                        setEmail(acct.email);
                                        setPassword(acct.password);
                                        setError("");
                                    }}
                                >
                                    {acct.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
