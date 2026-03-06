import { getUsers, getOutlets } from "@/app/actions";
import { PageContainer } from "@/components/PageContainer";
import { UserList } from "./UserList";

export default async function UsersPage() {
    const users = await getUsers();
    const outlets = await getOutlets();

    return (
        <PageContainer>
            <div className="max-w-7xl mx-auto py-6">
                <UserList users={users} outlets={outlets} />
            </div>
        </PageContainer>
    );
}

