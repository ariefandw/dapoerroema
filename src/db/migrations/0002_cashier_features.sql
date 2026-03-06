ALTER TABLE "products" ADD COLUMN "image_url" text;-->statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" text;-->statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_type" text;-->statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_amount" integer DEFAULT 0;-->statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "subtotal" integer;-->statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "total_amount" integer;
