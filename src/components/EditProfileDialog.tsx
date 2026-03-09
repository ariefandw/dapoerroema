"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Loader2, Mail, Shield } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AvatarUpload } from "@/components/AvatarUpload";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions";

const formSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    image: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        image?: string | null;
    };
    onProfileUpdated?: () => void;
}

export function EditProfileDialog({
    open,
    onOpenChange,
    user,
    onProfileUpdated,
}: EditProfileDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [currentImage, setCurrentImage] = useState<string | null | undefined>(user.image);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: user.name,
            image: user.image ?? null,
        },
    });

    // Reset form when dialog opens with new user data
    function handleOpenChange(newOpen: boolean) {
        if (!newOpen) {
            // Reset to original values when closing without saving
            form.reset({ name: user.name, image: user.image ?? null });
            setCurrentImage(user.image);
        }
        onOpenChange(newOpen);
    }

    function onSubmit(values: FormValues) {
        startTransition(async () => {
            const result = await updateProfile({
                id: user.id,
                name: values.name,
                image: currentImage ?? null,
            });

            if (result.success) {
                toast.success("Profile berhasil diperbarui");
                onOpenChange(false);
                onProfileUpdated?.();
            } else {
                toast.error(result.error || "Gagal memperbarui profile");
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Edit Profile
                    </DialogTitle>
                    <DialogDescription>
                        Ubah nama dan foto profile Anda.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        {/* Avatar Upload */}
                        <div className="flex justify-center sm:justify-start">
                            <AvatarUpload
                                currentImage={currentImage}
                                onImageChange={setCurrentImage}
                                userName={user.name}
                            />
                        </div>

                        {/* Name Field */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 text-muted-foreground" /> Nama Lengkap
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: Ariefan Nugraha" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Email (Read-only) */}
                        <FormItem>
                            <FormLabel className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
                            </FormLabel>
                            <FormControl>
                                <Input value={user.email} disabled className="bg-muted" />
                            </FormControl>
                            <p className="text-sm text-muted-foreground">
                                Email tidak dapat diubah
                            </p>
                        </FormItem>

                        {/* Role (Read-only) */}
                        <FormItem>
                            <FormLabel className="flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-muted-foreground" /> Peran
                            </FormLabel>
                            <FormControl>
                                <Input
                                    value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    disabled
                                    className="bg-muted"
                                />
                            </FormControl>
                            <p className="text-sm text-muted-foreground">
                                Hubungi admin untuk mengubah peran
                            </p>
                        </FormItem>

                        <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isPending}
                                className="w-full sm:w-auto"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full sm:w-auto font-bold"
                            >
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
