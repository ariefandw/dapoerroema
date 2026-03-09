"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Send, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { updateTelegramSettings, testTelegramConnection } from "@/app/actions/telegram";
import { toast } from "sonner";

interface TelegramConfigFormProps {
    initialSettings: {
        token: string;
        chatId: string;
        enabled: boolean;
    };
}

export function TelegramConfigForm({ initialSettings }: TelegramConfigFormProps) {
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [token, setToken] = useState(initialSettings.token || "8689997099:AAGrHHDsGf7gZ79mYUQN_PSVM5_DsFGxoIY"); // Default provided
    const [chatId, setChatId] = useState(initialSettings.chatId);
    const [enabled, setEnabled] = useState(initialSettings.enabled);

    async function handleSave() {
        setLoading(true);
        try {
            await updateTelegramSettings({ token, chatId, enabled });
            toast.success("Konfigurasi Telegram berhasil disimpan");
        } catch (error) {
            toast.error("Gagal menyimpan konfigurasi");
        } finally {
            setLoading(false);
        }
    }

    async function handleTest() {
        setTesting(true);
        try {
            const result = await testTelegramConnection();
            if (result.success) {
                toast.success("Pesan test berhasil dikirim!");
            } else {
                toast.error(result.message || "Gagal mengirim pesan test.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat mencoba koneksi.");
        } finally {
            setTesting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                <div className="space-y-1">
                    <Label htmlFor="enabled" className="text-base font-semibold cursor-pointer">
                        Aktifkan Notifikasi
                    </Label>
                    <p className="text-xs text-muted-foreground">Kirim notifikasi otomatis saat status order berubah.</p>
                </div>
                <Switch
                    id="enabled"
                    checked={enabled}
                    onCheckedChange={setEnabled}
                />
            </div>

            <div className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="token" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Bot Token API</Label>
                    <Input
                        id="token"
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Contoh: 123456789:ABCDefgh..."
                        className="bg-muted/10 border-border/60"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="chatId" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Telegram Chat ID</Label>
                    <div className="flex gap-2">
                        <Input
                            id="chatId"
                            value={chatId}
                            onChange={(e) => setChatId(e.target.value)}
                            placeholder="Contoh: -100xxxxxx atau @channel"
                            className="bg-muted/10 border-border/60 flex-1"
                        />
                        <Button
                            variant="secondary"
                            disabled={testing || !token || !chatId}
                            onClick={handleTest}
                            className="shrink-0"
                        >
                            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span className="ml-2 hidden sm:inline">Test Koneksi</span>
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground italic">Pastikan bot sudah dalam group dan memiliki izin kirim pesan.</p>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} disabled={loading} className="px-8 shadow-lg shadow-primary/20">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Simpan Konfigurasi
                </Button>
            </div>
        </div>
    );
}
