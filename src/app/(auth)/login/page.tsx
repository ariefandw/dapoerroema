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
    { label: "Admin", email: "admin@test.app", password: "Password123!" },
    { label: "Baker", email: "baker@test.app", password: "Password123!" },
    { label: "Driver", email: "driver@test.app", password: "Password123!" },
    { label: "User", email: "user@test.app", password: "Password123!" },
    { label: "Cashier YAP", email: "cashier-yap@test.app", password: "Password123!" },
    { label: "Cashier Kael", email: "cashier-kael@test.app", password: "Password123!" },
    { label: "Cashier Seken", email: "cashier-seken@test.app", password: "Password123!" },
];

export default function LoginPage() {
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
                setError(res.error.message ?? "Kredensial tidak valid.");
                setLoading(false);
                return;
            }
            const role = (res.data?.user as any)?.role ?? "admin";
            const dest = role === "baker" ? "/baker"
                : role === "driver" ? "/driver"
                    : role === "owner" ? "/dashboard"
                        : "/order";
            router.push(dest);
            router.refresh();
        } catch {
            setError("Terjadi kesalahan. Silakan coba lagi.");
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
                {/* Custom Header Area - Logo Image */}
                <div className="flex flex-col items-center justify-center text-center">
                    <img
                        src="/logo.png"
                        alt="Dapoer Roema"
                        className="h-24 w-auto object-contain mb-2"
                    />
                    <CardDescription className="text-muted-foreground/80">Sistem manajemen central kitchen</CardDescription>
                </div>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@test.app"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-background/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Kata Sandi</Label>
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
                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sedang masuk…</>
                                : "Masuk"}
                        </Button>
                    </form>

                    {/* Demo section - Compact grid for 7 buttons */}
                    <div className="space-y-3 pt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="bg-white/5" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                                <span className="bg-card px-2 text-muted-foreground">Demo Login</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5">
                            {DEMO_ACCOUNTS.map((acct) => (
                                <Button
                                    key={acct.label}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] px-2 border-muted/50 hover:bg-primary/5 hover:text-primary transition-all"
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
