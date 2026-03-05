import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function OrdersTable({ orders }: { orders: any[] }) {
    if (orders.length === 0) {
        return (
            <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                    No orders found.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Orders</CardTitle>
                <CardDescription>Track the status of your current orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order Date</TableHead>
                                <TableHead>Outlet</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        {format(new Date(order.order_date), "PP p")}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {order.outlet.name}
                                    </TableCell>
                                    <TableCell>
                                        <ul className="list-disc list-inside text-sm">
                                            {order.items.map((item: any) => (
                                                <li key={item.id}>
                                                    {item.quantity}x {item.product.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                                            {order.status}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
