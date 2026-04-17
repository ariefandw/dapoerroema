
"use client";

import { useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Bell, Loader2, SendHorizontal, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { testTelegramConnection, sendTelegramNotification } from "@/app/actions/telegram";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NotificationTestPage() {
    const [loadingTelegram, setLoadingTelegram] = useState(false);
    const [loadingWeb, setLoadingWeb] = useState(false);
    const [testMessage, setTestMessage] = useState("Halo! Ini adalah pesan percobaan dari sistem Dapoer Roema. 🍞");

    async function handleTestTelegram() {
        setLoadingTelegram(true);
        try {
            // Gunakan pesan kustom jika ada
            const res = await testTelegramConnection();
            if (res.success) {
                // Kirim pesan kustom setelah koneksi terverifikasi
                await sendTelegramNotification(`<b>[TEST]</b>\n${testMessage}`);
                toast.success("Pesan kustom Telegram berhasil dikirim!");
            } else {
                toast.error(res.message || "Gagal mengirim pesan tes Telegram");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat mengetes Telegram");
        } finally {
            setLoadingTelegram(false);
        }
    }

    async function handleTestWebNotification() {
        setLoadingWeb(true);
        try {
            if (!("Notification" in window)) {
                toast.error("Browser ini tidak mendukung notifikasi web");
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                new Notification("Dapoer Roema Test", {
                    body: testMessage,
                    icon: "/icon.png"
                });
                toast.success("Notifikasi web berhasil dipicu!");
            } else {
                toast.error("Izin notifikasi ditolak oleh pengguna");
            }
        } catch (error) {
            toast.error("Gagal memicu notifikasi web");
        } finally {
            setLoadingWeb(false);
        }
    }

    return (
        <PageContainer className="max-w-2xl mx-auto space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black tracking-tight uppercase">Test Notifikasi</h1>
                <p className="text-muted-foreground text-sm">Uji coba integrasi bot Telegram dan notifikasi browser.</p>
            </div>

            <Card className="border-border/50 bg-muted/20">
                <CardContent className="pt-6 space-y-3">
                    <Label htmlFor="test-message" className="text-xs font-black uppercase flex items-center gap-2">
                        <MessageSquareText className="h-3.5 w-3.5" />
                        Isi Pesan Percobaan
                    </Label>
                    <Input 
                        id="test-message"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="Masukkan pesan tes..."
                        className="bg-background font-medium"
                    />
                </CardContent>
            </Card>

            <div className="grid gap-6">
                {/* Telegram Test */}
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <SendHorizontal className="h-5 w-5 text-sky-500" />
                            Telegram Bot
                        </CardTitle>
                        <CardDescription>
                            Kirim pesan percobaan ke Chat ID yang terdaftar untuk memastikan Bot Token valid.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            onClick={handleTestTelegram} 
                            disabled={loadingTelegram}
                            className="w-full sm:w-auto font-bold"
                        >
                            {loadingTelegram ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Kirim Pesan Tes Telegram
                        </Button>
                    </CardContent>
                </Card>

                {/* Web Notification Test */}
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bell className="h-5 w-5 text-orange-500" />
                            Web Notification
                        </CardTitle>
                        <CardDescription>
                            Uji apakah browser Anda diizinkan untuk menampilkan notifikasi desktop/PWA.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            variant="outline" 
                            onClick={handleTestWebNotification} 
                            disabled={loadingWeb}
                            className="w-full sm:w-auto font-bold"
                        >
                            {loadingWeb ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                            Picu Notifikasi Web
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
}
