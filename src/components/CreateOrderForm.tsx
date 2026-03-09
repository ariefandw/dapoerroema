"use client";

import { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Package, ShoppingCart, AlertTriangle } from "lucide-react";

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
import { createOrder } from "@/app/actions";
import { toast } from "sonner";
import { type InferSelectModel } from "drizzle-orm";
import { outlets as outletsSchema, products as productsSchema } from "@/db/schema";

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

type Outlet = InferSelectModel<typeof outletsSchema>;
type Product = InferSelectModel<typeof productsSchema>;

interface CreateOrderResult {
    success: boolean;
    error?: string;
    stockIssues?: Array<{ product_id: number; requested: number; available: number }>;
}

export function CreateOrderForm({ outlets, products }: { outlets: Outlet[]; products: Product[] }) {
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
            const result = await createOrder(data) as CreateOrderResult;
            if (result.success) {
                form.reset({
                    outlet_id: 0,
                    items: [{ product_id: 0, quantity: 1 }],
                });
                toast.success("Order berhasil dibuat!");
            } else {
                // Handle stock issues
                if (result.stockIssues && result.stockIssues.length > 0) {
                    const issueMessages = result.stockIssues.map(issue => {
                        const product = products.find(p => p.id === issue.product_id);
                        const productName = product?.name || `Product ${issue.product_id}`;
                        return `- ${productName}: butuh ${issue.requested}, tersedia ${issue.available}`;
                    }).join("\n");
                    toast.error(`Stok tidak mencukupi:\n${issueMessages}`);
                } else {
                    toast.error(result.error || "Gagal membuat order");
                }
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                <FormField
                    control={form.control}
                    name="outlet_id"
                    render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-sm w-fit">
                                Outlet
                            </FormLabel>
                            <Select
                                onValueChange={(val) => field.onChange(Number(val))}
                                value={field.value ? field.value.toString() : ""}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full h-9 bg-muted/10 border-border/40 focus:ring-primary/20 text-xs">
                                        <SelectValue placeholder="Pilih outlet destination" />
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

                <div className="space-y-4">
                    <FormLabel className="font-bold text-xs text-muted-foreground">
                        Item Order
                    </FormLabel>

                    <div className="space-y-2">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-start gap-2 group transition-all">
                                <div className="flex-1 min-w-0">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.product_id`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select
                                                    onValueChange={(val) => field.onChange(Number(val))}
                                                    value={field.value ? field.value.toString() : ""}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="h-9 bg-muted/20 border-border/40 focus:ring-primary/20 text-xs w-full">
                                                            <SelectValue placeholder="Produk" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {products.map((p) => (
                                                            <SelectItem key={p.id} value={p.id.toString()} className="text-xs">
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="w-20 shrink-0">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            {...field}
                                                            className="h-9 bg-muted/20 border-border/40 focus:ring-primary/20 pr-7 text-xs px-2"
                                                            placeholder="Qty"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground uppercase pointer-events-none">pcs</span>
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-md shrink-0"
                                    onClick={() => remove(index)}
                                    disabled={fields.length === 1}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-10 border-dashed border-2 hover:border-primary hover:text-primary transition-all bg-transparent"
                        onClick={() => append({ product_id: 0, quantity: 1 })}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Item Lain
                    </Button>
                </div>

                <div>
                    <Button type="submit" disabled={isPending} className="w-full text-base font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4 animate-spin" />
                                Memproses...
                            </div>
                        ) : "Buat Order Sekarang"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
