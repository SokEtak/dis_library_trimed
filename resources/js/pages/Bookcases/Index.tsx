"use client";

import DataTable from "@/components/DataTable";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { translations } from "@/utils/translations/bookcase";
import { translations as commonTranslations } from "@/utils/translations/subcategory/subcategory-index";
import { JsonRequestError, requestJson } from "@/utils/request-json";
import { Link } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Search, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

interface Book {
    id: number;
    title: string;
    code: string;
    isbn?: string;
    is_available: boolean;
}

interface Bookcase {
    id: number;
    code: string;
    active_books_count: number | null;
    total_books_count?: number | null;
    books: Book[] | null;
}

interface FlashProps {
    message?: string;
    error?: string;
    type?: "success" | "error";
}

interface BookcasesIndexProps {
    bookcases?: Bookcase[];
    flash?: FlashProps;
    lang?: "kh" | "en";
}

interface ApiDataResponse<T> {
    message: string;
    data: T;
}

interface ApiMessageResponse {
    message: string;
}

const resolveFlash = (flash?: FlashProps) => {
    if (flash?.type && flash.message) {
        return { message: flash.message, type: flash.type };
    }

    if (flash?.error) {
        return { message: flash.error, type: "error" as const };
    }

    if (flash?.message) {
        return { message: flash.message, type: "success" as const };
    }

    return undefined;
};

interface BooksHoverCardProps {
    title: string;
    books: Book[] | null;
    emptyLabel: string;
    searchPlaceholder: string;
    noResultsLabel: string;
}

