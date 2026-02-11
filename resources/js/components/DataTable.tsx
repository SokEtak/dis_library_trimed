"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2Icon,
    Plus,
    ArrowLeft,
    ArrowRight,
    X,
    Columns2,
} from 'lucide-react';
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    VisibilityState,
    PaginationState,
    SortingState,
} from "@tanstack/react-table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Interface definitions remain the same
interface DataItem {
    id: number;
    code: string;
    [key: string]: any;
}

interface DataTableProps<T extends DataItem> {
    data: T[];
    columns: ColumnDef<T>[];
    breadcrumbs: BreadcrumbItem[];
    title: string;
    resourceName: string;
    routes: {
        index: string;
        create: string;
        show: (id: number) => string;
        edit: (id: number) => string;
        destroy?: (id: number) => string;
    };
    flash?: {
        message?: string;
        type?: "success" | "error";
    };
    modalFields?: (item: T) => JSX.Element;
    tooltipFields?: (item: T) => JSX.Element;
    isSuperLibrarian?: boolean;
}

// Re-introducing the common styles for the dynamic color theme
const commonStyles = {
    button: "rounded-lg text-sm transition-colors",
    text: "text-gray-800 dark:text-gray-100 text-sm",
    indigoButton:
        "bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700",
    outlineButton:
        "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-800",
    gradientBg: "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-indigo-900",
    tooltipBg: "bg-gradient-to-br from-blue-900 to-indigo-600 text-white rounded-xl", // Kept for consistency if you add tooltips back
};

