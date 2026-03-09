import { PageContainer } from "@/components/PageContainer";
import { getTelegramSettings } from "@/app/actions/telegram";
import { TelegramConfigForm } from "./TelegramConfigForm";
import { Send, Bot, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function TelegramBotPage() {
    await requireRole(["admin"]);
    const settings = await getTelegramSettings();

    return (
        <PageContainer className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Telegram Bot</h1>
                <p className="text-muted-foreground">Konfigurasi notifikasi order otomatis ke Telegram.</p>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden">
                <div className="p-6 border-b bg-muted/30">
                    <h2 className="text-sm font-semibold">Bot Configuration</h2>
                    <p className="text-sm text-muted-foreground mt-1">Dapatkan notifikasi instan saat status order berubah. Gunakan token dari @BotFather dan pastikan bot sudah masuk ke group tujuan.</p>
                </div>
                <div className="p-6">
                    <TelegramConfigForm initialSettings={settings} />
                </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-4 items-start">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Bot className="h-4 w-4 text-blue-500" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-semibold">Tips: Mencari Chat ID</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Tambahkan bot ke group Anda, kirimkan pesan sembarang, lalu klik tombol "Test Koneksi" di atas.
                        Jika gagal, gunakan bot seperti <code>@userinfobot</code> untuk mendapatkan group ID Anda (biasanya diawali dengan tanda minus, contoh: <code>-100xxxxx</code>).
                    </p>
                </div>
            </div>
        </PageContainer>
    );
}
