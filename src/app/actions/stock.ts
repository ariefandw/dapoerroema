"use server";
import { db } from "@/db";
import { stock, stockTransactions, products, outlets } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface StockLevel {
  id: number;
  product_id: number;
  product_name: string;
  outlet_id: number | null;
  outlet_name: string | null;
  quantity: number;
  min_stock: number;
  is_low_stock: boolean;
}

export interface StockTransaction {
  id: number;
  product_name: string;
  outlet_name: string | null;
  transaction_type: string;
  quantity: number;
  reference_outlet: string | null;
  notes: string | null;
  created_at: Date;
}

// ─── Stock Level Actions ────────────────────────────────────────────────────────

export async function getStockLevels(): Promise<StockLevel[]> {
  const stockQuery = await db
    .select({
      id: stock.id,
      product_id: stock.product_id,
      product_name: products.name,
      outlet_id: stock.outlet_id,
      outlet_name: outlets.name,
      quantity: stock.quantity,
      min_stock: stock.min_stock,
    })
    .from(stock)
    .leftJoin(products, eq(stock.product_id, products.id))
    .leftJoin(outlets, eq(stock.outlet_id, outlets.id))
    .orderBy(sql`CASE WHEN ${stock.outlet_id} IS NULL THEN 0 ELSE ${stock.outlet_id} END`, products.name);

  return stockQuery.map((s) => ({
    id: s.id,
    product_id: s.product_id,
    product_name: s.product_name ?? "Unknown Product",
    outlet_id: s.outlet_id,
    outlet_name: s.outlet_name,
    quantity: s.quantity,
    min_stock: s.min_stock ?? 5,
    is_low_stock: s.quantity < (s.min_stock ?? 5),
  }));
}

export async function getStockById(id: number) {
  const result = await db.select().from(stock).where(eq(stock.id, id)).limit(1);
  return result[0] || null;
}

export async function getStockByProductAndOutlet(productId: number, outletId: number | null) {
  const result = await db
    .select()
    .from(stock)
    .where(
      outletId === null
        ? and(eq(stock.product_id, productId), sql`${stock.outlet_id} IS NULL`)
        : and(eq(stock.product_id, productId), eq(stock.outlet_id, outletId))
    )
    .limit(1);
  return result[0] || null;
}

