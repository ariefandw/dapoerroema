"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTelegramSettings() {
    const allSettings = await db.select().from(settings);
    const config: Record<string, string> = {};
    allSettings.forEach((s) => {
        config[s.key] = s.value;
    });

    return {
        token: config["telegram_bot_token"] || "",
        chatId: config["telegram_chat_id"] || "",
        enabled: config["telegram_notifications_enabled"] === "true",
    };
}

export async function updateTelegramSettings(data: {
    token: string;
    chatId: string;
    enabled: boolean;
}) {
    const items = [
        { key: "telegram_bot_token", value: data.token },
        { key: "telegram_chat_id", value: data.chatId },
        { key: "telegram_notifications_enabled", value: data.enabled ? "true" : "false" },
    ];

    for (const item of items) {
        await db
            .insert(settings)
            .values(item)
            .onConflictDoUpdate({
                target: settings.key,
                set: { value: item.value, updated_at: new Date() },
            });
    }

    revalidatePath("/admin/master/telegram");
    return { success: true };
}

export async function sendTelegramNotification(message: string) {
    const config = await getTelegramSettings();
    if (!config.enabled || !config.token || !config.chatId) return;

    try {
        const url = `https://api.telegram.org/bot${config.token}/sendMessage`;
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: config.chatId,
                text: message,
                parse_mode: "HTML",
            }),
        });
    } catch (error) {
        console.error("Failed to send Telegram notification:", error);
    }
}

export async function testTelegramConnection() {
    const config = await getTelegramSettings();
    if (!config.token || !config.chatId) {
        return { success: false, message: "Token dan Chat ID harus diisi." };
    }

    try {
        const url = `https://api.telegram.org/bot${config.token}/sendMessage`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: config.chatId,
                text: "<b>🔄 Test Koneksi Berhasil!</b>\nTelegram Bot Dapoer Roema siap mengirim notifikasi.",
                parse_mode: "HTML",
            }),
        });

        if (res.ok) {
            return { success: true };
        } else {
            const data = await res.json();
            return { success: false, message: data.description || "Gagal mengirim pesan." };
        }
    } catch (error: any) {
        return { success: false, message: error.message || "Gagal menghubungi API Telegram." };
    }
}
