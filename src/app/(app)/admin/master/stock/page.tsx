import { db } from "@/db";
import { products, outlets } from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { StockClientPage } from "./StockClientPage";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const session = await requireRole(["admin", "user"]);
  const userRole = (session?.user as any)?.role || "user";
  const currentOutletId = (session?.user as any)?.currentOutletId || null;

  const allProducts = await db.select().from(products).orderBy(products.category, products.name);
  const allOutlets = await db.select().from(outlets).orderBy(outlets.name);

  // Fetch initial stock data, filtered by selected outlet for all roles
  // Pass null when no specific outlet is selected (for non-admin, this will fetch nothing)
  const { getStockLevels } = await import("@/app/actions/stock");
  
  // Admin with currentOutletId === null means "All Outlets" (undefined in action)
  const filterId = userRole === "admin" 
    ? (currentOutletId === null ? undefined : currentOutletId) 
    : (currentOutletId || -1); // Strict for non-admin
    
  const initialStock = await getStockLevels(filterId);

  return (
    <StockClientPage
      initialStock={initialStock}
      products={allProducts}
      outlets={allOutlets}
      userRole={userRole}
      currentOutletId={currentOutletId}
    />
  );
}
