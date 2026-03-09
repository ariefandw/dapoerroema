CREATE TABLE "runner_trail" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"order_id" integer,
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "runner_trail" ADD CONSTRAINT "runner_trail_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runner_trail" ADD CONSTRAINT "runner_trail_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;