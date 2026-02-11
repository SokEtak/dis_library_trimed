"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Link, useForm } from '@inertiajs/react';
import {
    Eye,
    Pencil,
    Trash,
    MoreHorizontal,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
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
import DataTable from '@/components/DataTable';
import { translations } from "@/utils/translations/subcategory/subcategory-index";

interface Category {
    id: number;
    name: string;
}

interface Subcategory {
    id: number;
    name: string;
    category_id: number;
    category: Category | null;
}

interface SubcategoriesIndexProps {
    subcategories?: Subcategory[];
    flash?: {
        message?: string;
        type?: "success" | "error";
    };
    isSuperLibrarian?: boolean;
    lang?: "kh" | "en";
}

const commonStyles = {
    button: "rounded-lg text-sm transition-colors",
    text: "text-gray-800 dark:text-gray-100 text-sm",
    indigoButton:
        "bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700",
    outlineButton:
        "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-800",
    gradientBg: "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-indigo-900",
    tooltipBg: "bg-gradient-to-br from-blue-900 to-indigo-600 text-white rounded-xl",
};

const breadcrumbs = [
    { title: translations.kh.indexTitle, href: route("subcategories.index") },
];

const getColumns = (
    processing: boolean,
    setSubcategoryToDelete: React.Dispatch<React.SetStateAction<Subcategory | null>>,
    setRowModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setSelectedRow: React.Dispatch<React.SetStateAction<Subcategory | null>>,
    t: typeof translations.kh
): ColumnDef<Subcategory>[] => [
    {
        id: "actions",
        enableHiding: false,
        enableGlobalFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
            const subcategory = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className={`${commonStyles.button} h-8 w-8 p-0 text-indigo-600 dark:text-indigo-300`}
                            disabled={processing}
                            aria-label={`Open menu for subcategory ${subcategory.name}`}
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
                                            <Link href={route("subcategories.show", subcategory.id)} className="p-0">
                                                <Button variant="ghost" className="h-4 w-4 p-0">
                                                    <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
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
                                            <Link href={route("subcategories.edit", subcategory.id)} className="p-0">
                                                <Button
                                                    variant="ghost"
                                                    className="h-4 w-4 p-0"
                                                    disabled={processing}
                                                >
                                                    <Pencil className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                                </Button>
                                            </Link>
                                        </DropdownMenuItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" align="center" className={commonStyles.tooltipBg}>
                                        {t.editTooltip}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuItem asChild>
                                            <Button
                                                variant="ghost"
                                                className="h-4 w-4 p-0 text-red-600 dark:text-red-300"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSubcategoryToDelete(subcategory);
                                                }}
                                                disabled={processing}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className={commonStyles.tooltipBg}>
                                        {t.deleteTooltip}
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
                {t.indexId}
                {{
                    asc: <ArrowUp className="ml-2 h-4 w-4" />,
                    desc: <ArrowDown className="ml-2 h-4 w-4" />,
                }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
        ),
        cell: ({ row }) => (
            <button
                className={`${commonStyles.text} px-3 cursor-pointer`}
                onClick={() => {
                    setRowModalOpen(true);
                    setSelectedRow(row.original);
                }}
                role="button"
                aria-label={`View details for subcategory ${row.getValue("id") || "N/A"}`}
            >
                {row.getValue("id") || "N/A"}
            </button>
        ),
        filterFn: (row, id, value) => String(row.getValue(id) || "").toLowerCase().includes(String(value).toLowerCase()),
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
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
                className={`${commonStyles.text} px-3 cursor-pointer`}
                onClick={() => {
                    setRowModalOpen(true);
                    setSelectedRow(row.original);
                }}
                role="button"
                aria-label={`View details for subcategory ${row.getValue("name") || "N/A"}`}
            >
                {row.getValue("name") || "N/A"}
            </button>
        ),
        filterFn: (row, id, value) => String(row.getValue(id) || "").toLowerCase().includes(String(value).toLowerCase()),
    },
    {
        accessorKey: "category",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
            >
                {t.indexCategory}
                {{
                    asc: <ArrowUp className="ml-2 h-4 w-4" />,
                    desc: <ArrowDown className="ml-2 h-4 w-4" />,
                }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
        ),
        cell: ({ row }) => {
            const category = row.original.category;
            return (
                <button
                    className={`${commonStyles.text} px-3 cursor-pointer`}
                    onClick={() => {
                        setRowModalOpen(true);
                        setSelectedRow(row.original);
                    }}
                    role="button"
                    aria-label={
                        category
                            ? `View details for subcategory with category ${category.name}`
                            : "View details for subcategory with no category"
                    }
                >
                    {category ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={route("categories.show", category.id)}
                                        className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-400 underline text-sm"
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label={`Maps to category ${category.name} at route /categories/${category.id}`}
                                    >
                                        {category.name}
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent className={commonStyles.tooltipBg}>
                                    {t.indexCategoryTooltip}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <span className="text-red-500 dark:text-red-400 text-sm">{t.none}</span>
                    )}
                </button>
            );
        },
        filterFn: (row, id, value) => {
            const categoryName = row.original.category?.name || t.none;
            return categoryName.toLowerCase().includes(String(value).toLowerCase());
        },
        sortingFn: (rowA, rowB) => {
            const nameA = rowA.original.category?.name || t.none;
            const nameB = rowB.original.category?.name || t.none;
            return nameA.localeCompare(nameB);
        },
    },
];

