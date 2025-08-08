import React from "react";
import { Link, NavLink, useLoaderData, useNavigate } from "react-router-dom";
import { sidebarItems } from "~/constants";
import { cn } from "~/lib/utils";
import { logoutUser } from "~/appwrite/auth";

// ✅ Define type here (or import from a shared types file)
type SidebarItem = {
    id: string | number;
    href: string;
    icon: string;
    label: string;
};

const NavItems = ({ handleClick }: { handleClick?: () => void }) => {
    const user = useLoaderData() as {
        name?: string;
        email?: string;
        imageUrl?: string;
    };

    const navigate = useNavigate();

    const handleLogout = async () => {
        await logoutUser();
        navigate("/sign-in");
    };

    return (
        <section className="nav-items">
            <Link to="/" className="link-logo">
                <img src="/assets/icons/logo.svg" alt="logo" className="size-[30px]" />
                <h1>TripTide</h1>
            </Link>

            <div className="container">
                <nav>
                    {sidebarItems.map(({ id, href, icon, label }: SidebarItem) => (
                        <NavLink to={href} key={id}>
                            {({ isActive }: { isActive: boolean }) => (
                                <div
                                    className={cn("group nav-item", {
                                        "bg-primary-100 !text-white": isActive,
                                    })}
                                    onClick={handleClick}
                                >
                                    <img
                                        src={icon}
                                        alt={label}
                                        className={cn(
                                            "group-hover:brightness-0 group-hover:invert size-5",
                                            isActive ? "brightness-0 invert" : "text-dark-200"
                                        )}
                                    />
                                    {label}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <footer className="nav-footer">
                    <img
                        src={user?.imageUrl || "/assets/images/david.webp"}
                        alt={user?.name || "David"}
                        referrerPolicy="no-referrer"
                    />

                    <article>
                        <h2>{user?.name}</h2>
                        <p>{user?.email}</p>
                    </article>

                    <button onClick={handleLogout} className="cursor-pointer">
                        <img
                            src="/assets/icons/logout.svg"
                            alt="logout"
                            className="size-6"
                        />
                    </button>
                </footer>
            </div>
        </section>
    );
};

export default NavItems;
