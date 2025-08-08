import { Outlet, redirect } from "react-router-dom";
import { SidebarComponent } from "@syncfusion/ej2-react-navigations";
import { MobileSidebar, NavItems } from "components";
import { account } from "~/appwrite/client";
import { getExistingUser, storeUserData } from "~/lib/users";


export async function clientLoader() {
    try {
        const user = await account.get();

        if (!user?.$id) return redirect("/sign-in");

        const existingUser = await getExistingUser(user.$id);

        if (existingUser?.status === "user") {
            return redirect("/");
        }

        return existingUser?.$id ? existingUser : await storeUserData();
    } catch (e) {
        console.error("Error in clientLoader:", e);
        return redirect("/sign-in");
    }
}

const AdminLayout = () => {
    return (
        <div className="admin-layout flex min-h-screen">
            <MobileSidebar />

            <aside className="hidden lg:block w-[270px]">
                <SidebarComponent width="270px" enableGestures={false}>
                    <NavItems />
                </SidebarComponent>
            </aside>

            <main className="flex-1 p-4">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
