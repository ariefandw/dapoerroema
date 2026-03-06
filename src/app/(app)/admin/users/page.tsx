import { getUsers, getOutlets } from "@/app/actions";
import { PageContainer } from "@/components/PageContainer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users as UsersIcon, Shield, Store, Mail } from "lucide-react";
import { UserRow } from "./UserRow";

export default async function UsersPage() {
    const users = await getUsers();
    const outlets = await getOutlets();

    return (
        <PageContainer>
            <div className="space-y-6 max-w-7xl mx-auto py-6">
                <div className="px-4 md:px-0">
                    <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2 text-primary">
                        <UsersIcon className="h-6 w-6" />
                        Manajemen User
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Kelola peran pengguna dan akses outlet mereka. Perubahan akan segera diterapkan.
                    </p>
                </div>

                <Card className="border-border/50 overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg">Daftar Pengguna</CardTitle>
                        <CardDescription>Semua pengguna yang terdaftar di Orbery.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop View */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                                        <TableHead>Nama & Email</TableHead>
                                        <TableHead className="w-[180px]">
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-3.5 w-3.5 text-muted-foreground" /> Peran
                                            </div>
                                        </TableHead>
                                        <TableHead className="w-[240px]">
                                            <div className="flex items-center gap-2">
                                                <Store className="h-3.5 w-3.5 text-muted-foreground" /> Outlet Aktif
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <UserRow key={user.id} user={user} outlets={outlets} view="desktop" />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden divide-y divide-border/50">
                            {users.map((user) => (
                                <UserRow key={user.id} user={user} outlets={outlets} view="mobile" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
}

