import { requireRole } from "@/lib/auth-guard";
import { PageContainer } from "@/components/PageContainer";
import { ReceivingContent } from "./ReceivingContent";
import { getProducts } from "@/app/actions";
import { getReceivingHistory } from "@/app/actions/receiving";

export default async function ReceivingPage() {
    await requireRole(["admin"]);

    const products = await getProducts();
    const history = await getReceivingHistory(20);

    return (
        <PageContainer>
            <ReceivingContent products={products} initialHistory={history} />
        </PageContainer>
    );
}
