"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Toast from "@/components/Toast";
import { Link, router, useForm } from "@inertiajs/react";
import echo from "@/lib/echo";
import {
    EyeIcon,
    PencilIcon,
    TrashIcon,
    MoreHorizontal,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    Filter,
    CheckIcon,
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import DataTable from '@/components/DataTable';
import translations from '@/utils/translations/bookloan/bookloansTranslations';

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
    book_id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    status: 'processing' | 'returned' | 'canceled';
    book: Book | null;
    user: User | null;
}

interface LoanRequest {
    id: number;
    book_id: number;
    book_title: string | null;
    requester_id: number;
    requester_name: string | null;
    status: "pending" | "approved" | "rejected";
    canceled_by_requester?: boolean;
    created_at: string | null;
}

interface BookLoansProps {
    bookloans?: BookLoan[] | null;
    loanRequests?: LoanRequest[] | null;
    books?: Book[];
    users?: User[];
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
    setBookLoanToDelete: React.Dispatch<React.SetStateAction<BookLoan | null>>,
    setRowModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setSelectedRow: React.Dispatch<React.SetStateAction<BookLoan | null>>,
    setDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
): ColumnDef<BookLoan>[] => [
    {
        id: "actions",
        enableHiding: false,
        enableGlobalFilter: false,
        enableSorting: false,
        cell: ({ row }) => {
            const bookLoan = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className={`${commonStyles.button} h-8 w-8 p-0 text-indigo-600 dark:text-indigo-300`}
                            disabled={processing}
                            aria-label={`Open menu for book loan ${bookLoan.id}`}
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
                                                href={route("bookloans.show", bookLoan.id)}
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
                                                href={route("bookloans.edit", bookLoan.id)}
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
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setBookLoanToDelete(bookLoan);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Button
                                                variant="ghost"
                                                className="h-4 w-4 p-0"
                                                disabled={processing}
                                            >
                                                <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-300" />
                                            </Button>
                                        </DropdownMenuItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" align="center" className={commonStyles.tooltipBg}>
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
                {t.id}
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
                aria-label={`View details for book loan ${row.getValue("id")}`}
            >
                {row.getValue("id")}
            </button>
        ),
        filterFn: (row, id, value) => String(row.getValue(id)).includes(String(value)),
    },
    {
        accessorKey: "return_date",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
            >
                {t.returnDate}
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
                aria-label={`View details for book loan with return date ${row.getValue("return_date") || t.none}`}
            >
                {row.getValue("return_date") || t.none}
            </button>
        ),
        filterFn: (row, id, value) =>
            String(row.getValue(id) || t.none).toLowerCase().includes(String(value).toLowerCase()),
    },
    {
        accessorKey: "book",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
            >
                {t.book}
                {{
                    asc: <ArrowUp className="ml-2 h-4 w-4" />,
                    desc: <ArrowDown className="ml-2 h-4 w-4" />,
                }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
        ),
        cell: ({ row }) => {
            const book = row.original.book;
            return (
                <button
                    className={`${commonStyles.text} px-0 cursor-pointer`}
                    onClick={() => {
                        setRowModalOpen(true);
                        setSelectedRow(row.original);
                    }}
                    role="button"
                    aria-label={
                        book
                            ? `View details for book loan with book ${book.title}`
                            : `View details for book loan with no book`
                    }
                >
                    {book ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={route("books.show", book.id)}
                                        className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-400 underline text-sm"
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label={`Maps to book ${book.title} at route /books/${book.id}`}
                                    >
                                        {book.title}
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent className={commonStyles.tooltipBg}>
                                    {t.bookLinkTooltip(book.id)}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <span className="text-red-500 dark:text-red-400 text-sm">{t.none}</span>
                    )}
                </button>
            );
        },
        filterFn: (row, _id, value) =>
            (row.original.book?.title || t.none).toLowerCase().includes(String(value).toLowerCase()),
        sortingFn: (rowA, rowB) =>
            (rowA.original.book?.title || t.none).localeCompare(rowB.original.book?.title || t.none),
    },
    {
        accessorKey: "user",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
            >
                {t.loaner}
                {{
                    asc: <ArrowUp className="ml-2 h-4 w-4" />,
                    desc: <ArrowDown className="ml-2 h-4 w-4" />,
                }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
        ),
        cell: ({ row }) => {
            const user = row.original.user;
            return (
                <button
                    className={`${commonStyles.text} px-0 cursor-pointer`}
                    onClick={() => {
                        setRowModalOpen(true);
                        setSelectedRow(row.original);
                    }}
                    role="button"
                    aria-label={
                        user
                            ? `View details for book loan with user ${user.name}`
                            : `View details for book loan with no user`
                    }
                >
                    {user ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={route("users.show", user.id)}
                                        className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-400 underline text-sm"
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label={`Maps to user ${user.name} at route /users/${user.id}`}
                                    >
                                        {user.name}
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent className={commonStyles.tooltipBg}>
                                    {t.userLinkTooltip(user.id)}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <span className="text-red-500 dark:text-red-400 text-sm">{t.none}</span>
                    )}
                </button>
            );
        },
        filterFn: (row, _id, value) =>
            (row.original.user?.name || t.none).toLowerCase().includes(String(value).toLowerCase()),
        sortingFn: (rowA, rowB) =>
            (rowA.original.user?.name || t.none).localeCompare(rowB.original.user?.name || t.none),
    },
    {
        accessorKey: "returned_at",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
            >
                {t.returned_at}
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
                aria-label={`View details for book loan with returned at ${row.getValue("returned_at") || t.none}`}
            >
                {row.getValue("returned_at") || t.none}
            </button>
        ),
        filterFn: (row, id, value) =>
            String(row.getValue(id) || t.none).toLowerCase().includes(String(value).toLowerCase()),
    },
    {
        accessorKey: "status",
        header: ({ column }) => {
            const statusOptions = [
                { value: "all", label: t.statusAll, icon: null },
                { value: "processing", label: t.statusProcessing, icon: <ClockIcon className="h-4 w-4 text-yellow-500 dark:text-yellow-300" /> },
                { value: "returned", label: t.statusReturned, icon: <CheckCircleIcon className="h-4 w-4 text-green-500 dark:text-green-300" /> },
                { value: "canceled", label: t.statusCanceled, icon: <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-300" /> },
            ];
            const selectedOption = statusOptions.find(opt => opt.value === (column.getFilterValue() || "all")) || statusOptions[0];
            return (
                <Popover>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300 flex items-center gap-2`}
                                        aria-label={`Filter by status, currently ${selectedOption.label}`}
                                    >
                                        {t.status}
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent className={commonStyles.tooltipBg}>
                                {t.statusPlaceholder}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <PopoverContent className={`${commonStyles.gradientBg} w-48 p-0`} align="start" sideOffset={2}>
                        <Command>
                            <CommandList>
                                <CommandEmpty>{t.statusEmpty}</CommandEmpty>
                                <CommandGroup>
                                    {statusOptions.map((option) => (
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
            const status = row.getValue("status") as BookLoan["status"];
            const statusOptions = [
                { value: "processing", label: t.statusProcessing, icon: <ClockIcon className="h-4 w-4 text-yellow-500 dark:text-yellow-300" /> },
                { value: "returned", label: t.statusReturned, icon: <CheckCircleIcon className="h-4 w-4 text-green-500 dark:text-green-300" /> },
                { value: "canceled", label: t.statusCanceled, icon: <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-300" /> },
            ];
            const { icon, label } = statusOptions.find(opt => opt.value === status) || { icon: null, label: t.none };
            return (
                <button
                    className={`${commonStyles.text} flex items-center gap-2 px-0 cursor-pointer`}
                    onClick={() => {
                        setRowModalOpen(true);
                        setSelectedRow(row.original);
                    }}
                    role="button"
                    aria-label={`View details for book loan with status ${label}`}
                >
                    {icon}
                    <span>{label}</span>
                </button>
            );
        },
        filterFn: (row, id, value) => {
            if (!value || value === "all") return true;
            return row.getValue(id) === value;
        },
        enableSorting: false,
    },
    {
        accessorKey: "created_at",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
            >
                {t.createdAt}
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
                aria-label={`View details for book loan created at ${new Date(row.getValue("created_at")).toLocaleString()}`}
            >
                {new Date(row.getValue("created_at")).toLocaleString()}
            </button>
        ),
        filterFn: (row, id, value) =>
            new Date(row.getValue(id)).toLocaleString().toLowerCase().includes(String(value).toLowerCase()),
        sortingFn: (rowA, rowB) =>
            new Date(rowA.getValue("created_at")).getTime() - new Date(rowB.getValue("created_at")).getTime(),
    },
    {
        accessorKey: "updated_at",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className={`${commonStyles.button} text-indigo-600 dark:text-indigo-300`}
            >
                {t.updatedAt}
                {{
                    asc: <ArrowUp className="ml-2 h-4 w-4" />,
                    desc: <ArrowDown className="ml-2 h-4 w-4" />,
                }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
        ),
        cell: ({ row }) => (
            <button
                className={`${commonStyles.text} px-2 cursor-pointer`}
                onClick={() => {
                    setRowModalOpen(true);
                    setSelectedRow(row.original);
                }}
                role="button"
                aria-label={`View details for book loan updated at ${new Date(row.getValue("updated_at")).toLocaleString()}`}
            >
                {new Date(row.getValue("updated_at")).toLocaleString()}
            </button>
        ),
        filterFn: (row, id, value) =>
            new Date(row.getValue(id)).toLocaleString().toLowerCase().includes(String(value).toLowerCase()),
        sortingFn: (rowA, rowB) =>
            new Date(rowA.getValue("updated_at")).getTime() - new Date(rowB.getValue("updated_at")).getTime(),
    },
];

export default function BookLoans({ bookloans = [], loanRequests = [], flash, lang = "kh" }: BookLoansProps) {
    const t = translations[lang];
    const { processing, delete: destroy } = useForm();
    const [bookLoanToDelete, setBookLoanToDelete] = useState<BookLoan | null>(null);
    const [, setRowModalOpen] = useState(false);
    const [, setSelectedRow] = useState<BookLoan | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bookLoanRows, setBookLoanRows] = useState<BookLoan[]>(bookloans || []);
    const [pendingLoanRequests, setPendingLoanRequests] = useState<LoanRequest[]>(loanRequests || []);
    const [decisionProcessingRequestId, setDecisionProcessingRequestId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ show: boolean; message: string; type?: "success" | "error" | "info" }>({ show: false, message: "" });
    const lastLocallyDecidedRequestIdRef = useRef<number | null>(null);

    const columns = useMemo(
        () => getColumns(t, processing, setBookLoanToDelete, setRowModalOpen, setSelectedRow, setDeleteDialogOpen),
        [t, processing]
    );

    useEffect(() => {
        setBookLoanRows(bookloans || []);
    }, [bookloans]);

    useEffect(() => {
        setPendingLoanRequests(loanRequests || []);
    }, [loanRequests]);

    useEffect(() => {
        const echoInstance = echo;
        if (!echoInstance) {
            return;
        }

        const adminChannelName = "admin.book-loan-requests";
        const channel = echoInstance.private(adminChannelName);

        const handleCreatedEvent = (event: { loanRequest?: LoanRequest }) => {
            if (!event.loanRequest) {
                return;
            }

            setPendingLoanRequests((currentRequests) => {
                if (currentRequests.some((requestItem) => requestItem.id === event.loanRequest?.id)) {
                    return currentRequests;
                }

                return [event.loanRequest as LoanRequest, ...currentRequests];
            });
        };

        const handleUpdatedEvent = (event: { loanRequest?: LoanRequest }) => {
            if (!event.loanRequest?.id) {
                return;
            }

            if (lastLocallyDecidedRequestIdRef.current === event.loanRequest.id) {
                lastLocallyDecidedRequestIdRef.current = null;
            } else if (event.loanRequest.status === "approved") {
                setToast({
                    show: true,
                    message: `${event.loanRequest.requester_name || "User"} បានអនុម័តសំណើរ`,
                    type: "success",
                });
            } else if (event.loanRequest.status === "rejected") {
                setToast({
                    show: true,
                    message: event.loanRequest.canceled_by_requester
                        ? `${event.loanRequest.requester_name || "User"} បានបោះបង់សំណើរ`
                        : `${event.loanRequest.requester_name || "User"} request rejected.`,
                    type: event.loanRequest.canceled_by_requester ? "info" : "error",
                });
            }

            setPendingLoanRequests((currentRequests) => currentRequests.filter((requestItem) => requestItem.id !== event.loanRequest?.id));
        };

        channel.listen(".book-loan-request.created", handleCreatedEvent);
        channel.listen(".book-loan-request.updated", handleUpdatedEvent);

        return () => {
            channel.stopListening(".book-loan-request.created");
            channel.stopListening(".book-loan-request.updated");
            echoInstance.leave(adminChannelName);
        };
    }, []);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            if (decisionProcessingRequestId !== null || processing) {
                return;
            }

            router.reload({
                only: ["bookloans", "loanRequests"],
                preserveScroll: true,
                preserveState: true,
            });
        }, 1500);

        return () => window.clearInterval(intervalId);
    }, [decisionProcessingRequestId, processing]);

    const globalFilterFn = (row: Row<BookLoan>, columnId: string, filterValue: string) => {
        const search = String(filterValue).toLowerCase().trim();
        if (!search) return true;
        const bookLoan = row.original;
        return (
            String(bookLoan.id).includes(search) ||
            (bookLoan.return_date || t.none).toLowerCase().includes(search) ||
            (bookLoan.book?.title || t.none).toLowerCase().includes(search) ||
            (bookLoan.user?.name || t.none).toLowerCase().includes(search) ||
            new Date(bookLoan.created_at).toLocaleString().toLowerCase().includes(search) ||
            new Date(bookLoan.updated_at).toLocaleString().toLowerCase().includes(search) ||
            (bookLoan.status === "processing" ? t.statusProcessing :
             bookLoan.status === "returned" ? t.statusReturned :
             bookLoan.status === "canceled" ? t.statusCanceled : t.none).toLowerCase().includes(search)
        );
    };

    const modalFields = (item: BookLoan) => (
        <>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.book}:</strong>{" "}
                {item.book ? (
                    <Link
                        href={route("books.show", item.book.id)}
                        className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-400 underline text-sm"
                        aria-label={`Maps to book ${item.book.title} at route /books/${item.book.id}`}
                    >
                        {item.book.title}
                    </Link>
                ) : (
                    t.none
                )}
            </p>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.loaner}:</strong>{" "}
                {item.user ? (
                    <Link
                        href={route("users.show", item.user.id)}
                        className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-400 underline text-sm"
                        aria-label={`Maps to user ${item.user.name} at route /users/${item.user.id}`}
                    >
                        {item.user.name}
                    </Link>
                ) : (
                    t.none
                )}
            </p>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.returnDate}:</strong>{" "}
                {item.return_date || t.none}
            </p>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.returnedAt || "Returned At"}:</strong>{" "}
                {item.returned_at || t.none}
            </p>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.createdAt}:</strong>{" "}
                {new Date(item.created_at).toLocaleString()}
            </p>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.updatedAt}:</strong>{" "}
                {new Date(item.updated_at).toLocaleString()}
            </p>
            <p>
                <strong className="font-semibold text-indigo-500 dark:text-indigo-300">{t.status}:</strong>{" "}
                {item.status === "processing" ? t.statusProcessing :
                 item.status === "returned" ? t.statusReturned :
                 item.status === "canceled" ? t.statusCanceled : t.none}
            </p>
        </>
    );

    const tooltipFields = (item: BookLoan) => (
        <>
            <p>
                <strong className="text-indigo-200">{t.id}:</strong> {item.id}
            </p>
            <p>
                <strong className="text-indigo-200">{t.book}:</strong> {item.book?.title || t.none}
            </p>
            <p>
                <strong className="text-indigo-200">{t.loaner}:</strong> {item.user?.name || t.none}
            </p>
            <p>
                <strong className="text-indigo-200">{t.returnDate}:</strong> {item.return_date || t.none}
            </p>
            <p>
                <strong className="text-indigo-200">{t.returnedAt || "Returned At"}:</strong> {item.returned_at || t.none}
            </p>
            <p>
                <strong className="text-indigo-200">{t.createdAt}:</strong>{" "}
                {new Date(item.created_at).toLocaleString()}
            </p>
            <p>
                <strong className="text-indigo-200">{t.updatedAt}:</strong>{" "}
                {new Date(item.updated_at).toLocaleString()}
            </p>
            <p>
                <strong className="text-indigo-200">{t.status}:</strong>{" "}
                {item.status === "processing" ? t.statusProcessing :
                 item.status === "returned" ? t.statusReturned :
                 item.status === "canceled" ? t.statusCanceled : t.none}
            </p>
        </>
    );

    const handleDelete = () => {
        if (bookLoanToDelete) {
            destroy(route("bookloans.destroy", bookLoanToDelete.id), {
                onFinish: () => {
                    setDeleteDialogOpen(false);
                    setBookLoanToDelete(null);
                },
            });
        }
    };

    const handleLoanRequestDecision = async (loanRequest: LoanRequest, decision: "approved" | "rejected") => {
        if (decisionProcessingRequestId !== null) {
            return;
        }

        lastLocallyDecidedRequestIdRef.current = loanRequest.id;
        setDecisionProcessingRequestId(loanRequest.id);

        try {
            const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content") ?? "";

            const response = await fetch(route("bookloans.requests.decide", loanRequest.id), {
                method: "PATCH",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                    ...(echo?.socketId() ? { "X-Socket-Id": echo.socketId() as string } : {}),
                },
                body: JSON.stringify({ decision }),
            });

            const data = (await response.json()) as {
                message?: string;
                bookLoan?: BookLoan | null;
            };

            if (!response.ok) {
                throw new Error(data.message || "Unable to update the request.");
            }

            if (data.bookLoan) {
                setBookLoanRows((currentLoans) => {
                    if (currentLoans.some((bookLoan) => bookLoan.id === data.bookLoan?.id)) {
                        return currentLoans;
                    }

                    return [data.bookLoan as BookLoan, ...currentLoans];
                });
            }

            setToast({
                show: true,
                message: data.message || (decision === "approved" ? "Request approved." : "Request rejected."),
                type: decision === "approved" ? "success" : "error",
            });

            setPendingLoanRequests((currentRequests) => currentRequests.filter((requestItem) => requestItem.id !== loanRequest.id));
        } catch (error) {
            setToast({
                show: true,
                message: error instanceof Error ? error.message : "Unable to update the request.",
                type: "error",
            });
        } finally {
            setDecisionProcessingRequestId(null);
        }
    };

    const breadcrumbs = [
        { title: t.title, href: route("bookloans.index") },
    ];

    return (
        <>
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast((current) => ({ ...current, show: false }))}
            />
            <DataTable
                data={bookLoanRows || []}
                columns={columns}
                breadcrumbs={breadcrumbs}
                title={t.title}
                resourceName={t.title}
                routes={{
                    index: route("bookloans.index"),
                    create: route("bookloans.create"),
                    show: (id) => route("bookloans.show", id),
                    edit: (id) => route("bookloans.edit", id),
                    destroy: (id) => route("bookloans.destroy", id),
                    export: route("bookloans.export"),
                    import: route("bookloans.import"),
                }}
                flash={flash}
                modalFields={modalFields}
                tooltipFields={tooltipFields}
                isSuperLibrarian={false}
                globalFilterFn={globalFilterFn}
            />
            {pendingLoanRequests.length > 0 && (
                <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3">
                    {pendingLoanRequests.map((requestItem) => {
                        const isProcessing = decisionProcessingRequestId === requestItem.id;

                        return (
                            <div
                                key={requestItem.id}
                                className="pointer-events-auto rounded-xl border border-indigo-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-indigo-700 dark:bg-gray-900/95"
                            >
                                <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-100">
                                    <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                                        {requestItem.requester_name || "A user"}
                                    </span>{" "}
                                    បានស្នើរសុំខ្ចីសៀវភៅ ចំណងជើង{" "}
                                    <span className="font-semibold text-amber-600 dark:text-amber-300">
                                        {requestItem.book_title || "this book"}
                                    </span>
                                        {/* ។ តើអ្នកចង់អនុម័តឬបដិសេធសំណើនេះ? */}
                                </p>
                                <div className="mt-3 flex items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={commonStyles.outlineButton}
                                        onClick={() => handleLoanRequestDecision(requestItem, "rejected")}
                                        disabled={decisionProcessingRequestId !== null}
                                    >
                                        ទេ
                                    </Button>
                                    <Button
                                        type="button"
                                        className={commonStyles.indigoButton}
                                        onClick={() => handleLoanRequestDecision(requestItem, "approved")}
                                        disabled={decisionProcessingRequestId !== null}
                                    >
                                        {isProcessing ? "កំពុងដំណើរការ..." : "យល់ព្រម"}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className={commonStyles.gradientBg}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.deleteDialogTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t.deleteDialogDescription(
                                bookLoanToDelete?.book?.title || "",
                                bookLoanToDelete?.user?.name || ""
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            className={`${commonStyles.outlineButton} border`}
                            onClick={() => {
                                setBookLoanToDelete(null);
                                setDeleteDialogOpen(false);
                            }}
                        >
                            {t.cancel}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className={commonStyles.indigoButton}
                            onClick={handleDelete}
                            disabled={processing}
                        >
                            {t.confirmDelete}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
