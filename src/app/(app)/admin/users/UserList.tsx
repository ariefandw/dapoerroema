"use client";

import { useState } from "react";
import { Users as UsersIcon, Shield, Store, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRow } from "./UserRow";
import { CreateUserDialog } from "./CreateUserDialog";

interface UserListProps {
    users: any[];
    outlets: any[];
}

export function UserList({ users, outlets }: UserListProps) {
    const [showInactive, setShowInactive] = useState(false);

    const activeUsers = users.filter(u => !u.banned);
    const inactiveUsers = users.filter(u => u.banned);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 md:px-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1 flex items-center gap-2 text-primary">
                        <UsersIcon className="h-6 w-6" />
                        Manajemen User
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Kelola peran pengguna dan akses outlet mereka. Perubahan akan segera diterapkan.
                    </p>
                </div>
                <CreateUserDialog outlets={outlets} />
            </div>

            {/* Active Users Table */}
            <Card className="border-border/50 overflow-hidden shadow-sm">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        User Aktif
                    </CardTitle>
                    <CardDescription>Daftar pengguna yang memiliki akses ke sistem.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20 hover:bg-muted/20">
                                    <TableHead>Nama & Email</TableHead>
                                    <TableHead className="w-[180px]">Peran</TableHead>
                                    <TableHead className="w-[240px]">Outlet Aktif</TableHead>
                                    <TableHead className="w-[100px] text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeUsers.map((user) => (
                                    <UserRow key={user.id} user={user} outlets={outlets} view="desktop" />
                                ))}
                                {activeUsers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Tidak ada user aktif ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="md:hidden divide-y divide-border/50">
                        {activeUsers.map((user) => (
                            <UserRow key={user.id} user={user} outlets={outlets} view="mobile" />
                        ))}
                        {activeUsers.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                Tidak ada user aktif ditemukan.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Inactive Users Section */}
            <div className="space-y-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInactive(!showInactive)}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 px-4"
                >
                    {showInactive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showInactive ? "Sembunyikan user tidak aktif" : "Lihat user tidak aktif"}
                    <span className="bg-muted px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {inactiveUsers.length}
                    </span>
                </Button>

                {showInactive && (
                    <Card className="border-border/50 overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <CardHeader className="bg-muted/30 border-b pb-4">
                            <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                                <UsersIcon className="h-4 w-4" />
                                User Tidak Aktif
                            </CardTitle>
                            <CardDescription>Akun yang telah dinonaktifkan dan tidak dapat masuk.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/10">
                                            <TableHead className="text-muted-foreground">Nama & Email</TableHead>
                                            <TableHead className="w-[180px] text-muted-foreground">Peran</TableHead>
                                            <TableHead className="w-[240px] text-muted-foreground">Outlet Terakhir</TableHead>
                                            <TableHead className="w-[100px] text-right text-muted-foreground">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {inactiveUsers.map((user) => (
                                            <UserRow key={user.id} user={user} outlets={outlets} view="desktop" />
                                        ))}
                                        {inactiveUsers.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic text-sm">
                                                    Tidak ada user nonaktif.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="md:hidden divide-y divide-border/30 opacity-70">
                                {inactiveUsers.map((user) => (
                                    <UserRow key={user.id} user={user} outlets={outlets} view="mobile" />
                                ))}
                                {inactiveUsers.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground italic text-sm">
                                        Tidak ada user nonaktif.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