export async function upsertStock(data: {
  id?: number;
  product_id: number;
  outlet_id: number | null;
  quantity: number;
  min_stock: number;
  notes?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user?.id || null;

  if (data.id) {
    // Update existing stock
    const existing = await getStockById(data.id);
    if (!existing) {
      throw new Error("Stock not found");
    }

    await db
      .update(stock)
      .set({
        quantity: data.quantity,
        min_stock: data.min_stock,
        updated_at: new Date(),
      })
      .where(eq(stock.id, data.id));

    // Create transaction if quantity changed
    if (existing.quantity !== data.quantity) {
      const diff = data.quantity - existing.quantity;
      const transactionType = diff > 0 ? "add" : "deduct";
      await db.insert(stockTransactions).values({
        product_id: data.product_id,
        outlet_id: data.outlet_id,
        transaction_type: transactionType,
        quantity: Math.abs(diff),
        notes: data.notes || `Stock adjustment: ${diff > 0 ? "+" : ""}${diff}`,
        created_by: userId,
      });
    }
  } else {
    // Check if stock entry exists for this product and outlet
    const existing = await getStockByProductAndOutlet(data.product_id, data.outlet_id);

    if (existing) {
      // Update existing
      await db
        .update(stock)
        .set({
          quantity: data.quantity,
          min_stock: data.min_stock,
          updated_at: new Date(),
        })
        .where(eq(stock.id, existing.id));
    } else {
      // Create new stock entry
      await db.insert(stock).values({
        product_id: data.product_id,
        outlet_id: data.outlet_id,
        quantity: data.quantity,
        min_stock: data.min_stock,
      });

      // Create initial transaction if quantity > 0
      if (data.quantity > 0) {
        await db.insert(stockTransactions).values({
          product_id: data.product_id,
          outlet_id: data.outlet_id,
          transaction_type: "add",
          quantity: data.quantity,
          notes: data.notes || "Initial stock",
          created_by: userId,
        });
      }
    }
  }

  revalidatePath("/admin/master/stock");
}

export async function addStock(data: {
  product_id: number;
  outlet_id: number | null;
  quantity: number;
  notes?: string;
}) {
  if (data.quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user?.id || null;

  // Get or create stock entry
  const existing = await getStockByProductAndOutlet(data.product_id, data.outlet_id);

  if (existing) {
    const newQuantity = existing.quantity + data.quantity;
    await db
      .update(stock)
      .set({
        quantity: newQuantity,
        updated_at: new Date(),
      })
      .where(eq(stock.id, existing.id));
  } else {
    await db.insert(stock).values({
      product_id: data.product_id,
      outlet_id: data.outlet_id,
      quantity: data.quantity,
      min_stock: 5,
    });
  }

  // Record transaction
  await db.insert(stockTransactions).values({
    product_id: data.product_id,
    outlet_id: data.outlet_id,
    transaction_type: "add",
    quantity: data.quantity,
    notes: data.notes || "Stock added",
    created_by: userId,
  });

  revalidatePath("/admin/master/stock");
}

export async function deductStock(data: {
  product_id: number;
  outlet_id: number | null;
  quantity: number;
  notes?: string;
}) {
  if (data.quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user?.id || null;

  // Get existing stock
  const existing = await getStockByProductAndOutlet(data.product_id, data.outlet_id);

  if (!existing) {
    throw new Error("No stock entry found for this product and location");
  }

  if (existing.quantity < data.quantity) {
    throw new Error(
      `Insufficient stock. Current: ${existing.quantity}, Requested: ${data.quantity}`
    );
  }

  const newQuantity = existing.quantity - data.quantity;
  await db
    .update(stock)
    .set({
      quantity: newQuantity,
      updated_at: new Date(),
    })
    .where(eq(stock.id, existing.id));

  // Record transaction
  await db.insert(stockTransactions).values({
    product_id: data.product_id,
    outlet_id: data.outlet_id,
    transaction_type: "deduct",
    quantity: data.quantity,
    notes: data.notes || "Stock deducted",
    created_by: userId,
  });

  revalidatePath("/admin/master/stock");
}

export async function transferStock(data: {
  product_id: number;
  from_outlet_id: number | null;
  to_outlet_id: number | null;
  quantity: number;
  notes?: string;
}) {
  if (data.quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  if (data.from_outlet_id === data.to_outlet_id) {
    throw new Error("Cannot transfer to the same location");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user?.id || null;

  // Check source stock
  const sourceStock = await getStockByProductAndOutlet(
    data.product_id,
    data.from_outlet_id
  );

  if (!sourceStock) {
    throw new Error("No stock entry found at source location");
  }

  if (sourceStock.quantity < data.quantity) {
    throw new Error(
      `Insufficient stock at source. Current: ${sourceStock.quantity}, Requested: ${data.quantity}`
    );
  }

  // Deduct from source
  const newSourceQuantity = sourceStock.quantity - data.quantity;
  await db
    .update(stock)
    .set({
      quantity: newSourceQuantity,
      updated_at: new Date(),
    })
    .where(eq(stock.id, sourceStock.id));

  // Add to destination
  const destStock = await getStockByProductAndOutlet(
    data.product_id,
    data.to_outlet_id
  );

  if (destStock) {
    const newDestQuantity = destStock.quantity + data.quantity;
    await db
      .update(stock)
      .set({
        quantity: newDestQuantity,
        updated_at: new Date(),
      })
      .where(eq(stock.id, destStock.id));
  } else {
    await db.insert(stock).values({
      product_id: data.product_id,
      outlet_id: data.to_outlet_id,
      quantity: data.quantity,
      min_stock: 5,
    });
  }

  // Record transactions
  const notes = data.notes || "Stock transfer";

  await db.insert(stockTransactions).values([
    {
      product_id: data.product_id,
      outlet_id: data.from_outlet_id,
      transaction_type: "transfer_out",
      quantity: data.quantity,
      reference_outlet_id: data.to_outlet_id,
      notes: `${notes} (to ${data.to_outlet_id === null ? "Warehouse" : "Outlet #" + data.to_outlet_id})`,
      created_by: userId,
    },
    {
      product_id: data.product_id,
      outlet_id: data.to_outlet_id,
      transaction_type: "transfer_in",
      quantity: data.quantity,
      reference_outlet_id: data.from_outlet_id,
      notes: `${notes} (from ${data.from_outlet_id === null ? "Warehouse" : "Outlet #" + data.from_outlet_id})`,
      created_by: userId,
    },
  ]);

  revalidatePath("/admin/master/stock");
}

export async function getLowStockAlerts(): Promise<StockLevel[]> {
  const allStock = await getStockLevels();
  return allStock.filter((s) => s.is_low_stock);
}

export async function getStockTransactions(
  limit: number = 50
): Promise<StockTransaction[]> {
  const transactions = await db
    .select({
      id: stockTransactions.id,
      product_name: products.name,
      outlet_id: stockTransactions.outlet_id,
      outlet_name: outlets.name,
      transaction_type: stockTransactions.transaction_type,
      quantity: stockTransactions.quantity,
      reference_outlet_id: stockTransactions.reference_outlet_id,
      notes: stockTransactions.notes,
      created_at: stockTransactions.created_at,
    })
    .from(stockTransactions)
    .leftJoin(products, eq(stockTransactions.product_id, products.id))
    .leftJoin(outlets, eq(stockTransactions.outlet_id, outlets.id))
    .orderBy(desc(stockTransactions.created_at))
    .limit(limit);

  return transactions.map((t) => ({
    id: t.id,
    product_name: t.product_name ?? "Unknown Product",
    outlet_name: t.outlet_id === null ? "Central Kitchen" : t.outlet_name,
    transaction_type: t.transaction_type,
    quantity: t.quantity,
    reference_outlet:
      t.reference_outlet_id === null
        ? "Central Kitchen"
        : t.reference_outlet_id?.toString() ?? null,
    notes: t.notes,
    created_at: t.created_at,
  }));
}

export async function getStockTransactionsByProduct(
  productId: number,
  limit: number = 20
): Promise<StockTransaction[]> {
  const transactions = await db
    .select({
      id: stockTransactions.id,
      product_name: products.name,
      outlet_id: stockTransactions.outlet_id,
      outlet_name: outlets.name,
      transaction_type: stockTransactions.transaction_type,
      quantity: stockTransactions.quantity,
      reference_outlet_id: stockTransactions.reference_outlet_id,
      notes: stockTransactions.notes,
      created_at: stockTransactions.created_at,
    })
    .from(stockTransactions)
    .leftJoin(products, eq(stockTransactions.product_id, products.id))
    .leftJoin(outlets, eq(stockTransactions.outlet_id, outlets.id))
    .where(eq(stockTransactions.product_id, productId))
    .orderBy(desc(stockTransactions.created_at))
    .limit(limit);

  return transactions.map((t) => ({
    id: t.id,
    product_name: t.product_name ?? "Unknown Product",
    outlet_name: t.outlet_id === null ? "Central Kitchen" : t.outlet_name,
    transaction_type: t.transaction_type,
    quantity: t.quantity,
    reference_outlet:
      t.reference_outlet_id === null
        ? "Central Kitchen"
        : t.reference_outlet_id?.toString() ?? null,
    notes: t.notes,
    created_at: t.created_at,
  }));
}

// ─── Stock Helper Functions ─────────────────────────────────────────────────────

export interface StockCheckResult {
  product_id: number;
  outlet_id: number | null;
  requested: number;
  available: number;
  is_sufficient: boolean;
}

/**
 * Check if sufficient stock exists for a single product at a location
 */
export async function checkStockAvailability(
  productId: number,
  outletId: number | null,
  quantity: number
): Promise<boolean> {
  const existing = await getStockByProductAndOutlet(productId, outletId);
  if (!existing) {
    return false; // No stock entry means no stock available
  }
  return existing.quantity >= quantity;
}

/**
 * Get current stock quantity for a product at a location
 */
export async function getProductStock(
  productId: number,
  outletId: number | null
): Promise<number> {
  const existing = await getStockByProductAndOutlet(productId, outletId);
  return existing?.quantity ?? 0;
}

/**
 * Batch stock check for multiple items
 * Returns a Map with product_id as key and StockCheckResult as value
 */
export async function checkMultipleStockAvailability(
  items: Array<{ product_id: number; outlet_id: number | null; quantity: number }>
): Promise<Map<number, StockCheckResult>> {
  const results = new Map<number, StockCheckResult>();

  for (const item of items) {
    const available = await getProductStock(item.product_id, item.outlet_id);
    results.set(item.product_id, {
      product_id: item.product_id,
      outlet_id: item.outlet_id,
      requested: item.quantity,
      available,
      is_sufficient: available >= item.quantity,
    });
  }

  return results;
}

/**
 * Check stock availability for all products at all locations
 * Useful for displaying stock warnings in UI
 */
export async function getAllProductStocks(): Promise<
  Map<number, Map<number | null, number>>
> {
  const allStock = await getStockLevels();
  const stockMap = new Map<number, Map<number | null, number>>();

  for (const item of allStock) {
    if (!stockMap.has(item.product_id)) {
      stockMap.set(item.product_id, new Map());
    }
    stockMap.get(item.product_id)!.set(item.outlet_id, item.quantity);
  }

  return stockMap;
}
