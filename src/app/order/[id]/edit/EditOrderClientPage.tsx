"use client";

import { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Package, ArrowLeft, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateOrderItems } from "@/app/actions/order";
import { PageContainer } from "@/components/PageContainer";
import Link from "next/link";
import { useRouter } from "next/navigation";

const formSchema = z.object({
    items: z.array(
        z.object({
            product_id: z.coerce.number().min(1, "Produk harus dipilih"),
            quantity: z.coerce.number().min(1, "Jumlah minimal 1"),
        })
    ).min(1, "Minimal pilih 1 produk"),
});

type FormValues = z.infer<typeof formSchema>;

export function EditOrderClientPage({ order, products, userRole }: any) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            items: order.items.map((item: any) => ({
                product_id: item.product_id,
                quantity: item.quantity,
            })),
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    function onSubmit(data: FormValues) {
        startTransition(async () => {
            const result = await updateOrderItems(order.id, data.items);
            if (result.success) {
                toast.success("Order berhasil diperbarui!");
                router.push(`/order/${order.id}`);
            } else {
                toast.error(result.error || "Gagal memperbarui order");
            }
        });
    }

    return (
        <PageContainer className="max-w-3xl mx-auto space-y-6 pb-20 sm:pb-6">
            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon" className="h-8 w-8 -ml-2 rounded-full">
                    <Link href={`/order/${order.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Edit Order #{order.id}</h1>
            </div>

            <div className="bg-muted/10 border border-border/50 rounded-xl p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-base">Daftar Produk</FormLabel>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ product_id: 0, quantity: 1 })}
                                    className="h-8 shadow-sm"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-3 items-start animate-in slide-in-from-top-2 duration-200">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.product_id`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value ? field.value.toString() : ""}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="bg-background shadow-sm">
                                                                <SelectValue placeholder="Pilih Roti..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {products.map((product: any) => (
                                                                <SelectItem key={product.id} value={product.id.toString()}>
                                                                    {product.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem className="w-[100px]">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            {...field}
                                                            className="bg-background shadow-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                            className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button type="submit" disabled={isPending} className="w-full h-12 font-bold shadow-lg shadow-primary/20">
                            {isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</>
                            )}
                        </Button>
                    </form>
                </Form>
            </div>
        </PageContainer>
    );
}
