ALTER TABLE "orders" ADD COLUMN "runner_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shelf_life" integer;--> statement-breakpoint
ALTER TABLE "stock" ADD COLUMN "stock_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_runner_id_user_id_fk" FOREIGN KEY ("runner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");