function BooksHoverCard({
    title,
    books,
    emptyLabel,
    searchPlaceholder,
    noResultsLabel,
}: BooksHoverCardProps) {
    const [query, setQuery] = useState("");
    const normalizedQuery = query.trim().toLowerCase();

    const filteredBooks = useMemo(() => {
        if (!books || books.length === 0) {
            return [];
        }

        if (!normalizedQuery) {
            return books;
        }

        return books.filter((book) =>
            `${book.title} ${book.code} ${book.isbn ?? ""}`.toLowerCase().includes(normalizedQuery),
        );
    }, [books, normalizedQuery]);

    if (!books || books.length === 0) {
        return (
            <Card className="overflow-hidden rounded-lg border-indigo-200 bg-white dark:border-indigo-600 dark:bg-gray-800">
                <CardContent className="p-3">
                    <h3 className="pb-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">{title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{emptyLabel}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden rounded-lg border-indigo-200 bg-white dark:border-indigo-600 dark:bg-gray-800">
            <CardContent className="space-y-2 p-3">
                <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">{title}</h3>
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        className="h-8 pl-8 text-xs"
                        placeholder={searchPlaceholder}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    {filteredBooks.length}/{books.length}
                </p>
                <div className="max-h-56 overflow-y-auto pr-1">
                    {filteredBooks.length > 0 ? (
                        <ul className="list-inside list-disc space-y-2 text-sm text-gray-700 dark:text-gray-200">
                            {filteredBooks.map((book) => (
                                <li key={book.id} className="break-words">
                                    <Link
                                        href={route("books.show", { book: book.id })}
                                        className="text-indigo-600 hover:underline dark:text-indigo-300"
                                        onClick={(event) => event.stopPropagation()}
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
                        <p className="text-sm text-gray-600 dark:text-gray-300">{noResultsLabel}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

const getColumns = (
    t: typeof translations.kh,
    onEdit: (item: Bookcase) => void,
    onDelete: (item: Bookcase) => void,
    searchPlaceholder: string,
    noResultsLabel: string,
): ColumnDef<Bookcase>[] => [
    {
        id: "actions",
        enableHiding: false,
        enableGlobalFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
            const bookcase = row.original;
            return (
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(event) => {
                            event.stopPropagation();
                            onEdit(bookcase);
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDelete(bookcase);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            );
        },
    },
    {
        accessorKey: "id",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="text-indigo-600 dark:text-indigo-300"
            >
                {t.indexId}
                {{
                    asc: <ArrowUp className="ml-2 h-4 w-4" />,
                    desc: <ArrowDown className="ml-2 h-4 w-4" />,
                }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
        ),
        cell: ({ row }) => <span className="px-4 text-sm">{row.original.id}</span>,
    },
    {
        accessorKey: "code",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="text-indigo-600 dark:text-indigo-300"
            >
                {t.indexCode}
                {{
                    asc: <ArrowUp className="ml-2 h-4 w-4" />,
                    desc: <ArrowDown className="ml-2 h-4 w-4" />,
                }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
        ),
        cell: ({ row }) => <span className="px-4 text-sm">{row.original.code}</span>,
    },
    {
        accessorKey: "active_books_count",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="text-indigo-600 dark:text-indigo-300"
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
                            <button type="button" className="px-4 text-sm">
                                {bookcase.active_books_count ?? 0}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent
                            side="right"
                            align="start"
                            sideOffset={8}
                            avoidCollisions={false}
                            className="w-[22rem] p-0 shadow-xl"
                        >
                            <BooksHoverCard
                                key={bookcase.id}
                                title={t.indexBooksInBookcase.replace("{code}", bookcase.code)}
                                books={bookcase.books}
                                emptyLabel={t.indexNoBooks}
                                searchPlaceholder={searchPlaceholder}
                                noResultsLabel={noResultsLabel}
                            />
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
        filterFn: (row, id, value) => String(row.getValue(id) ?? 0).includes(String(value)),
    },
];

export default function BookcasesIndex({ bookcases = [], flash, lang = "kh" }: BookcasesIndexProps) {
    const t = translations[lang];
    const common = commonTranslations[lang];
    const hoverSearchPlaceholder = lang === "kh" ? "ស្វែងរកតាមឈ្មោះ ឬ កូដ..." : "Search by title or code...";
    const hoverNoResultsLabel = lang === "kh" ? "មិនមានលទ្ធផលស្វែងរក" : "No matching books.";
    const [rows, setRows] = useState<Bookcase[]>(bookcases);
    const [flashState, setFlashState] = useState(resolveFlash(flash));

    const [viewItem, setViewItem] = useState<Bookcase | null>(null);
    const [editItem, setEditItem] = useState<Bookcase | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState<Bookcase | null>(null);

    const [code, setCode] = useState("");
    const [codeError, setCodeError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handledQueryRef = useRef(false);

    useEffect(() => {
        setRows(bookcases);
    }, [bookcases]);

    useEffect(() => {
        if (handledQueryRef.current || typeof window === "undefined") {
            return;
        }

        handledQueryRef.current = true;

        const params = new URLSearchParams(window.location.search);
        const dialog = params.get("dialog");
        const idParam = params.get("id");
        const id = idParam ? Number(idParam) : null;

        if (dialog === "create") {
            openCreateDialog();
            window.history.replaceState({}, "", route("bookcases.index"));
            return;
        }

        if ((dialog === "edit" || dialog === "view") && id) {
            const target = rows.find((item) => item.id === id);
            if (target) {
                if (dialog === "edit") {
                    openEditDialog(target);
                } else {
                    setViewItem(target);
                }
            }
            window.history.replaceState({}, "", route("bookcases.index"));
        }
    }, [rows]);

    const openCreateDialog = () => {
        setCode("");
        setCodeError(null);
        setCreateOpen(true);
    };

    const openEditDialog = (item: Bookcase) => {
        setEditItem(item);
        setCode(item.code);
        setCodeError(null);
    };

    const handleCreate = async (event: FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setCodeError(null);

        try {
            const response = await requestJson<ApiDataResponse<Bookcase>>(route("bookcases.store"), {
                method: "POST",
                body: { code },
            });

            setRows((current) => [response.data, ...current]);
            setCreateOpen(false);
            setFlashState({ message: response.message, type: "success" });
        } catch (error) {
            if (error instanceof JsonRequestError) {
                setCodeError(error.errors?.code?.[0] ?? null);
                setFlashState({ message: error.message, type: "error" });
            } else {
                setFlashState({ message: t.createError, type: "error" });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (event: FormEvent) => {
        event.preventDefault();
        if (!editItem) return;

        setSubmitting(true);
        setCodeError(null);

        try {
            const response = await requestJson<ApiDataResponse<Bookcase>>(
                route("bookcases.update", { bookcase: editItem.id }),
                {
                    method: "PUT",
                    body: { code },
                },
            );

            setRows((current) =>
                current.map((item) => (item.id === response.data.id ? response.data : item)),
            );
            setEditItem(null);
            setFlashState({ message: response.message, type: "success" });
        } catch (error) {
            if (error instanceof JsonRequestError) {
                setCodeError(error.errors?.code?.[0] ?? null);
                setFlashState({ message: error.message, type: "error" });
            } else {
                setFlashState({ message: t.editError, type: "error" });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteItem) return;

        setDeleting(true);

        try {
            const response = await requestJson<ApiMessageResponse>(
                route("bookcases.destroy", { bookcase: deleteItem.id }),
                {
                    method: "DELETE",
                },
            );

            setRows((current) => current.filter((item) => item.id !== deleteItem.id));
            setDeleteItem(null);
            setFlashState({ message: response.message, type: "success" });
        } catch (error) {
            if (error instanceof JsonRequestError) {
                setFlashState({ message: error.message, type: "error" });
            } else {
                setFlashState({ message: t.editError, type: "error" });
            }
        } finally {
            setDeleting(false);
        }
    };

    const columns = useMemo(
        () => getColumns(t, openEditDialog, setDeleteItem, hoverSearchPlaceholder, hoverNoResultsLabel),
        [t, hoverSearchPlaceholder, hoverNoResultsLabel],
    );
    const breadcrumbs = [{ title: t.indexTitle, href: route("bookcases.index") }];

    return (
        <>
            <DataTable
                data={rows}
                columns={columns}
                breadcrumbs={breadcrumbs}
                title={t.indexTitle}
                resourceName={t.indexTitle}
                routes={{
                    index: route("bookcases.index"),
                    create: route("bookcases.create"),
                    show: (id) => route("bookcases.show", { bookcase: id }),
                    edit: (id) => route("bookcases.edit", { bookcase: id }),
                    destroy: (id) => route("bookcases.destroy", { bookcase: id }),
                    export: route("bookcases.export"),
                    import: route("bookcases.import"),
                }}
                flash={flashState}
                onCreate={openCreateDialog}
                enableRowModal={false}
            />

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.createTitle}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="create-bookcase-code" className="text-sm font-medium">
                                {t.createBookcaseCode}
                            </label>
                            <Input
                                id="create-bookcase-code"
                                value={code}
                                onChange={(event) => setCode(event.target.value)}
                                maxLength={10}
                                autoFocus
                                disabled={submitting}
                            />
                            {codeError && <p className="text-sm text-red-500">{codeError}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>
                                {t.createCancel}
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? t.creating : t.create}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.editTitle}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="edit-bookcase-code" className="text-sm font-medium">
                                {t.editBookcaseCode}
                            </label>
                            <Input
                                id="edit-bookcase-code"
                                value={code}
                                onChange={(event) => setCode(event.target.value)}
                                maxLength={10}
                                autoFocus
                                disabled={submitting}
                            />
                            {codeError && <p className="text-sm text-red-500">{codeError}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditItem(null)} disabled={submitting}>
                                {t.editCancel}
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? t.editUpdating : t.editUpdate}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.showTitle}</DialogTitle>
                    </DialogHeader>
                    {viewItem && (
                        <div className="space-y-3 text-sm">
                            <p><strong>{t.showId}:</strong> {viewItem.id}</p>
                            <p><strong>{t.showCode}:</strong> {viewItem.code}</p>
                            <p><strong>{t.indexBooksCount}:</strong> {viewItem.active_books_count ?? 0}</p>
                            <div>
                                <strong>{t.showBooksInBookcase}:</strong>
                                {viewItem.books && viewItem.books.length > 0 ? (
                                    <ul className="mt-2 list-inside list-disc space-y-1">
                                        {viewItem.books.map((book) => (
                                            <li key={book.id}>
                                                <Link
                                                    href={route("books.show", { book: book.id })}
                                                    className="text-indigo-600 hover:underline dark:text-indigo-300"
                                                >
                                                    {book.title}
                                                </Link>{" "}
                                                ({book.code})
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-1 text-muted-foreground">{t.showNoBooks}</p>
                                )}
                            </div>
                            <Link
                                href={route("bookcases.show", { bookcase: viewItem.id })}
                                className="inline-flex text-sm text-indigo-600 hover:underline dark:text-indigo-300"
                            >
                                {t.indexViewTooltip}
                            </Link>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{common.delete}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteItem ? `${common.delete} "${deleteItem.code}"?` : ""}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>{t.editCancel}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {common.delete}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
