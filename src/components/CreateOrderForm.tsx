"use client";

import { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createOrder } from "@/app/actions";

const formSchema = z.object({
    outlet_id: z.coerce.number().min(1, { message: "Silakan pilih outlet" }),
    items: z
        .array(
            z.object({
                product_id: z.coerce.number().min(1, { message: "Wajib diisi" }),
                quantity: z.coerce.number().min(1, { message: "Minimal 1" }),
            })
        )
        .min(1, { message: "Tambahkan minimal satu produk ke order" }),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateOrderForm({ outlets, products }: { outlets: any[]; products: any[] }) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            outlet_id: 0,
            items: [{ product_id: 0, quantity: 1 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    function onSubmit(data: FormValues) {
        startTransition(async () => {
            const result = await createOrder(data);
            if (result.success) {
                form.reset({
                    outlet_id: 0,
                    items: [{ product_id: 0, quantity: 1 }],
                });
                alert("Pesanan berhasil dibuat!");
            } else {
                alert("Gagal membuat order");
            }
        });
    }

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>Penerimaan Pesanan Baru</CardTitle>
                <CardDescription>Masukkan order baru untuk outlet secara manual.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="outlet_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Outlet</FormLabel>
                                    <Select
                                        onValueChange={(val) => field.onChange(Number(val))}
                                        value={field.value ? field.value.toString() : ""}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih outlet" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {outlets.map((outlet) => (
                                                <SelectItem key={outlet.id} value={outlet.id.toString()}>
                                                    {outlet.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <FormLabel>Item Pesanan</FormLabel>
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-4 items-end">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.product_id`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <Select
                                                    onValueChange={(val) => field.onChange(Number(val))}
                                                    value={field.value ? field.value.toString() : ""}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Pilih produk" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {products.map((p) => (
                                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem className="w-24">
                                                <FormControl>
                                                    <Input type="number" min={1} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 w-full"
                                onClick={() => append({ product_id: 0, quantity: 1 })}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Item Lain
                            </Button>
                        </div>

                        <Button type="submit" disabled={isPending} className="w-full">
                            {isPending ? "Mengirim..." : "Buat Pesanan"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
