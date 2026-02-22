"use client";

import DataTable from "@/components/DataTable";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { translations } from "@/utils/translations/category/category-create";
import { JsonRequestError, requestJson } from "@/utils/request-json";
import { ColumnDef } from "@tanstack/react-table";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react";

interface Category {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

interface FlashProps {
    message?: string;
    error?: string;
    type?: "success" | "error";
}

interface CategoriesIndexProps {
    categories: Category[];
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

const getColumns = (
    t: typeof translations.kh,
    onEdit: (item: Category) => void,
    onDelete: (item: Category) => void,
): ColumnDef<Category>[] => [
    {
        id: "actions",
        enableHiding: false,
        enableGlobalFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
            const category = row.original;

            return (
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(event) => {
                            event.stopPropagation();
                            onEdit(category);
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
                            onDelete(category);
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
                className="text-indigo-600 dark:text-indigo-300 text-sm"
            >
                {t.indexId}
                {{
                    asc: <ArrowUp className="ml-2 h-4 w-4" />,
                    desc: <ArrowDown className="ml-2 h-4 w-4" />,
                }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
        ),
        cell: ({ row }) => <span className="px-3 text-sm">{row.original.id}</span>,
        filterFn: (row, id, value) =>
            String(row.getValue(id)).toLowerCase().includes(String(value).toLowerCase()),
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="text-indigo-600 dark:text-indigo-300 text-sm"
            >
                {t.indexName}
                {{
                    asc: <ArrowUp className="ml-2 h-4 w-4" />,
                    desc: <ArrowDown className="ml-2 h-4 w-4" />,
                }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
        ),
        cell: ({ row }) => <span className="px-3 text-sm">{row.original.name}</span>,
        filterFn: (row, id, value) =>
            String(row.getValue(id)).toLowerCase().includes(String(value).toLowerCase()),
    },
    {
        accessorKey: "created_at",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
            <span className="px-3 text-sm">
                {new Date(row.original.created_at).toLocaleString()}
            </span>
        ),
    },
    {
        accessorKey: "updated_at",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
            <span className="px-3 text-sm">
                {new Date(row.original.updated_at).toLocaleString()}
            </span>
        ),
    },
];

export default function CategoriesIndex({ categories, flash, lang = "kh" }: CategoriesIndexProps) {
    const t = translations[lang];
    const breadcrumbs = [{ title: t.indexTitle, href: route("categories.index") }];
    const [rows, setRows] = useState<Category[]>(categories);
    const [flashState, setFlashState] = useState(resolveFlash(flash));

    const [viewItem, setViewItem] = useState<Category | null>(null);
    const [editItem, setEditItem] = useState<Category | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState<Category | null>(null);

    const [name, setName] = useState("");
    const [nameError, setNameError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handledQueryRef = useRef(false);

    useEffect(() => {
        setRows(categories);
    }, [categories]);

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
            window.history.replaceState({}, "", route("categories.index"));
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
            window.history.replaceState({}, "", route("categories.index"));
        }
    }, [rows]);

    const openCreateDialog = () => {
        setName("");
        setNameError(null);
        setCreateOpen(true);
    };

    const openEditDialog = (item: Category) => {
        setEditItem(item);
        setName(item.name);
        setNameError(null);
    };

    const handleCreate = async (event: FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setNameError(null);

        try {
            const response = await requestJson<ApiDataResponse<Category>>(route("categories.store"), {
                method: "POST",
                body: { name },
            });

            setRows((current) => [response.data, ...current]);
            setCreateOpen(false);
            setName("");
            setFlashState({ message: response.message, type: "success" });
        } catch (error) {
            if (error instanceof JsonRequestError) {
                setNameError(error.errors?.name?.[0] ?? null);
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
        setNameError(null);

        try {
            const response = await requestJson<ApiDataResponse<Category>>(
                route("categories.update", editItem.id),
                {
                    method: "PUT",
                    body: { name },
                },
            );

            setRows((current) =>
                current.map((item) => (item.id === response.data.id ? response.data : item)),
            );
            setEditItem(null);
            setName("");
            setFlashState({ message: response.message, type: "success" });
        } catch (error) {
            if (error instanceof JsonRequestError) {
                setNameError(error.errors?.name?.[0] ?? null);
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
                route("categories.destroy", deleteItem.id),
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
                setFlashState({ message: t.createError, type: "error" });
            }
        } finally {
            setDeleting(false);
        }
    };

    const columns = useMemo(
        () => getColumns(t, openEditDialog, setDeleteItem),
        [t],
    );

    return (
        <>
            <DataTable
                data={rows}
                columns={columns}
                breadcrumbs={breadcrumbs}
                title={t.indexTitle}
                resourceName={t.indexTitle}
                routes={{
                    index: route("categories.index"),
                    create: route("categories.create"),
                    show: (id) => route("categories.show", id),
                    edit: (id) => route("categories.edit", id),
                    export: route("categories.export"),
                    import: route("categories.import"),
                }}
                flash={flashState}
                onCreate={openCreateDialog}
                enableRowModal={false}
                onRowClick={setViewItem}
            />

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.createTitle}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="create-category-name" className="text-sm font-medium">
                                {t.createCategoryName}
                            </label>
                            <Input
                                id="create-category-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                maxLength={100}
                                disabled={submitting}
                                autoFocus
                            />
                            {nameError && (
                                <p className="text-sm text-red-500">{nameError}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateOpen(false)}
                                disabled={submitting}
                            >
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
                            <label htmlFor="edit-category-name" className="text-sm font-medium">
                                {t.editCategoryName}
                            </label>
                            <Input
                                id="edit-category-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                maxLength={100}
                                disabled={submitting}
                                autoFocus
                            />
                            {nameError && (
                                <p className="text-sm text-red-500">{nameError}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditItem(null)}
                                disabled={submitting}
                            >
                                {t.editCancel}
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? t.editSaving : t.editSave}
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
                            <p><strong>{t.showName}:</strong> {viewItem.name}</p>
                            <p><strong>{t.showCreatedAt}:</strong> {new Date(viewItem.created_at).toLocaleString()}</p>
                            <p><strong>{t.showLastModified}:</strong> {new Date(viewItem.updated_at).toLocaleString()}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.showDelete}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t.showConfirmDeleteDescription}
                            {deleteItem ? `"${deleteItem.name}"?` : ""}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>{t.showCancel}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {t.showDelete}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
