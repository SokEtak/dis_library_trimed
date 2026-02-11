"use client"

import {
    ChevronsUpDown,
    LogOut,
    Settings
} from 'lucide-react';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';

// Define the User interface
interface User {
    name: string;
    email: string;
    role_id: number;
    avatar?: string;
}

export function NavUser({ user }: { user: User | null }) {
    const { isMobile } = useSidebar();
    const { post, processing } = useForm();

    const handleLogout = () => {
        post(route('logout'), {
            onFinish: () => window.location.href = '/login',
        });
    };

    // If no user is provided, don't render the component
    if (!user) {
        return null;
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            disabled={processing}
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                {/*local*/}
                                {/*<AvatarImage src={"/storage/"+user.avatar} alt={user.name} />*/}
                                {/*for production*/}
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="rounded-lg">
                                    {user.name.split(" ")[0][0]}
                                    {user.name.split(" ")[1]?.[0] ?? ""}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col flex-1 text-left text-sm">
                                <span className="font-medium">{user.name}</span>
                                <span className="text-xs">{user.email || "NA"}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    {/*for local*/}
                                    {/*<AvatarImage src={"/storage/"+user.avatar} alt={user.name} />*/}
                                    {/*for production*/}
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="rounded-lg">
                                        {user.name.split(" ")[0][0]}
                                        {user.name.split(" ")[1]?.[0] ?? ""}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user.name}</span>
                                    <span className="truncate text-xs">{user.email|| "NA"}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <a href={route('profile.edit')}>
                                    <Settings className="h-4 w-4" />
                                    ការកំណត់
                                </a>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} disabled={processing}>
                            <LogOut className="h-4 w-4 text-red-400 dark:text-red-500" />
                            ចាកចេញ
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
