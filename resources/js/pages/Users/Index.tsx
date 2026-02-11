"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Link, useForm } from "@inertiajs/react";
import {
    EyeIcon,
    PencilIcon,
    MoreHorizontal,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    CheckCircleIcon,
    XCircleIcon,
    Filter,
    CheckIcon,
    CircleCheck,
    CircleX,
} from 'lucide-react';
import {
    ColumnDef,
    Row,
} from "@tanstack/react-table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import DataTable from '@/components/DataTable';
import translations from '@/utils/translations/user/translations';

interface Campus {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
    avatar: string;
    campus: Campus | null;
    roles: string[];
    permissions: string[];
    isVerified: number;
    isActive: number;
}

interface UsersProps {
    users?: User[] | null;
    campuses?: Campus[] | null;
    roles?: string[] | null;
    permissions?: string[] | null;
    flash?: {
        message?: string | null;
        type?: "success" | "error";
    };
    lang?: "kh" | "en";
}

const commonStyles = {
    button: "rounded-lg text-sm transition-colors",
    text: "text-gray-800 dark:text-gray-100 text-sm",
    indigoButton: "bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700",
    outlineButton: "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-800",
    gradientBg: "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-indigo-900",
    tooltipBg: "bg-gradient-to-br from-blue-900 to-indigo-600 text-white rounded-xl",
};