export default function SubcategoriesIndex({ subcategories = [], flash, isSuperLibrarian = false, lang = "kh" }: SubcategoriesIndexProps) {
    const t = translations[lang];
    const { processing } = useForm();
    const [subcategoryToDelete, setSubcategoryToDelete] = useState<Subcategory | null>(null);
    const [rowModalOpen, setRowModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<Subcategory | null>(null);

    const columns = useMemo(
        () => getColumns(processing, setSubcategoryToDelete, setRowModalOpen, setSelectedRow, t),
        [processing, t]
    );

    const globalFilterFn = (row: Row<Subcategory>, columnId: string, filterValue: string) => {
        const search = String(filterValue).toLowerCase().trim();
        if (!search) return true;
        const subcategory = row.original;
        return (
            String(subcategory.id).includes(search) ||
            String(subcategory.name || "").toLowerCase().includes(search) ||
            String(subcategory.category?.name || t.none).toLowerCase().includes(search)
        );
    };

    const modalFields = (item: Subcategory) => (
        <>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.name}:</strong>{" "}
                {item.name || "N/A"}
            </p>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.category}:</strong>{" "}
                {item.category ? (
                    <Link
                        href={route("categories.show", item.category.id)}
                        className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-400 underline text-sm"
                        aria-label={`Maps to category ${item.category.name} at route /categories/${item.category.id}`}
                    >
                        {item.category.name}
                    </Link>
                ) : (
                    t.none
                )}
            </p>
        </>
    );

    const tooltipFields = (item: Subcategory) => (
        <>
            <p>
                <strong className="text-indigo-200">{t.name}:</strong> {item.name || "N/A"}
            </p>
            <p>
                <strong className="text-indigo-200">{t.category}:</strong> {item.category?.name || t.none}
            </p>
        </>
    );

    return (
        <DataTable
            data={subcategories}
            columns={columns}
            breadcrumbs={breadcrumbs}
            title={t.indexTitle}
            resourceName={t.indexTitle}
            routes={{
                index: route("subcategories.index"),
                create: route("subcategories.create"),
                show: (id) => route("subcategories.show", id),
                edit: (id) => route("subcategories.edit", id),
                destroy: (id) => route("subcategories.destroy", id),
            }}
            flash={flash}
            modalFields={modalFields}
            tooltipFields={tooltipFields}
            isSuperLibrarian={isSuperLibrarian}
            globalFilterFn={globalFilterFn}
        />
    );
}
