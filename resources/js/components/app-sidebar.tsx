"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePage } from "@inertiajs/react";
import { globalNav, navGroups } from "@/nav/nav-items";

interface User { name: string; email: string; roles: string[]; avatar?: string; }
interface SharedData { auth: { user: User | null; }; }

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { auth } = usePage<SharedData>().props;

    const sidebarContentRef = useRef<HTMLDivElement>(null);

    const rawRole = auth.user?.roles?.[0] || "Guest";

    const user = auth.user
        ? {
            name: auth.user.name,
            email: auth.user.email,
            role: rawRole,
            avatar: auth.user.avatar ?? "/avatars/default.jpg",
        }
        : null;

    useEffect(() => {
        const content = sidebarContentRef.current;
        if (!content) return;

        const savedScroll = sessionStorage.getItem("app-sidebar-scroll");
        if (savedScroll) content.scrollTop = Number(savedScroll);

        const saveScroll = () =>
            sessionStorage.setItem("app-sidebar-scroll", content.scrollTop.toString());

        document.addEventListener("inertia:start", saveScroll);
        window.addEventListener("beforeunload", saveScroll);

        return () => {
            document.removeEventListener("inertia:start", saveScroll);
            window.removeEventListener("beforeunload", saveScroll);
        };
    }, []);

    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="/" className="flex items-center justify-center px-2 py-1 hover:bg-sidebar-hover rounded-lg">
                                {/* <div className="flex-shrink-0 h-12 w-16 rounded-lg bg-sidebar-primary p-0 flex items-center justify-center"> */}
                                    <img src="/images/DIS2.png" className="h-22 w-36 object-contain mr-2" />
                                {/* </div> */}

                                {/* <div className="flex flex-col">
                                    <span className="font-semibold text-orange-600 dark:text-orange-400 text-sm">
                                        សក
                                    </span>
                                    <span className="font-semibold text-orange-600 dark:text-orange-400 text-sm text-center">
                                         ឌូវី
                                    </span>
                                </div> */}
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent
                ref={sidebarContentRef}
                className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400/40 dark:scrollbar-thumb-gray-600/50"
            >
                <NavMain items={globalNav} label="សង្ខេបរបាយការណ៍" />

                {navGroups.map((group) => (
                    <NavMain key={group.label} items={group.items} label={group.label} />
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
        </Sidebar>
    );
}