const getColumns = (
    t: typeof translations.kh,
    processing: boolean,
    setUserToDelete: React.Dispatch<React.SetStateAction<User | null>>,
    setRowModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setSelectedRow: React.Dispatch<React.SetStateAction<User | null>>,
    setDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
    campuses: Campus[] | null,
    roles: string[] | null,
    permissions: string[] | null
): ColumnDef<User>[] => [
    {
        id: "actions",
        enableHiding: false,
        enableGlobalFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
            const user = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className={`${commonStyles.button} h-8 w-8 p-0 text-indigo-600 dark:text-indigo-300`}
                            disabled={processing}
                            aria-label={`Open menu for user ${user.id}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="center"
                        className={`${commonStyles.gradientBg} w-auto min-w-0 dark:border-indigo-600 rounded-xl p-1`}
                    >
                        <div className="flex flex-col items-center gap-1 px-1 py-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={route("users.show", user.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Button variant="ghost" className="h-4 w-4 p-0">
                                                    <EyeIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                                </Button>
                                            </Link>
                                        </DropdownMenuItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" align="center" className={commonStyles.tooltipBg}>
                                        {t.viewTooltip}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={route("users.edit", user.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    className="h-4 w-4 p-0"
                                                    disabled={processing}
                                                >
                                                    <PencilIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                                </Button>
                                            </Link>
                                        </DropdownMenuItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" align="center" className={commonStyles.tooltipBg}>
                                        {t.editTooltip}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
    {
        accessorKey: "id",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
            >
                {translations.kh.id}
                {{
                    asc: <ArrowUp className="ml-2 h-4 w-4" />,
                    desc: <ArrowDown className="ml-2 h-4 w-4" />,
                }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
        ),
        cell: ({ row }) => (
            <button
                className={`${commonStyles.text} px-5 cursor-pointer`}
                onClick={() => {
                    setRowModalOpen(true);
                    setSelectedRow(row.original);
                }}
                role="button"
                aria-label={`View details for user ${row.getValue("id")}`}
            >
                {row.getValue("id")}
            </button>
        ),
        filterFn: (row, id, value) => String(row.getValue(id)).includes(String(value)),
    },
    {
        accessorKey: "avatar",
        header: () => <span className={`${commonStyles.text} text-indigo-600 dark:text-indigo-300`}>{translations.kh.avatar}</span>,
        cell: ({ row }) => {
            const avatar = row.getValue("avatar") as string;
            return (
                <button
                    className={`${commonStyles.text} px-0 cursor-pointer`}
                    onClick={() => {
                        setRowModalOpen(true);
                        setSelectedRow(row.original);
                    }}
                    role="button"
                    aria-label={`View details for user with avatar`}
                >
                    <img src={avatar} alt="User avatar" className="h-12 w-12 rounded-full" />
                </button>
            );
        },
        enableSorting: false,
        enableColumnFilter: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
            >
                {translations.kh.name}
                {{
                    asc: <ArrowUp className="ml-2 h-4 w-4" />,
                    desc: <ArrowDown className="ml-2 h-4 w-4" />,
                }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
        ),
        cell: ({ row }) => (
            <button
                className={`${commonStyles.text} px-5 cursor-pointer`}
                onClick={() => {
                    setRowModalOpen(true);
                    setSelectedRow(row.original);
                }}
                role="button"
                aria-label={`View details for user ${row.getValue("name")}`}
            >
                {row.getValue("name") || t.none}
            </button>
        ),
        filterFn: (row, id, value) =>
            String(row.getValue(id) || t.none).toLowerCase().includes(String(value).toLowerCase()),
    },
    {
        accessorKey: "email",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
            >
                {translations.kh.email}
                {{
                    asc: <ArrowUp className="ml-2 h-4 w-4" />,
                    desc: <ArrowDown className="ml-2 h-4 w-4" />,
                }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
        ),
        cell: ({ row }) => (
            <button
                className={`${commonStyles.text} px-0 cursor-pointer`}
                onClick={() => {
                    setRowModalOpen(true);
                    setSelectedRow(row.original);
                }}
                role="button"
                aria-label={`View details for user with email ${row.getValue("email")}`}
            >
                {row.getValue("email") || t.none}
            </button>
        ),
        filterFn: (row, id, value) =>
            String(row.getValue(id) || t.none).toLowerCase().includes(String(value).toLowerCase()),
    },
    // {
    //     accessorKey: "campus",
    //     header: ({ column }) => {
    //         const campusOptions = [
    //             { value: "all", label: t.campusAll, icon: null },
    //             ...(campuses?.map(campus => ({
    //                 value: String(campus.id), // Ensure ID is a string
    //                 label: campus.name,
    //                 icon: null,
    //             })) || []),
    //         ];
    //         return (
    //             <div className="flex items-center gap-2">
    //                 <Button
    //                     variant="ghost"
    //                     onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //                     className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
    //                 >
    //                     {translations.kh.campus}
    //                     {{
    //                         asc: <ArrowUp className="ml-2 h-4 w-4" />,
    //                         desc: <ArrowDown className="ml-2 h-4 w-4" />,
    //                     }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
    //                 </Button>
    //                 <Popover>
    //                     <PopoverContent className={`${commonStyles.gradientBg} w-48 p-0`} align="start" sideOffset={2}>
    //                         <Command>
    //                             <CommandInput placeholder={t.selectCampus} />
    //                             <CommandList>
    //                                 <CommandEmpty>{t.noCampus}</CommandEmpty>
    //                                 <CommandGroup>
    //                                     {campusOptions.map((option) => (
    //                                         <CommandItem
    //                                             key={option.value}
    //                                             value={option.value}
    //                                             onSelect={() => {
    //                                                 column.setFilterValue(option.value === "all" ? undefined : option.value);
    //                                             }}
    //                                             className="flex items-center gap-2"
    //                                         >
    //                                             {option.label}
    //                                             {option.value === (column.getFilterValue() || "all") && (
    //                                                 <CheckIcon className="ml-auto h-4 w-4 text-indigo-600 dark:text-indigo-300" />
    //                                             )}
    //                                         </CommandItem>
    //                                     ))}
    //                                 </CommandGroup>
    //                             </CommandList>
    //                         </Command>
    //                     </PopoverContent>
    //                 </Popover>
    //             </div>
    //         );
    //     },
    //     cell: ({ row }) => {
    //         const campus = row.original.campus;
    //         return (
    //             <button
    //                 className={`${commonStyles.text} px-3 cursor-pointer`}
    //                 onClick={() => {
    //                     setRowModalOpen(true);
    //                     setSelectedRow(row.original);
    //                 }}
    //                 role="button"
    //                 aria-label={
    //                     campus
    //                         ? `View details for user with campus ${campus.name}`
    //                         : `View details for user with no campus`
    //                 }
    //             >
    //                 {campus ? campus.name : t.none}
    //             </button>
    //         );
    //     },
    //     filterFn: (row, _id, value) => {
    //         if (!value || value === "all") return true; // Allow all rows if no filter or "all" is selected
    //         const campusId = row.original.campus?.id;
    //         // Handle cases where campus is null or undefined
    //         return campusId ? String(campusId) === String(value) : false;
    //     },
    //     sortingFn: (rowA, rowB) =>
    //         (rowA.original.campus?.name || t.none).localeCompare(rowB.original.campus?.name || t.none),
    //     enableSorting: true, // Explicitly enable sorting
    // },
    {
        accessorKey: "roles",
        header: ({ column }) => {
            const roleOptions = [
                ...(roles?.map(role => ({
                    value: role,
                    label: role,
                })) || []),
            ];
            const selectedRoles = (column.getFilterValue() as string[] | undefined) || [];
            return (
                <Popover>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300 flex items-center gap-2`}
                                        aria-label={`Filter by roles, currently ${selectedRoles.length ? selectedRoles.join(", ") : t.campusAll}`}
                                    >
                                        {translations.kh.roles}
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent className={commonStyles.tooltipBg}>
                                {t.filterRoles}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <PopoverContent className={`${commonStyles.gradientBg} w-48 p-0`} align="start" sideOffset={2}>
                        <Command>
                            <CommandInput placeholder={t.selectRoles} />
                            <CommandList>
                                <CommandEmpty>{t.noRoles}</CommandEmpty>
                                <CommandGroup>
                                    {roleOptions.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.value}
                                            onSelect={() => {
                                                const current = (column.getFilterValue() as string[] | undefined) || [];
                                                const newValue = current.includes(option.value)
                                                    ? current.filter(v => v !== option.value)
                                                    : [...current, option.value];
                                                column.setFilterValue(newValue.length ? newValue : undefined);
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <div
                                                className={`h-4 w-4 border rounded-sm flex items-center justify-center ${
                                                    selectedRoles.includes(option.value)
                                                        ? "bg-indigo-600 border-indigo-600"
                                                        : "border-gray-300"
                                                }`}
                                            >
                                                {selectedRoles.includes(option.value) && (
                                                    <CheckIcon className="h-3 w-3 text-white" />
                                                )}
                                            </div>
                                            {option.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            );
        },
        cell: ({ row }) => {
            const roles = row.getValue("roles") as string[];
            return (
                <button
                    className={`${commonStyles.text} px-4 cursor-pointer`}
                    onClick={() => {
                        setRowModalOpen(true);
                        setSelectedRow(row.original);
                    }}
                    role="button"
                    aria-label={`View details for user with roles ${roles.join(", ") || t.none}`}
                >
                    {roles.join(", ") || t.none}
                </button>
            );
        },
        filterFn: (row, id, value: string[] | undefined) => {
            if (!value || value.length === 0) return true;
            const userRoles = row.getValue(id) as string[];
            return value.some(v => userRoles.includes(v));
        },
        sortingFn: (rowA, rowB) =>
            (rowA.getValue("roles") as string[]).join(", ").localeCompare((rowB.getValue("roles") as string[]).join(", ")),
    },
    // {
    //     accessorKey: "permissions",
    //     header: ({ column }) => {
    //         const permissionOptions = [
    //             ...(permissions?.map(perm => ({
    //                 value: perm,
    //                 label: perm,
    //             })) || []),
    //         ];
    //         const selectedPermissions = (column.getFilterValue() as string[] | undefined) || [];
    //         return (
    //             <Popover>
    //                 <TooltipProvider>
    //                     <Tooltip>
    //                         <TooltipTrigger asChild>
    //                             <PopoverTrigger asChild>
    //                                 <Button
    //                                     variant="ghost"
    //                                     className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300 flex items-center gap-2`}
    //                                     aria-label={`Filter by permissions, currently ${selectedPermissions.length ? selectedPermissions.join(", ") : t.campusAll}`}
    //                                 >
    //                                     {translations.kh.permissions}
    //                                     <Filter className="h-4 w-4" />
    //                                 </Button>
    //                             </PopoverTrigger>
    //                         </TooltipTrigger>
    //                         <TooltipContent className={commonStyles.tooltipBg}>
    //                             {t.filterPermissions}
    //                         </TooltipContent>
    //                     </Tooltip>
    //                 </TooltipProvider>
    //                 <PopoverContent className={`${commonStyles.gradientBg} w-48 p-0`} align="start" sideOffset={2}>
    //                     <Command>
    //                         <CommandInput placeholder={t.selectPermissions} />
    //                         <CommandList>
    //                             <CommandEmpty>{t.noPermissions}</CommandEmpty>
    //                             <CommandGroup>
    //                                 {permissionOptions.map((option) => (
    //                                     <CommandItem
    //                                         key={option.value}
    //                                         value={option.value}
    //                                         onSelect={() => {
    //                                             const current = (column.getFilterValue() as string[] | undefined) || [];
    //                                             const newValue = current.includes(option.value)
    //                                                 ? current.filter(v => v !== option.value)
    //                                                 : [...current, option.value];
    //                                             column.setFilterValue(newValue.length ? newValue : undefined);
    //                                         }}
    //                                         className="flex items-center gap-2"
    //                                     >
    //                                         <div
    //                                             className={`h-4 w-4 border rounded-sm flex items-center justify-center ${
    //                                                 selectedPermissions.includes(option.value)
    //                                                     ? "bg-indigo-600 border-indigo-600"
    //                                                     : "border-gray-300"
    //                                             }`}
    //                                         >
    //                                             {selectedPermissions.includes(option.value) && (
    //                                                 <CheckIcon className="h-3 w-3 text-white" />
    //                                             )}
    //                                         </div>
    //                                         {option.label}
    //                                     </CommandItem>
    //                                 ))}
    //                             </CommandGroup>
    //                         </CommandList>
    //                     </Command>
    //                 </PopoverContent>
    //             </Popover>
    //         );
    //     },
    //     cell: ({ row }) => {
    //         const permissions = row.getValue("permissions") as string[];
    //         return (
    //             <button
    //                 className={`${commonStyles.text} px-0 cursor-pointer`}
    //                 onClick={() => {
    //                     setRowModalOpen(true);
    //                     setSelectedRow(row.original);
    //                 }}
    //                 role="button"
    //                 aria-label={`View details for user with permissions ${permissions.join(", ") || t.none}`}
    //             >
    //                 {permissions.join(", ") || t.none}
    //             </button>
    //         );
    //     },
    //     filterFn: (row, id, value: string[] | undefined) => {
    //         if (!value || value.length === 0) return true;
    //         const userPermissions = row.getValue(id) as string[];
    //         return value.some(v => userPermissions.includes(v));
    //     },
    //     sortingFn: (rowA, rowB) =>
    //         (rowA.getValue("permissions") as string[])
    //             .join(", ")
    //             .localeCompare((rowB.getValue("permissions") as string[]).join(", ")),
    // },
    {
        accessorKey: "isVerified",
        header: ({ column }) => {
            const verifiedOptions = [
                { value: "all", label: t.all, icon: null },
                { value: "1", label: t.yes, icon: <CheckCircleIcon className="h-4 w-4 text-green-500 dark:text-green-300" /> },
                { value: "0", label: t.no, icon: <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-300" /> },
            ];
            const selectedOption = verifiedOptions.find(opt => opt.value === (column.getFilterValue() || "all")) || verifiedOptions[0];
            return (
                <Popover>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300 flex items-center gap-2`}
                                        aria-label={`Filter by verification status, currently ${selectedOption.label}`}
                                    >
                                        {translations.kh.isVerified}
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent className={commonStyles.tooltipBg}>
                                {t.filterVerified}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <PopoverContent className={`${commonStyles.gradientBg} w-48 p-0`} align="center" sideOffset={2}>
                        <Command>
                            <CommandList>
                                <CommandEmpty>{t.noVerified}</CommandEmpty>
                                <CommandGroup>
                                    {verifiedOptions.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.value}
                                            onSelect={() => {
                                                column.setFilterValue(option.value === "all" ? undefined : option.value);
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            {option.icon}
                                            {option.label}
                                            {option.value === (column.getFilterValue() || "all") && (
                                                <CheckIcon className="ml-auto h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            );
        },
        cell: ({ row }) => {
            const isVerified = row.getValue("isVerified") as number;
            const verifiedOptions = [
                { value: 1, label: t.yes, icon: <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-300" /> },
                { value: 0, label: t.no, icon: <XCircleIcon className="h-6 w-6 text-red-500 dark:text-red-300" /> },
            ];
            const { icon, label } = verifiedOptions.find(opt => opt.value === isVerified) || { icon: null, label: t.none };
            return (
                <button
                    className={`${commonStyles.text} flex items-center gap-2 px-12 cursor-pointer`}
                    onClick={() => {
                        setRowModalOpen(true);
                        setSelectedRow(row.original);
                    }}
                    role="button"
                    aria-label={`View details for user with verification status ${label}`}
                >
                    {icon}
                    {/* <span>{label}</span> */}
                </button>
            );
        },
        filterFn: (row, id, value) => {
            if (!value || value === "all") return true;
            return String(row.getValue(id)) === value;
        },
        enableSorting: false,
    },
    // {
    //     accessorKey: "isActive",
    //     header: ({ column }) => {
    //         const statusOptions = [
    //             { value: "all", label: t.all, icon: null },
    //             { value: "1", label: t.yes, icon: <CheckCircleIcon className="h-4 w-4 text-green-500 dark:text-green-300" /> },
    //             { value: "0", label: t.no, icon: <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-300" /> },
    //         ];
    //         const selectedOption = statusOptions.find(opt => opt.value === (column.getFilterValue() || "all")) || statusOptions[0];
    //         return (
    //             <Popover>
    //                 <TooltipProvider>
    //                     <Tooltip>
    //                         <TooltipTrigger asChild>
    //                             <PopoverTrigger asChild>
    //                                 <Button
    //                                     variant="ghost"
    //                                     className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300 flex items-center gap-2`}
    //                                     aria-label={`Filter by status, currently ${selectedOption.label}`}
    //                                 >
    //                                     {translations.kh.isActive}
    //                                     <Filter className="h-4 w-4" />
    //                                 </Button>
    //                             </PopoverTrigger>
    //                         </TooltipTrigger>
    //                         <TooltipContent className={commonStyles.tooltipBg}>
    //                             {t.filterActive}
    //                         </TooltipContent>
    //                     </Tooltip>
    //                 </TooltipProvider>
    //                 <PopoverContent className={`${commonStyles.gradientBg} w-48 p-0`} align="center" sideOffset={2}>
    //                     <Command>
    //                         <CommandList>
    //                             <CommandEmpty>{t.noActive}</CommandEmpty>
    //                             <CommandGroup>
    //                                 {statusOptions.map((option) => (
    //                                     <CommandItem
    //                                         key={option.value}
    //                                         value={option.value}
    //                                         onSelect={() => {
    //                                             column.setFilterValue(option.value === "all" ? undefined : option.value);
    //                                         }}
    //                                         className="flex items-center gap-2"
    //                                     >
    //                                         {option.icon}
    //                                         {option.label}
    //                                         {option.value === (column.getFilterValue() || "all") && (
    //                                             <CheckIcon className="ml-auto h-4 w-4 text-indigo-600 dark:text-indigo-300" />
    //                                         )}
    //                                     </CommandItem>
    //                                 ))}
    //                             </CommandGroup>
    //                         </CommandList>
    //                     </Command>
    //                 </PopoverContent>
    //             </Popover>
    //         );
    //     },
    //     cell: ({ row }) => {
    //         const isActive = row.getValue("isActive") as number;
    //         const statusOptions = [
    //             { value: 1, label: t.yes, icon: <CheckCircleIcon className="h-6 w-6q text-green-500 dark:text-green-300" /> },
    //             { value: 0, label: t.no, icon: <XCircleIcon className="h-6 w-6 text-red-500 dark:text-red-300" /> },
    //         ];
    //         const { icon, label } = statusOptions.find(opt => opt.value === isActive) || { icon: null, label: t.none };
    //         return (
    //             <button
    //                 className={`${commonStyles.text} flex items-center gap-2 px-7 cursor-pointer`}
    //                 onClick={() => {
    //                     setRowModalOpen(true);
    //                     setSelectedRow(row.original);
    //                 }}
    //                 role="button"
    //                 aria-label={`View details for user with status ${label}`}
    //             >
    //                 {icon}
    //                 {/* <span>{label}</span> */}
    //             </button>
    //         );
    //     },
    //     filterFn: (row, id, value) => {
    //         if (!value || value === "all") return true;
    //         return String(row.getValue(id)) === value;
    //     },
    //     enableSorting: false,
    // },
    {
        accessorKey: "created_at",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
            >
                {translations.kh.createdAt}
                {{
                    asc: <ArrowUp className="ml-2 h-4 w-4" />,
                    desc: <ArrowDown className="ml-2 h-4 w-4" />,
                }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
        ),
        cell: ({ row }) => (
            <button
                className={`${commonStyles.text} px-0 cursor-pointer`}
                onClick={() => {
                    setRowModalOpen(true);
                    setSelectedRow(row.original);
                }}
                role="button"
                aria-label={`View details for user created at ${new Date(row.getValue("created_at")).toLocaleString()}`}
            >
                {new Date(row.getValue("created_at")).toLocaleString()}
            </button>
        ),
        filterFn: (row, id, value) =>
            new Date(row.getValue(id)).toLocaleString().toLowerCase().includes(String(value).toLowerCase()),
        sortingFn: (rowA, rowB) =>
            new Date(rowA.getValue("created_at")).getTime() - new Date(rowB.getValue("created_at")).getTime(),
    },
];

export default function Users({ users = [], campuses = [], roles = [], permissions = [], flash, lang = "kh" }: UsersProps) {
    const t = translations['kh'];
    const { processing, delete: destroy } = useForm();
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [rowModalOpen, setRowModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<User | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const columns = useMemo(
        () => getColumns(t, processing, setUserToDelete, setRowModalOpen, setSelectedRow, setDeleteDialogOpen, campuses, roles, permissions),
        [t, processing, campuses, roles, permissions]
    );

    const globalFilterFn = (row: Row<User>, columnId: string, filterValue: string) => {
        const search = String(filterValue).toLowerCase().trim();
        if (!search) return true;
        const user = row.original;
        return (
            String(user.id).includes(search) ||
            (user.name || t.none).toLowerCase().includes(search) ||
            (user.email || t.none).toLowerCase().includes(search) ||
            (user.campus?.name || t.none).toLowerCase().includes(search) ||
            (user.roles.join(", ") || t.none).toLowerCase().includes(search) ||
            (user.permissions.join(", ") || t.none).toLowerCase().includes(search)
        );
    };

    const modalFields = (item: User) => (
        <>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.avatar}:</strong>{" "}
                <img src={item.avatar || "N/A"} alt="User avatar" className="inline-block h-15 w-15 rounded-full" />
            </p>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.name}:</strong>{" "}
                {item.name || t.none}
            </p>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.email}:</strong>{" "}
                {item.email || t.none}
            </p>
            {/* <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.campus}:</strong>{" "}
                {item.campus ? item.campus.name : t.none}
            </p> */}
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.roles}:</strong>{" "}
                {item.roles.join(", ") || t.none}
            </p>
            {/* <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.permissions}:</strong>{" "}
                {item.permissions.join(", ") || t.none}
            </p> */}
            <div className="flex flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                    <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.isVerified}:</strong>
                    {item.isVerified ?
                        <CircleCheck className="h-6 w-6 text-green-600 dark:text-green-400" /> :
                        <CircleX className="h-6 w-6 text-red-600 dark:text-red-400" />}
                </div>
                {/* <div className="flex items-center gap-2">
                    <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.isActive}:</strong>
                    {item.isActive ?
                        <CircleCheck className="h-4 w-4 text-green-600 dark:text-green-400" /> :
                        <CircleX className="h-4 w-4 text-red-600 dark:text-red-400" />}
                </div> */}
            </div>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.createdAt}:</strong>{" "}
                {new Date(item.created_at).toLocaleString()}
            </p>
        </>
    );

    const tooltipFields = (item: User) => (
        <>
            <p>
                <strong className="text-indigo-200">{t.avatar}:</strong>{" "}
                <img src={item.avatar} alt="User avatar" className="inline-block h-12 w-12 rounded-full" />
            </p>
            <p>
                <strong className="text-indigo-200">{t.id}:</strong> {item.id}
            </p>
            <p>
                <strong className="text-indigo-200">{t.name}:</strong> {item.name || t.none}
            </p>
            <p>
                <strong className="text-indigo-200">{t.email}:</strong> {item.email || t.none}
            </p>
            <p>
                <strong className="text-indigo-200">{t.campus}:</strong> {item.campus?.name || t.none}
            </p>
            <p>
                <strong className="text-indigo-200">{t.roles}:</strong> {item.roles.join(", ") || t.none}
            </p>
            <p>
                <strong className="text-indigo-200">{t.permissions}:</strong> {item.permissions.join(", ") || t.none}
            </p>
            <div className="flex flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                    <strong className="text-indigo-200">{t.isVerified}:</strong>
                    {item.isVerified ?
                        <CircleCheck className="h-4 w-4 text-green-600 dark:text-green-400" /> :
                        <CircleX className="h-4 w-4 text-red-600 dark:text-red-400" />}
                </div>
                <div className="flex items-center gap-2">
                    <strong className="text-indigo-200">{t.isActive}:</strong>
                    {item.isActive ?
                        <CircleCheck className="h-4 w-4 text-green-600 dark:text-green-400" /> :
                        <CircleX className="h-4 w-4 text-red-600 dark:text-red-400" />}
                </div>
            </div>
            <p>
                <strong className="text-indigo-200">{t.createdAt}:</strong>{" "}
                {new Date(item.created_at).toLocaleString()}
            </p>
        </>
    );

    const breadcrumbs = [
        { title: t.indexTitle, href: route("users.index") },
    ];

    return (
        <>
            <DataTable
                data={users || []}
                columns={columns}
                breadcrumbs={breadcrumbs}
                title={translations.kh.indexTitle}
                resourceName={translations.kh.indexTitle}
                routes={{
                    index: route("users.index"),
                    create: route("users.create"),
                    show: (id) => route("users.show", id),
                    edit: (id) => route("users.edit", id),
                    destroy: (id) => route("users.destroy", id),
                }}
                flash={flash}
                modalFields={modalFields}
                tooltipFields={tooltipFields}
                isSuperLibrarian={false}
                globalFilterFn={globalFilterFn}
            />
        </>
    );
}
