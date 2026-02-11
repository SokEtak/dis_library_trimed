"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useForm, usePage } from '@inertiajs/react';
import {
    EyeIcon,
    PencilIcon,
    MoreHorizontal,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import {
    ColumnDef,
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DataTable from '@/components/DataTable';
import { translations } from "@/utils/translations/category/category-index";

interface Category {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

interface PageProps {
    categories: Category[];
    flash: {
        message?: string;
    };
    lang?: "kh" | "en";
}

const breadcrumbs = [
    { title: translations.kh.indexTitle, href: route("categories.index") },
];

const getColumns = (
    setCategoryToDelete: React.Dispatch<React.SetStateAction<Category | null>>,
    processing: boolean,
    setRowModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setSelectedRow: React.Dispatch<React.SetStateAction<Category | null>>,
    t: typeof translations.kh
): ColumnDef<Category>[] => {
    return [
        {
            id: "actions",
            enableHiding: false,
            enableGlobalFilter: false,
            enableSorting: false,
            cell: ({ row }) => {
                const category = row.original;
                return (
                    <TooltipProvider>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-auto min-w-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-indigo-900 border-indigo-200 dark:border-indigo-600 rounded-xl">
                                <div className="flex flex-col items-center gap-1 px-1 py-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link href={route("categories.show", category.id)} onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" className="h-4 w-4 p-0">
                                                    <EyeIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                                </Button>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="bg-gradient-to-br from-blue-900 to-indigo-600 text-white rounded-xl">
                                            {t.viewTooltip}
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link href={route("categories.edit", category.id)} onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" className="h-4 w-4 p-0">
                                                    <PencilIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                                </Button>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="bg-gradient-to-br from-blue-900 to-indigo-600 text-white rounded-xl">
                                            {t.editTooltip}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TooltipProvider>
                );
            },
        },
        {
            accessorKey: "id",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        column.toggleSorting(column.getIsSorted() === "asc");
                    }}
                    className="text-indigo-600 dark:text-indigo-300 text-sm"
                >
                    {t.indexId}
                    {{
                        asc: <ArrowUp className="ml-2 h-4 w-4" />,
                        desc: <ArrowDown className="ml-2 h-4 w-4" />,
                    }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
                </Button>
            ),
            cell: ({ row }) => (
                <button
                    className="px-3 cursor-pointer text-gray-800 dark:text-gray-100 text-sm"
                    onClick={() => {
                        setRowModalOpen(true);
                        setSelectedRow(row.original);
                    }}
                    role="button"
                >
                    {row.getValue("id")}
                </button>
            ),
            filterFn: (row, id, value) => String(row.getValue(id)).includes(String(value)),
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        column.toggleSorting(column.getIsSorted() === "asc");
                    }}
                    className="text-indigo-600 dark:text-indigo-300 text-sm"
                >
                    {t.indexName}
                    {{
                        asc: <ArrowUp className="ml-2 h-4 w-4" />,
                        desc: <ArrowDown className="ml-2 h-4 w-4" />,
                    }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
                </Button>
            ),
            cell: ({ row }) => (
                <button
                    className="px-3 cursor-pointer text-gray-800 dark:text-gray-100 text-sm"
                    onClick={() => {
                        setRowModalOpen(true);
                        setSelectedRow(row.original);
                    }}
                    role="button"
                >
                    {row.getValue("name")}
                </button>
            ),
            filterFn: (row, id, value) => String(row.getValue(id)).toLowerCase().includes(String(value).toLowerCase()),
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        column.toggleSorting(column.getIsSorted() === "asc");
                    }}
                    className="text-indigo-600 dark:text-indigo-300 text-sm"
                >
                    {t.indexCreatedAt}
                    {{
                        asc: <ArrowUp className="ml-2 h-4 w-4" />,
                        desc: <ArrowDown className="ml-2 h-4 w-4" />,
                    }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
                </Button>
            ),
            cell: ({ row }) => (
                <button
                    className="px-3 cursor-pointer text-gray-800 dark:text-gray-100 text-sm"
                    onClick={() => {
                        setRowModalOpen(true);
                        setSelectedRow(row.original);
                    }}
                    role="button"
                >
                    {new Date(row.getValue("created_at")).toLocaleString()}
                </button>
            ),
            filterFn: (row, id, value) =>
                new Date(row.getValue(id)).toLocaleString().toLowerCase().includes(String(value).toLowerCase()),
        },
        {
            accessorKey: "updated_at",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        column.toggleSorting(column.getIsSorted() === "asc");
                    }}
                    className="text-indigo-600 dark:text-indigo-300 text-sm"
                >
                    {t.indexUpdatedAt}
                    {{
                        asc: <ArrowUp className="ml-2 h-4 w-4" />,
                        desc: <ArrowDown className="ml-2 h-4 w-4" />,
                    }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
                </Button>
            ),
            cell: ({ row }) => (
                <button
                    className="px-3 cursor-pointer text-gray-800 dark:text-gray-100 text-sm"
                    onClick={() => {
                        setRowModalOpen(true);
                        setSelectedRow(row.original);
                    }}
                    role="button"
                >
                    {new Date(row.getValue("updated_at")).toLocaleString()}
                </button>
            ),
            filterFn: (row, id, value) =>
                new Date(row.getValue(id)).toLocaleString().toLowerCase().includes(String(value).toLowerCase()),
        },
    ];
};

export default function CategoriesIndex({ lang = "kh" }: { lang?: "kh" | "en" }) {
    const t = translations[lang];
    const { categories, flash } = usePage<PageProps>().props;
    const { processing } = useForm();
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [rowModalOpen, setRowModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<Category | null>(null);

    const columns = getColumns(setCategoryToDelete, processing, setRowModalOpen, setSelectedRow, t);

    return (
        <DataTable
            data={categories}
            columns={columns}
            breadcrumbs={breadcrumbs}
            title={t.indexTitle}
            resourceName={t.indexTitle}
            routes={{
                index: route("categories.index"),
                create: route("categories.create"),
                show: (id) => route("categories.show", id),
                edit: (id) => route("categories.edit", id),
                destroy: (id) => route("categories.destroy", id),
            }}
            flash={flash}
        />
    );
}