function DataTable<T extends DataItem>({
    data = [],
    columns,
    breadcrumbs,
    title,
    resourceName,
    routes,
    flash,
    modalFields,
    isSuperLibrarian = false,
}: DataTableProps<T>) {
    const { processing } = useForm();
    const [itemToDelete, setItemToDelete] = useState<T | null>(null);
    const [showAlert, setShowAlert] = useState(!!flash?.message && !!flash?.type);
    const [isTableLoading, setIsTableLoading] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
        const initial: VisibilityState = {};

        columns.forEach((col) => {
            const id = col.id ?? col.accessorKey;

            // If no ID → skip
            if (!id) return;

            // If column cannot be hidden → always visible
            if (col.enableHiding === false) {
                initial[id] = true;
                return;
            }

            // USE defaultHidden ONLY IF PROVIDED
            if ("defaultHidden" in col && col.defaultHidden === true) {
                initial[id] = false; // hidden
            } else {
                initial[id] = true; // visible (same as before)
            }
        });

        return initial;
    });

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [globalFilter, setGlobalFilter] = useState("");
    const [rowModalOpen, setRowModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<T | null>(null);

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: (row, columnId, filterValue) => {
            const search = String(filterValue).toLowerCase();
            const item = row.original;
            return Object.values(item).some((value) =>
                String(value).toLowerCase().includes(search)
            );
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            pagination,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    useEffect(() => {
        if (flash?.message && flash?.type) setShowAlert(true);
        const timer = setTimeout(() => {
            setIsTableLoading(false);
        }, 500); // Simulate loading
        return () => clearTimeout(timer);
    }, [flash, data]);

    const handleCloseAlert = () => setShowAlert(false);

    const confirmDelete = () => {
        if (itemToDelete && routes.destroy) {
            router.delete(routes.destroy(itemToDelete.id), {
                onSuccess: () => setItemToDelete(null),
                onError: () => setItemToDelete(null),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Main Controls Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row items-center justify-between w-full">
                        {/* Search at top left */}
                        <div className="flex-1 flex justify-start">
                            <Input
                                placeholder="ស្វែងរក"
                                value={globalFilter}
                                onChange={e => setGlobalFilter(e.target.value)}
                                className="max-w-sm w-full md:w-72 rounded-xl border border-indigo-200 dark:border-indigo-600 bg-white/80 dark:bg-gray-900/60 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                disabled={isTableLoading || processing}
                            />
                        </div>
                        {/* Center: Column Visibility and Add Button */}
                        <div className="flex-1 flex justify-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`${commonStyles.button} ${commonStyles.outlineButton}`}
                                        disabled={isTableLoading || processing}
                                        aria-label="Toggle column visibility"
                                    >
                                        <Columns2 className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="center"
                                    className="rounded-xl p-2 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-700 shadow-xl"
                                >
                                    {table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => (
                                            <DropdownMenuItem
                                                key={column.id}
                                                className="flex items-center justify-between px-3 py-2 capitalize cursor-pointer bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent"
                                                onSelect={(e) => e.preventDefault()} // Prevent menu from closing
                                            >
                                                <span className={`${commonStyles.text} flex-1 flex items-center`}>
                                                    {column.id.replace(/_/g, " ")}
                                                </span>
                                                {/* Switch Button */}
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={column.getIsVisible()}
                                                        onChange={(e) => column.toggleVisibility(e.target.checked)}
                                                        disabled={isTableLoading || processing}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-indigo-600 transition-all"></div>
                                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transform peer-checked:translate-x-5 transition-all"></div>
                                                </label>
                                            </DropdownMenuItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                                asChild
                                className={`${commonStyles.button} ${commonStyles.indigoButton}`}
                                disabled={isTableLoading || processing}
                                aria-label={`Add a new ${resourceName.slice(0, -1)}`}
                            >
                                <Link href={routes.create}>
                                    <Plus className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        {/* Found n item at top right */}
                        <div className="flex-1 flex justify-end items-center">
                            <div className={`${commonStyles.text} text-sm`}>
                                {isTableLoading ? (
                                    <Skeleton className="h-4 w-32" />
                                ) : (
                                    `${table.getFilteredRowModel().rows.length} ${resourceName}​ បានរកឃើញ.`
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Flash Alert */}
                {showAlert && flash?.message && flash?.type && (
                    
                    <Alert
                    className="
                        rounded-xl
                        border border-indigo-200 dark:border-indigo-700
                        bg-gradient-to-br
                        from-indigo-50 to-white
                        dark:from-indigo-900/40 dark:to-gray-900
                    "
                    >

                        <CheckCircle2Icon
                            className={`h-4 w-4 ${flash.type === "error"
                                ? "text-red-600 dark:text-red-300"
                                : "text-indigo-600 dark:text-indigo-300"
                                }`}
                        />
                        <AlertTitle
                            className={`${flash.type === "error"
                                ? "text-red-600 dark:text-red-300"
                                : "text-indigo-600 dark:text-indigo-300"
                                } text-sm`}
                        >
                            {flash.type === "error" ? "Error" : "Notification"}
                        </AlertTitle>
                        <AlertDescription className="text-gray-600 dark:text-gray-300 text-sm">
                            {flash.message}
                        </AlertDescription>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCloseAlert}
                            className={`absolute top-3 right-3 h-6 w-6 ${flash.type === "error"
                                ? "text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-100"
                                : "text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100"
                                }`}
                            aria-label="Close alert"
                            disabled={processing}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </Alert>
                )}

                {/* Table Container */}

                <div className="
                rounded-2xl overflow-hidden
                border border-gray-200 dark:border-gray-700
                shadow-lg
                ">
                    <Table>
                        <TableHeader
                            className="
                            text-sm font-semibold
                            text-gray-700 dark:text-gray-200
                            px-4 py-3
                            ">
                            {table.getHeaderGroups().map((headerGroup) => (

                                <TableRow
                                    className="
                                    transition-colors
                                    hover:bg-indigo-50/60 dark:hover:bg-indigo-900/30
                                    data-[state='selected']:bg-indigo-100/70
                                    dark:data-[state='selected']:bg-indigo-900/50
                                "
                                >
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className="text-gray-800 dark:text-gray-100 text-sm font-semibold px-4 py-3"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>

                        {isTableLoading ? (
                            <TableBody>
                                {/* Skeleton loader rows */}
                                {Array.from({ length: table.getState().pagination.pageSize }).map((_, index) => (
                                    <TableRow key={index} className="border-b border-gray-200 dark:border-gray-700">
                                        {columns.map((_, colIndex) => (
                                            <TableCell key={colIndex} className="px-4 py-3">
                                                <Skeleton className="h-4 w-full rounded-md bg-gray-200 dark:bg-gray-800" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        ) : (
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={selectedRow?.id === row.original.id ? 'selected' : 'unselected'}
                                            className={[
                                                // Base row styles
                                                'transition-colors duration-150 cursor-pointer',
                                                'border-b border-gray-200 dark:border-gray-700',
                                                'hover:bg-gray-100 dark:hover:bg-gray-800/60',
                                                // Selected row styles
                                                'data-[state=\'selected\']:bg-purple-100 dark:data-[state=\'selected\']:bg-purple-900/50',
                                                'data-[state=\'selected\']:hover:bg-purple-100/80 dark:data-[state=\'selected\']:hover:bg-purple-900/40',
                                                // Status-based backgrounds (priority order)
                                                row.original.status === 'canceled'
                                                    ? 'bg-rose-100 dark:bg-rose-900/70 border-l-4 border-rose-400 dark:border-rose-700'
                                                    : row.original.status === 'returned'
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/60 border-l-4 border-emerald-400 dark:border-emerald-700'
                                                    : row.original.status === 'processing' && row.original.return_date && new Date(row.original.return_date) < new Date()
                                                    ? 'bg-orange-50 dark:bg-orange-900/70 border-l-4 border-orange-400 dark:border-orange-700'
                                                    : row.original.status === 'processing' && (!row.original.return_date || new Date(row.original.return_date) >= new Date())
                                                    ? 'bg-yellow-50 dark:bg-yellow-800/40 border-l-4 border-yellow-400 dark:border-yellow-700'
                                                    : '',
                                            ].join(' ')}
                                            style={{
                                                boxShadow: row.original.status === 'canceled' ? '0 2px 8px 0 rgba(244, 63, 94, 0.08)' :
                                                    row.original.status === 'returned' ? '0 2px 8px 0 rgba(16, 185, 129, 0.08)' :
                                                    row.original.status === 'processing' && row.original.return_date && new Date(row.original.return_date) < new Date() ? '0 2px 8px 0 rgba(251, 146, 60, 0.08)' :
                                                    row.original.status === 'processing' && (!row.original.return_date || new Date(row.original.return_date) >= new Date()) ? '0 2px 8px 0 rgba(253, 224, 71, 0.08)' :
                                                    undefined
                                            }}
                                            onClick={() => {
                                                setRowModalOpen(true);
                                                setSelectedRow(row.original);
                                            }}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell
                                                    key={cell.id}
                                                    className="px-4 py-3 text-gray-800 dark:text-gray-100 text-sm font-medium"
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center text-gray-600 dark:text-gray-300 text-sm"
                                        >
                                            No {resourceName} found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        )}
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col items-center justify-center gap-4 pt-4">
                    <div className="flex items-center gap-4">
                        <span className={`${commonStyles.text} text-sm whitespace-nowrap`}></span>
                        <Select
                            value={String(table.getState().pagination.pageSize)}
                            onValueChange={(value) => {
                                if (value === "All") {
                                    table.setPageSize(table.getFilteredRowModel().rows.length);
                                } else {
                                    table.setPageSize(Number(value));
                                }
                            }}
                            disabled={isTableLoading || processing}
                        >
                            <SelectTrigger
                                className={`${commonStyles.text} h-8 w-[120px] ${commonStyles.outlineButton}`}
                            >
                                <SelectValue placeholder={String(table.getState().pagination.pageSize)} />
                            </SelectTrigger>
                            <SelectContent className={`${commonStyles.gradientBg} border-indigo-200 dark:border-indigo-600`}>
                                {[10, 20, 50, 100].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`} className={`${commonStyles.text} text-sm`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                                {table.getFilteredRowModel().rows.length > 0 && (
                                    <SelectItem key="all" value="All" className={`${commonStyles.text} text-sm`}>
                                        ទាំងអស់
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <div className={`${commonStyles.text} text-sm`}>
                            {isTableLoading ? (
                                <Skeleton className="h-4 w-24" />
                            ) : (
                                `ទំព័រ ${table.getState().pagination.pageIndex + 1} នៃ ${table.getPageCount() || 1}`
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                className="rounded-lg border-indigo-200 dark:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage() || isTableLoading || processing}
                                aria-label="Previous page"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                className="rounded-lg border-indigo-200 dark:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage() || isTableLoading || processing}
                                aria-label="Next page"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Row Details Modal */}
                <Dialog open={rowModalOpen} onOpenChange={setRowModalOpen}>

                    <DialogContent
                        className="
                        rounded-3xl
                        p-6
                        max-w-lg
                        bg-gradient-to-br
                        from-white to-indigo-50
                        dark:from-gray-900 dark:to-indigo-950
                        shadow-2xl
                    "
                    >

                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                                {selectedRow?.code || `${resourceName.slice(0, -1)} Details`}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 p-4">
                            <div className="grid grid-cols-1 gap-2">
                                <p className={commonStyles.text}>
                                    <strong className="font-semibold text-indigo-500 dark:text-indigo-300">ID:</strong>{" "}
                                    {selectedRow?.id || "N/A"}
                                </p>
                                {modalFields && selectedRow && modalFields(selectedRow)}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                {routes.destroy && (
                    <AlertDialog open={!!itemToDelete} onOpenChange={(openState) => !openState && setItemToDelete(null)}>
                        <AlertDialogContent
                            className={`${commonStyles.gradientBg} border-indigo-200 dark:border-indigo-700 rounded-2xl shadow-2xl`}
                        >
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-indigo-600 dark:text-indigo-300 text-sm">
                                    Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-600 dark:text-gray-300 text-sm">
                                    This action cannot be undone. This will permanently delete{" "}
                                    <strong>{itemToDelete?.code || `this ${resourceName.slice(0, -1)}`}</strong>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    onClick={() => setItemToDelete(null)}
                                    className={`${commonStyles.button} ${commonStyles.outlineButton}`}
                                >
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={confirmDelete}
                                    disabled={processing}
                                    className={`${commonStyles.button} bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700`}
                                >
                                    Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </AppLayout>
    );
}

export default DataTable;
