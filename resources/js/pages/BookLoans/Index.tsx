"use client";

import DataTable from "@/components/DataTable";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import createTranslations from "@/utils/translations/bookloan/bookloansCreateTranslations";
import editTranslations from "@/utils/translations/bookloan/bookloansEditTranslations";
import showTranslations from "@/utils/translations/bookloan/bookloanShowTranslations";
import translations from "@/utils/translations/bookloan/bookloansTranslations";
import { JsonRequestError, requestJson } from "@/utils/request-json";
import { Link } from "@inertiajs/react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, CheckCircleIcon, ClockIcon, Pencil, Search, Trash2, XCircleIcon } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type LoanStatus = "processing" | "returned" | "canceled";

interface User {
    id: number;
    name: string;
}

interface Book {
    id: number;
    title: string;
}

interface BookLoan {
    id: number;
    return_date: string | null;
    returned_at: string | null;
    book_id: number | null;
    user_id: number;
    created_at: string;
    updated_at: string;
    status: LoanStatus;
    books?: Book[];
    book: Book | null;
    user: User | null;
}

interface FlashProps {
    message?: string;
    error?: string;
    type?: "success" | "error";
}

interface BookLoansIndexProps {
    bookloans?: BookLoan[] | null;
    books?: Book[];
    users?: User[];
    statuses?: LoanStatus[];
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

interface LoanFormErrors {
    return_date?: string;
    book_ids?: string;
    user_id?: string;
    status?: string;
}

const resolveFlash = (flash?: FlashProps) => {
    if (flash?.type && flash.message) return { message: flash.message, type: flash.type };
    if (flash?.error) return { message: flash.error, type: "error" as const };
    if (flash?.message) return { message: flash.message, type: "success" as const };
    return undefined;
};

const getLoanBooks = (loan: BookLoan): Book[] => {
    if (loan.books && loan.books.length > 0) return loan.books;
    if (loan.book) return [loan.book];
    return [];
};

const getLoanBookSummary = (loan: BookLoan, fallback: string): string => {
    const books = getLoanBooks(loan);
    if (books.length === 0) return fallback;
    if (books.length === 1) return books[0].title;
    return `${books[0].title} +${books.length - 1}`;
};

const getStatusLabel = (t: typeof translations.kh, status: LoanStatus) =>
    status === "processing" ? t.statusProcessing : status === "returned" ? t.statusReturned : t.statusCanceled;

const getStatusIcon = (status: LoanStatus) =>
    status === "processing"
        ? <ClockIcon className="h-4 w-4 text-yellow-500 dark:text-yellow-300" />
        : status === "returned"
            ? <CheckCircleIcon className="h-4 w-4 text-green-500 dark:text-green-300" />
            : <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-300" />;

const getColumns = (
    t: typeof translations.kh,
    onEdit: (item: BookLoan) => void,
    onDelete: (item: BookLoan) => void,
): ColumnDef<BookLoan>[] => {
    const sortHeader = (label: string) => ({ column }: { column: { toggleSorting: (desc: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) => (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-indigo-600 dark:text-indigo-300"
        >
            {label}
            {{
                asc: <ArrowUp className="ml-2 h-4 w-4" />,
                desc: <ArrowDown className="ml-2 h-4 w-4" />,
            }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
        </Button>
    );

    return [
        {
            id: "actions",
            enableHiding: false,
            enableGlobalFilter: false,
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={(e) => { e.stopPropagation(); onDelete(row.original); }}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
        {
            accessorKey: "id",
            header: sortHeader(t.id),
            cell: ({ row }) => <span className="px-3 text-sm">{row.original.id}</span>,
        },
        {
            accessorKey: "return_date",
            header: sortHeader(t.returnDate),
            cell: ({ row }) => <span className="px-3 text-sm">{row.original.return_date ?? t.none}</span>,
        },
        {
            id: "books",
            accessorFn: (row) => getLoanBookSummary(row, t.none),
            header: sortHeader(t.book),
            cell: ({ row }) => {
                const book = getLoanBooks(row.original)[0];
                if (!book) return <span className="px-3 text-sm text-muted-foreground">{t.none}</span>;
                return (
                    <Link href={route("books.show", book.id)} onClick={(e) => e.stopPropagation()} className="px-3 text-sm text-indigo-600 hover:underline dark:text-indigo-300">
                        {getLoanBookSummary(row.original, t.none)}
                    </Link>
                );
            },
        },
        {
            id: "loaner",
            accessorFn: (row) => row.user?.name ?? t.none,
            header: sortHeader(t.loaner),
            cell: ({ row }) => row.original.user ? (
                <Link href={route("users.show", row.original.user.id)} onClick={(e) => e.stopPropagation()} className="px-3 text-sm text-indigo-600 hover:underline dark:text-indigo-300">
                    {row.original.user.name}
                </Link>
            ) : <span className="px-3 text-sm text-muted-foreground">{t.none}</span>,
        },
        {
            accessorKey: "status",
            header: sortHeader(t.status),
            cell: ({ row }) => (
                <div className="flex items-center gap-2 px-3 text-sm">
                    {getStatusIcon(row.original.status)}
                    <span>{getStatusLabel(t, row.original.status)}</span>
                </div>
            ),
        },
    ];
};

export default function BookLoansIndex({
    bookloans = [],
    books = [],
    users = [],
    statuses = ["processing", "returned", "canceled"],
    flash,
    lang = "kh",
}: BookLoansIndexProps) {
    const t = translations[lang];
    const createT = createTranslations[lang];
    const editT = editTranslations[lang];
    const showT = showTranslations[lang];
    const clearSelectedLabel = lang === "kh" ? "សម្អាតការជ្រើសរើស" : "Clear selected";
    const [rows, setRows] = useState<BookLoan[]>(bookloans ?? []);
    const [flashState, setFlashState] = useState(resolveFlash(flash));

    const [viewItem, setViewItem] = useState<BookLoan | null>(null);
    const [editItem, setEditItem] = useState<BookLoan | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState<BookLoan | null>(null);

    const [returnDate, setReturnDate] = useState("");
    const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
    const [userId, setUserId] = useState("");
    const [status, setStatus] = useState<LoanStatus>("processing");
    const [bookSearch, setBookSearch] = useState("");
    const [loanerSearch, setLoanerSearch] = useState("");
    const [errors, setErrors] = useState<LoanFormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const handledQueryRef = useRef(false);

    useEffect(() => { setRows(bookloans ?? []); }, [bookloans]);

    const resetForm = () => {
        setReturnDate("");
        setSelectedBookIds([]);
        setUserId("");
        setStatus("processing");
        setBookSearch("");
        setLoanerSearch("");
        setErrors({});
    };

    const openCreateDialog = () => { resetForm(); setCreateOpen(true); };
    const openEditDialog = (item: BookLoan) => {
        setEditItem(item);
        setReturnDate(item.return_date ?? "");
        setSelectedBookIds(getLoanBooks(item).map((book) => String(book.id)));
        setUserId(String(item.user_id));
        setStatus(item.status);
        setBookSearch("");
        setLoanerSearch("");
        setErrors({});
    };

    useEffect(() => {
        if (handledQueryRef.current || typeof window === "undefined") return;

        handledQueryRef.current = true;
        const params = new URLSearchParams(window.location.search);
        const dialog = params.get("dialog");
        const id = Number(params.get("id") ?? 0);

        if (dialog === "create") {
            setReturnDate("");
            setSelectedBookIds([]);
            setUserId("");
            setStatus("processing");
            setBookSearch("");
            setLoanerSearch("");
            setErrors({});
            setCreateOpen(true);
            window.history.replaceState({}, "", route("bookloans.index"));
            return;
        }

        if ((dialog === "edit" || dialog === "view") && id) {
            const target = rows.find((item) => item.id === id);
            if (target) {
                if (dialog === "edit") {
                    setEditItem(target);
                    setReturnDate(target.return_date ?? "");
                    setSelectedBookIds(getLoanBooks(target).map((book) => String(book.id)));
                    setUserId(String(target.user_id));
                    setStatus(target.status);
                    setBookSearch("");
                    setLoanerSearch("");
                    setErrors({});
                } else {
                    setViewItem(target);
                }
            }
            window.history.replaceState({}, "", route("bookloans.index"));
        }
    }, [rows]);

    const applyValidationErrors = (error: JsonRequestError) => {
        const bookError = Object.entries(error.errors ?? {})
            .filter(([key]) => key === "book_ids" || key.startsWith("book_ids."))
            .flatMap(([, value]) => value)
            .at(0);
        setErrors({
            return_date: error.errors?.return_date?.[0],
            user_id: error.errors?.user_id?.[0],
            status: error.errors?.status?.[0],
            book_ids: bookError,
        });
    };

    const submitLoan = async (mode: "create" | "edit", event: FormEvent) => {
        event.preventDefault();
        if (mode === "edit" && !editItem) return;
        setSubmitting(true);
        setErrors({});
        try {
            const response = await requestJson<ApiDataResponse<BookLoan>>(
                mode === "create" ? route("bookloans.store") : route("bookloans.update", editItem!.id),
                {
                    method: mode === "create" ? "POST" : "PUT",
                    body: {
                        return_date: returnDate,
                        book_ids: selectedBookIds.map((id) => Number(id)),
                        user_id: userId ? Number(userId) : null,
                        status: mode === "create" ? "processing" : status,
                    },
                },
            );
            setRows((current) => mode === "create" ? [response.data, ...current] : current.map((item) => item.id === response.data.id ? response.data : item));
            if (mode === "create") {
                setCreateOpen(false);
            } else {
                setEditItem(null);
            }
            resetForm();
            setFlashState({ message: response.message, type: "success" });
        } catch (error) {
            if (error instanceof JsonRequestError) {
                applyValidationErrors(error);
                setFlashState({ message: error.message, type: "error" });
            } else {
                setFlashState({ message: mode === "create" ? createT.error : editT.error, type: "error" });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteItem) return;
        setDeleting(true);
        try {
            const response = await requestJson<ApiMessageResponse>(route("bookloans.destroy", deleteItem.id), { method: "DELETE" });
            setRows((current) => current.filter((item) => item.id !== deleteItem.id));
            setDeleteItem(null);
            setFlashState({ message: response.message, type: "success" });
        } catch (error) {
            setFlashState({ message: error instanceof JsonRequestError ? error.message : t.deleteDialogTitle, type: "error" });
        } finally {
            setDeleting(false);
        }
    };

    const mergedBooks = useMemo(() => {
        const map = new Map<number, Book>();
        books.forEach((book) => map.set(book.id, { id: book.id, title: book.title }));
        if (editItem) getLoanBooks(editItem).forEach((book) => map.set(book.id, { id: book.id, title: book.title }));
        return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
    }, [books, editItem]);

    const filteredBooks = useMemo(() => {
        const query = bookSearch.trim().toLowerCase();
        if (!query) return mergedBooks;
        return mergedBooks.filter((book) => book.title.toLowerCase().includes(query));
    }, [mergedBooks, bookSearch]);

    const filteredUsers = useMemo(() => {
        const query = loanerSearch.trim().toLowerCase();
        if (!query) return users;

        const matched = users.filter((user) => user.name.toLowerCase().includes(query));
        if (userId && !matched.some((user) => String(user.id) === userId)) {
            const selectedUser = users.find((user) => String(user.id) === userId);
            if (selectedUser) {
                return [selectedUser, ...matched];
            }
        }

        return matched;
    }, [users, loanerSearch, userId]);

    const selectedBooksLabel = useMemo(() => {
        const titles = mergedBooks.filter((book) => selectedBookIds.includes(String(book.id))).map((book) => book.title);
        if (titles.length === 0) return createT.bookPlaceholder;
        if (titles.length === 1) return titles[0];
        return `${titles[0]} +${titles.length - 1}`;
    }, [mergedBooks, selectedBookIds, createT.bookPlaceholder]);

    const selectedLoanerLabel = useMemo(() => {
        const selected = users.find((user) => String(user.id) === userId);
        return selected?.name ?? (editItem ? editT.loanerPlaceholder : createT.loanerPlaceholder);
    }, [users, userId, editItem, editT.loanerPlaceholder, createT.loanerPlaceholder]);

    const toggleBook = (id: string) => {
        setSelectedBookIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    };

    const columns = useMemo(() => getColumns(t, openEditDialog, setDeleteItem), [t]);
    const breadcrumbs = [{ title: t.title, href: route("bookloans.index") }];
    const globalFilterFn = (row: Row<BookLoan>, _columnId: string, filter: string) => {
        const search = String(filter).toLowerCase().trim();
        if (!search) return true;
        const loan = row.original;
        return String(loan.id).includes(search)
            || String(loan.return_date ?? t.none).toLowerCase().includes(search)
            || getLoanBookSummary(loan, t.none).toLowerCase().includes(search)
            || String(loan.user?.name ?? t.none).toLowerCase().includes(search)
            || getStatusLabel(t, loan.status).toLowerCase().includes(search);
    };

    return (
        <>
            <DataTable
                data={rows}
                columns={columns}
                breadcrumbs={breadcrumbs}
                title={t.title}
                resourceName={t.title}
                routes={{ index: route("bookloans.index"), create: route("bookloans.create"), show: (id) => route("bookloans.show", id), edit: (id) => route("bookloans.edit", id), destroy: (id) => route("bookloans.destroy", id), export: route("bookloans.export"), import: route("bookloans.import") }}
                flash={flashState}
                onCreate={openCreateDialog}
                enableRowModal={false}
                onRowClick={setViewItem}
                globalFilterFn={globalFilterFn}
            />

            <Dialog open={createOpen || !!editItem} onOpenChange={(open) => !open && (setCreateOpen(false), setEditItem(null))}>
                <DialogContent className="max-h-[82vh] overflow-y-auto max-w-[calc(100%-1.5rem)] sm:max-w-lg lg:max-h-[98vh] lg:max-w-lg">
                    <DialogHeader><DialogTitle>{editItem ? editT.title : createT.title}</DialogTitle></DialogHeader>
                    <form onSubmit={(event) => submitLoan(editItem ? "edit" : "create", event)} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="bookloan-return-date" className="text-sm font-medium">{editItem ? editT.returnDate : createT.returnDate}</label>
                            <Input id="bookloan-return-date" type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} disabled={submitting} />
                            {errors.return_date && <p className="text-sm text-red-500">{errors.return_date}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="bookloan-book-search" className="text-sm font-medium">{editItem ? editT.book : createT.book}</label>
                            <div className="overflow-hidden rounded-md border border-input bg-background">
                                <div className="border-b border-input/60 p-2">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            id="bookloan-book-search"
                                            value={bookSearch}
                                            onChange={(event) => setBookSearch(event.target.value)}
                                            placeholder={editItem ? editT.bookPlaceholder : createT.bookPlaceholder}
                                            disabled={submitting}
                                            className="h-8 border-0 bg-transparent pl-8 text-sm shadow-none focus-visible:ring-0"
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{selectedBookIds.length} selected</span>
                                        {selectedBookIds.length > 0 && (
                                            <button
                                                type="button"
                                                className="text-indigo-600 hover:underline dark:text-indigo-300"
                                                onClick={() => setSelectedBookIds([])}
                                                disabled={submitting}
                                            >
                                                {clearSelectedLabel}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto p-2">
                                    {filteredBooks.length > 0 ? (
                                        <div className="space-y-1">
                                            {filteredBooks.map((book) => {
                                                const selected = selectedBookIds.includes(String(book.id));

                                                return (
                                                    <button
                                                        key={book.id}
                                                        type="button"
                                                        onClick={() => toggleBook(String(book.id))}
                                                        disabled={submitting}
                                                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                                                            selected
                                                                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200"
                                                                : "hover:bg-muted"
                                                        }`}
                                                    >
                                                        <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border ${selected ? "border-indigo-500 bg-indigo-500 text-white" : "border-input"}`}>
                                                            {selected && <Check className="h-3 w-3" />}
                                                        </span>
                                                        <span className="truncate">{book.title}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="py-3 text-sm text-muted-foreground">{editItem ? editT.bookEmpty : createT.bookEmpty}</p>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{selectedBooksLabel}</p>
                            {errors.book_ids && <p className="text-sm text-red-500">{errors.book_ids}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="bookloan-user" className="text-sm font-medium">{editItem ? editT.loaner : createT.loaner}</label>
                            <div className="overflow-hidden rounded-md border border-input bg-background">
                                <div className="border-b border-input/60 p-2">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            id="bookloan-user-search"
                                            value={loanerSearch}
                                            onChange={(event) => setLoanerSearch(event.target.value)}
                                            placeholder={editItem ? editT.loanerPlaceholder : createT.loanerPlaceholder}
                                            disabled={submitting}
                                            className="h-8 border-0 bg-transparent pl-8 text-sm shadow-none focus-visible:ring-0"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto p-2">
                                    <div className="space-y-1">
                                        <button
                                            type="button"
                                            onClick={() => setUserId("")}
                                            disabled={submitting}
                                            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                                                userId === ""
                                                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200"
                                                    : "hover:bg-muted"
                                            }`}
                                        >
                                            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${userId === "" ? "border-indigo-500 bg-indigo-500 text-white" : "border-input"}`}>
                                                {userId === "" && <Check className="h-3 w-3" />}
                                            </span>
                                            <span>{editItem ? editT.loanerPlaceholder : createT.loanerPlaceholder}</span>
                                        </button>
                                        {filteredUsers.map((user) => {
                                            const selected = String(user.id) === userId;

                                            return (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => setUserId(String(user.id))}
                                                    disabled={submitting}
                                                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                                                        selected
                                                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200"
                                                            : "hover:bg-muted"
                                                    }`}
                                                >
                                                    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${selected ? "border-indigo-500 bg-indigo-500 text-white" : "border-input"}`}>
                                                        {selected && <Check className="h-3 w-3" />}
                                                    </span>
                                                    <span className="truncate">{user.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {filteredUsers.length === 0 && (
                                        <p className="pt-3 text-sm text-muted-foreground">{editItem ? editT.loanerEmpty : createT.loanerEmpty}</p>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{selectedLoanerLabel}</p>
                            {errors.user_id && <p className="text-sm text-red-500">{errors.user_id}</p>}
                        </div>
                        {editItem && (
                            <div className="space-y-2">
                                <label htmlFor="bookloan-status" className="text-sm font-medium">{editT.status}</label>
                                <select id="bookloan-status" value={status} onChange={(event) => setStatus(event.target.value as LoanStatus)} disabled={submitting} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    {statuses.map((statusValue) => <option key={statusValue} value={statusValue}>{getStatusLabel(t, statusValue)}</option>)}
                                </select>
                                {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); setEditItem(null); }} disabled={submitting}>{editItem ? editT.cancel : createT.cancel}</Button>
                            <Button type="submit" disabled={submitting}>{editItem ? (submitting ? editT.updating : editT.update) : (submitting ? createT.creating : createT.create)}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
                <DialogContent className="max-h-[78vh] overflow-y-auto max-w-[calc(100%-1.5rem)] sm:max-w-md lg:max-h-[72vh] lg:max-w-md">
                    <DialogHeader><DialogTitle>{showT.title}</DialogTitle></DialogHeader>
                    {viewItem && (
                        <div className="space-y-3 text-sm">
                            <p><strong>{showT.id}:</strong> {viewItem.id}</p>
                            <p><strong>{showT.returnDate}:</strong> {viewItem.return_date ?? showT.na}</p>
                            <p><strong>{showT.returnedAt ?? t.returned_at}:</strong> {viewItem.returned_at ?? showT.na}</p>
                            <p><strong>{showT.status}:</strong> {getStatusLabel(t, viewItem.status)}</p>
                            <div>
                                <strong>{showT.book}:</strong>
                                {getLoanBooks(viewItem).length > 0 ? (
                                    <ul className="mt-2 list-inside list-disc space-y-1">
                                        {getLoanBooks(viewItem).map((book) => (
                                            <li key={book.id}>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link
                                                                href={route("books.show", book.id)}
                                                                className="text-indigo-600 hover:underline dark:text-indigo-300"
                                                            >
                                                                {book.title}
                                                            </Link>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="max-w-xs p-0 shadow-lg">
                                                            <Card className="border-indigo-200 bg-white dark:border-indigo-600 dark:bg-gray-800">
                                                                <CardContent className="p-3 text-sm">
                                                                    <p className="font-medium text-indigo-600 dark:text-indigo-300">{book.title}</p>
                                                                    <p className="mt-1 text-xs text-muted-foreground">{showT.bookTooltip}</p>
                                                                </CardContent>
                                                            </Card>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-1 text-muted-foreground">{showT.na}</p>
                                )}
                            </div>
                            <p>
                                <strong>{showT.loaner}:</strong>{" "}
                                {viewItem.user ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href={route("users.show", viewItem.user.id)}
                                                    className="text-indigo-600 hover:underline dark:text-indigo-300"
                                                >
                                                    {viewItem.user.name}
                                                </Link>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs p-0 shadow-lg">
                                                <Card className="border-indigo-200 bg-white dark:border-indigo-600 dark:bg-gray-800">
                                                    <CardContent className="p-3 text-sm">
                                                        <p className="font-medium text-indigo-600 dark:text-indigo-300">{viewItem.user.name}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">{showT.loanerTooltip}</p>
                                                    </CardContent>
                                                </Card>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : (
                                    showT.na
                                )}
                            </p>
                            <p><strong>{showT.createdAt}:</strong> {new Date(viewItem.created_at).toLocaleString()}</p>
                            <p><strong>{showT.lastModified}:</strong> {new Date(viewItem.updated_at).toLocaleString()}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.deleteDialogTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{deleteItem ? t.deleteDialogDescription(getLoanBookSummary(deleteItem, t.none), deleteItem.user?.name ?? "") : ""}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>{t.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">{t.confirmDelete}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
