"use client";

import DataTable from "@/components/DataTable";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { translations } from "@/utils/translations/subcategory/subcategory-index";
import { JsonRequestError, requestJson } from "@/utils/request-json";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

interface CategoryOption {
    id: number;
    name: string;
}

interface Subcategory {
    id: number;
    name: string;
    category_id: number;
    category: CategoryOption | null;
}

interface FlashProps {
    message?: string;
    error?: string;
    type?: "success" | "error";
}

interface SubcategoriesIndexProps {
    subcategories: Subcategory[];
    categories: CategoryOption[];
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
    onEdit: (item: Subcategory) => void,
    onDelete: (item: Subcategory) => void,
): ColumnDef<Subcategory>[] => [
    {
        id: "actions",
        enableHiding: false,
        enableGlobalFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
            const subcategory = row.original;

            return (
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(event) => {
                            event.stopPropagation();
                            onEdit(subcategory);
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
                            onDelete(subcategory);
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
        id: "category",
        accessorFn: (row) => row.category?.name ?? t.none,
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="text-indigo-600 dark:text-indigo-300 text-sm"
            >
                {t.indexCategory}
                {{
                    asc: <ArrowUp className="ml-2 h-4 w-4" />,
                    desc: <ArrowDown className="ml-2 h-4 w-4" />,
                }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
        ),
        cell: ({ row }) => (
            <span className="px-3 text-sm">{row.original.category?.name ?? t.none}</span>
        ),
        filterFn: (row, id, value) =>
            String(row.getValue(id)).toLowerCase().includes(String(value).toLowerCase()),
    },
];

export default function SubcategoriesIndex({
    subcategories,
    categories,
    flash,
    lang = "kh",
}: SubcategoriesIndexProps) {
    const t = translations[lang];
    const breadcrumbs = [{ title: t.indexTitle, href: route("subcategories.index") }];
    const [rows, setRows] = useState<Subcategory[]>(subcategories);
    const [flashState, setFlashState] = useState(resolveFlash(flash));

    const [viewItem, setViewItem] = useState<Subcategory | null>(null);
    const [editItem, setEditItem] = useState<Subcategory | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState<Subcategory | null>(null);

    const [name, setName] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [errors, setErrors] = useState<{ name?: string; category_id?: string }>({});
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handledQueryRef = useRef(false);

    useEffect(() => {
        setRows(subcategories);
    }, [subcategories]);

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
            window.history.replaceState({}, "", route("subcategories.index"));
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
            window.history.replaceState({}, "", route("subcategories.index"));
        }
    }, [rows]);

    const openCreateDialog = () => {
        setName("");
        setCategoryId("");
        setErrors({});
        setCreateOpen(true);
    };

    const openEditDialog = (item: Subcategory) => {
        setEditItem(item);
        setName(item.name);
        setCategoryId(String(item.category_id));
        setErrors({});
    };

    const handleCreate = async (event: FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const response = await requestJson<ApiDataResponse<Subcategory>>(
                route("subcategories.store"),
                {
                    method: "POST",
                    body: { name, category_id: Number(categoryId) },
                },
            );

            setRows((current) => [response.data, ...current]);
            setCreateOpen(false);
            setFlashState({ message: response.message, type: "success" });
        } catch (error) {
            if (error instanceof JsonRequestError) {
                setErrors({
                    name: error.errors?.name?.[0],
                    category_id: error.errors?.category_id?.[0],
                });
                setFlashState({ message: error.message, type: "error" });
            } else {
                setFlashState({ message: t.error, type: "error" });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (event: FormEvent) => {
        event.preventDefault();
        if (!editItem) return;

        setSubmitting(true);
        setErrors({});

        try {
            const response = await requestJson<ApiDataResponse<Subcategory>>(
                route("subcategories.update", editItem.id),
                {
                    method: "PUT",
                    body: { name, category_id: Number(categoryId) },
                },
            );

            setRows((current) =>
                current.map((item) => (item.id === response.data.id ? response.data : item)),
            );
            setEditItem(null);
            setFlashState({ message: response.message, type: "success" });
        } catch (error) {
            if (error instanceof JsonRequestError) {
                setErrors({
                    name: error.errors?.name?.[0],
                    category_id: error.errors?.category_id?.[0],
                });
                setFlashState({ message: error.message, type: "error" });
            } else {
                setFlashState({ message: t.error, type: "error" });
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
                route("subcategories.destroy", deleteItem.id),
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
                setFlashState({ message: t.error, type: "error" });
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
                    index: route("subcategories.index"),
                    create: route("subcategories.create"),
                    show: (id) => route("subcategories.show", id),
                    edit: (id) => route("subcategories.edit", id),
                    export: route("subcategories.export"),
                    import: route("subcategories.import"),
                }}
                flash={flashState}
                onCreate={openCreateDialog}
                enableRowModal={false}
                onRowClick={setViewItem}
            />

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.title}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="create-subcategory-name" className="text-sm font-medium">
                                {t.subcategoryName}
                            </label>
                            <Input
                                id="create-subcategory-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                maxLength={100}
                                autoFocus
                                disabled={submitting}
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="create-subcategory-category" className="text-sm font-medium">
                                {t.category}
                            </label>
                            <select
                                id="create-subcategory-category"
                                value={categoryId}
                                onChange={(event) => setCategoryId(event.target.value)}
                                disabled={submitting}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">{t.categoryPlaceholder}</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && (
                                <p className="text-sm text-red-500">{errors.category_id}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateOpen(false)}
                                disabled={submitting}
                            >
                                {t.cancel}
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
                            <label htmlFor="edit-subcategory-name" className="text-sm font-medium">
                                {t.subcategoryName}
                            </label>
                            <Input
                                id="edit-subcategory-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                maxLength={100}
                                autoFocus
                                disabled={submitting}
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="edit-subcategory-category" className="text-sm font-medium">
                                {t.category}
                            </label>
                            <select
                                id="edit-subcategory-category"
                                value={categoryId}
                                onChange={(event) => setCategoryId(event.target.value)}
                                disabled={submitting}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">{t.categoryPlaceholder}</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && (
                                <p className="text-sm text-red-500">{errors.category_id}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditItem(null)}
                                disabled={submitting}
                            >
                                {t.cancel}
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? t.updating : t.update}
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
                            <p><strong>{t.id}:</strong> {viewItem.id}</p>
                            <p><strong>{t.name}:</strong> {viewItem.name}</p>
                            <p><strong>{t.category}:</strong> {viewItem.category?.name ?? t.none}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.deleteTooltip}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteItem ? `${t.delete} "${deleteItem.name}"?` : ""}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>{t.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {t.delete}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
