"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Link, useForm } from '@inertiajs/react';
import {
    Eye,
    Pencil,
    MoreHorizontal,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import {
    ColumnDef,
    flexRender,
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
import { Card, CardContent } from "@/components/ui/card";
import DataTable from '@/components/DataTable';
import { translations } from "@/utils/translations/bookcase";

interface Book {
    id: number;
    title: string;
    code: string;
    isbn: string;
    is_available: boolean;
}

interface Bookcase {
    id: number;
    code: string;
    active_books_count: number | null;
    books: Book[] | null;
}

interface BookcasesIndexProps {
    bookcases?: Bookcase[];
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

const getColumns = (processing: boolean, lang: "kh" | "en" = "kh"): ColumnDef<Bookcase>[] => {
    const t = translations[lang];
    return [
        {
            id: "actions",
            enableHiding: false,
            enableGlobalFilter: false,
            enableSorting: false,
            cell: ({ row }) => {
                const bookcase = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className={`${commonStyles.button} h-8 w-8 p-0`}
                                aria-label="Open actions menu"
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
                                            <Link href={route("bookcases.show", { bookcase: bookcase.id })}>
                                                <Button variant="ghost" className="h-4 w-4 p-0">
                                                    <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                                </Button>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" align="center" className={commonStyles.tooltipBg}>
                                            {t.indexViewTooltip}
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link href={route("bookcases.edit", { bookcase: bookcase.id })}>
                                                <Button
                                                    variant="ghost"
                                                    className="h-4 w-4 p-0"
                                                    disabled={processing}
                                                    aria-label="Edit bookcase"
                                                >
                                                    <Pencil className="h-4 w-4 mb-1 text-indigo-600 dark:text-indigo-300" />
                                                </Button>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" align="center" className={commonStyles.tooltipBg}>
                                            {t.indexEditTooltip}
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
                <Link
                    href={route("bookcases.show", { bookcase: row.original.id })}
                    className={`${commonStyles.text} px-10 hover:underline`}
                >
                    {row.getValue("id")}
                </Link>
            ),
            filterFn: (row, id, value) =>
                String(row.getValue(id)).toLowerCase().includes(String(value).toLowerCase()),
        },
        {
            accessorKey: "code",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
                >
                    {t.indexCode}
                    {{
                        asc: <ArrowUp className="ml-2 h-4 w-4" />,
                        desc: <ArrowDown className="ml-2 h-4 w-4" />,
                    }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
                </Button>
            ),
            cell: ({ row }) => (
                <Link
                    href={route("bookcases.show", { bookcase: row.original.id })}
                    className={`${commonStyles.text} px-10 hover:underline`}
                >
                    {row.getValue("code")}
                </Link>
            ),
            filterFn: (row, id, value) =>
                String(row.getValue(id)).toLowerCase().includes(String(value).toLowerCase()),
        },
        {
            accessorKey: "active_books_count",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
                >
                    {t.indexBooksCount}
                    {{
                        asc: <ArrowUp className="ml-2 h-4 w-4" />,
                        desc: <ArrowDown className="ml-2 h-4 w-4" />,
                    }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
                </Button>
            ),
            cell: ({ row }) => {
                const bookcase = row.original;
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href={route("bookcases.show", { bookcase: bookcase.id })}
                                    className={`${commonStyles.text} px-3 hover:underline`}
                                >
                                    {bookcase.active_books_count ?? 0}
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-sm shadow-xl p-0">
                                <Card className="border-indigo-200 dark:border-indigo-600 bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                                    <CardContent className="p-3">
                                        <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 pb-2">
                                            {t.indexBooksInBookcase.replace("{code}", bookcase.code)}
                                        </h3>
                                        {bookcase.books && bookcase.books.length > 0 ? (
                                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-200">
                                                {bookcase.books.map((book) => (
                                                    <li key={book.id} className="break-words">
                                                        <Link
                                                            href={route("books.show", { book: book.id })}
                                                            className="text-indigo-600 dark:text-indigo-300 hover:underline"
                                                        >
                                                            {book.title}
                                                        </Link>
                                                        <span
                                                            className={`ml-2 ${
                                                                book.is_available
                                                                    ? "text-green-600 dark:text-green-400"
                                                                    : "text-red-600 dark:text-red-400"
                                                            }`}
                                                        >
                                                            ({book.code})
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                {t.indexNoBooks}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            },
            filterFn: (row, id, value) => String(row.getValue(id) ?? 0).includes(String(value)),
        },
    ];
};

export default function BookcasesIndex({ bookcases = [], flash, isSuperLibrarian = false, lang = "kh" }: BookcasesIndexProps) {
    const t = translations[lang];
    const { processing } = useForm();
    const columns = useMemo(() => getColumns(processing, lang), [processing, lang]);

    const modalFields = (item: Bookcase) => (
        <>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.indexBooksCount}({item.active_books_count ?? 0}):</strong>{" "}
                {item.books && item.books.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        {item.books.map((book) => (
                            <li key={book.id}>
                                <Link
                                    href={route("books.show", { book: book.id })}
                                    className="text-indigo-600 dark:text-indigo-300 hover:underline"
                                >
                                    {book.title}
                                </Link>
                                <span
                                    className={`ml-2 ${
                                        book.is_available
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-red-600 dark:text-red-400"
                                    }`}
                                >
                                    ({t.indexCode}: {book.code})
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    t.indexNoBooks
                )}
            </p>
        </>
    );

    const breadcrumbs = [
        { title: t.indexTitle, href: route("bookcases.index") },
    ];

    return (
        <DataTable
            data={bookcases}
            columns={columns}
            breadcrumbs={breadcrumbs}
            title={t.indexTitle}
            resourceName={t.indexTitle}
            routes={{
                index: route("bookcases.index"),
                create: route("bookcases.create"),
                show: (id) => route("bookcases.show", { bookcase: id }),
                edit: (id) => route("bookcases.edit", { bookcase: id }),
            }}
            flash={flash}
            modalFields={modalFields}
            isSuperLibrarian={isSuperLibrarian}
        />
    );
}
