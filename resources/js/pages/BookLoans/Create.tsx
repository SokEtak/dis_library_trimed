"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, useForm, Link, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2Icon, X, ChevronDown, ClockIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import translations from "@/utils/translations/bookloan/bookloansCreateTranslations";

interface User {
    id: number;
    name: string;
}

interface Book {
    id: number;
    title: string;
}

interface BookLoansCreateProps {
    books: Book[];
    users: User[];
    lang?: "kh" | "en";
}

const statusOptions = [
    { value: "processing", label: (t: typeof translations.kh) => t.statusProcessing, icon: <ClockIcon className="h-4 w-4 text-yellow-500 dark:text-yellow-300" /> },
    { value: "returned", label: (t: typeof translations.kh) => t.statusReturned, icon: <CheckCircleIcon className="h-4 w-4 text-green-500 dark:text-green-300" /> },
    { value: "canceled", label: (t: typeof translations.kh) => t.statusCanceled, icon: <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-400" /> },
];

export default function BookLoansCreate({ books, users, lang = "kh" }: BookLoansCreateProps) {
    const t = translations[lang];
    const initialFormData = {
        return_date: "",
        returned_at: "",
        book_id: "none",
        user_id: "none",
        status: "none",
    };
    const { data, setData, post, processing, errors } = useForm(initialFormData);
    const [showErrorAlert, setShowErrorAlert] = useState(!!Object.keys(errors).length);
    const [openBook, setOpenBook] = useState(false);
    const [openUser, setOpenUser] = useState(false);
    const [openStatus, setOpenStatus] = useState(false);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Track form changes
    useEffect(() => {
        const hasChanges = Object.keys(data).some(
            (key) => data[key as keyof typeof data] !== initialFormData[key as keyof typeof initialFormData]
        );
        setIsDirty(hasChanges);
    }, [data]);

    // Handle beforeunload event for refresh/navigation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ""; // Standard for most browsers to show a confirmation prompt
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("bookloans.store"), {
            data,
            onSuccess: () => {
                setData(initialFormData);
                setShowErrorAlert(false);
                setIsDirty(false); // Reset dirty state on successful submission
            },
            onError: () => {
                setShowErrorAlert(true);
            },
        });
    };

    const handleCloseAlert = () => setShowErrorAlert(false);

    const handleCancel = () => {
        if (isDirty) {
            setShowLeaveDialog(true);
        } else {
            router.visit(route("bookloans.index"));
        }
    };

    const confirmLeave = () => {
        setShowLeaveDialog(false);
        router.visit(route("bookloans.index"));
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t.title,
            href: route("bookloans.index"),
        },
        {
            title: t.create,
            href: "",
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.title} />
            <div className="min-h-screen p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="max-w-1xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-8">
                        {t.title}
                    </h1>
                    {showErrorAlert && Object.keys(errors).length > 0 && (
                        <Alert className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                    <CheckCircle2Icon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                                    <div>
                                        <AlertTitle className="text-red-600 dark:text-red-400 font-semibold">
                                            {t.error}
                                        </AlertTitle>
                                        <AlertDescription className="text-red-600 dark:text-red-400">
                                            {Object.values(errors).join(", ")}
                                        </AlertDescription>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleCloseAlert}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 bg-transparent hover:bg-red-100 dark:hover:bg-red-800/50 p-1 rounded-full"
                                    disabled={processing}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label
                                htmlFor="return_date"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                {t.returnDate}
                            </label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Input
                                            id="return_date"
                                            type="date"
                                            min={new Date().toISOString().split("T")[0]}
                                            value={data.return_date}
                                            onChange={(e) => setData("return_date", e.target.value)}
                                            className={`w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border ${
    errors.return_date
        ? "border-red-500 dark:border-red-400"
        : "border-gray-300 dark:border-gray-600"
} focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-300 ease-in-out`}
                                            disabled={processing}
                                            aria-invalid={!!errors.return_date}
                                            aria-describedby={errors.return_date ? "return-date-error" : undefined}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-indigo-600 text-white rounded-lg p-2">
                                        {t.returnDateTooltip}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {errors.return_date && (
                                <p id="return-date-error" className="text-red-500 dark:text-red-400 text-sm mt-1">
                                    {errors.return_date}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="book_id"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                {t.book}
                            </label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Popover open={openBook} onOpenChange={setOpenBook}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openBook}
                                                    className={`w-full justify-between px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border ${
    errors.book_id
        ? "border-red-500 dark:border-red-400"
        : "border-gray-300 dark:border-gray-600"
} focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-300 ease-in-out`}
                                                    disabled={processing}
                                                >
                                                    {data.book_id !== "none"
                                                        ? books.find((book) => book.id.toString() === data.book_id)?.title
                                                        : t.bookPlaceholder}
                                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                side="bottom"
                                                align="start"
                                                sideOffset={2}
                                                className="w-full p-0 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                            >
                                                <Command>
                                                    <CommandInput placeholder={t.bookPlaceholder} className="h-10" />
                                                    <CommandList>
                                                        <CommandEmpty>{t.bookEmpty}</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandItem
                                                                value="none"
                                                                onSelect={() => {
                                                                    setData("book_id", "none");
                                                                    setOpenBook(false);
                                                                }}
                                                            >
                                                                {t.bookNone}
                                                            </CommandItem>
                                                            {books.map((book) => (
                                                                <CommandItem
                                                                    key={book.id}
                                                                    value={book.title}
                                                                    onSelect={() => {
                                                                        setData("book_id", book.id.toString());
                                                                        setOpenBook(false);
                                                                    }}
                                                                >
                                                                    {book.title}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-indigo-600 text-white rounded-lg p-2">
                                        {t.bookTooltip}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {errors.book_id && (
                                <p id="book-error" className="text-red-500 dark:text-red-400 text-sm mt-1">
                                    {errors.book_id}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="user_id"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                {t.loaner}
                            </label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Popover open={openUser} onOpenChange={setOpenUser}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openUser}
                                                    className={`w-full justify-between px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border ${
    errors.user_id
        ? "border-red-500 dark:border-red-400"
        : "border-gray-300 dark:border-gray-600"
} focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-300 ease-in-out`}
                                                    disabled={processing}
                                                >
                                                    {data.user_id !== "none"
                                                        ? users.find((user) => user.id.toString() === data.user_id)?.name
                                                        : t.loanerPlaceholder}
                                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                side="bottom"
                                                align="start"
                                                sideOffset={2}
                                                className="w-full p-0 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                            >
                                                <Command>
                                                    <CommandInput placeholder={t.loanerPlaceholder} className="h-10" />
                                                    <CommandList>
                                                        <CommandEmpty>{t.loanerEmpty}</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandItem
                                                                value="none"
                                                                onSelect={() => {
                                                                    setData("user_id", "none");
                                                                    setOpenUser(false);
                                                                }}
                                                            >
                                                                {t.loanerNone}
                                                            </CommandItem>
                                                            {users.map((user) => (
                                                                <CommandItem
                                                                    key={user.id}
                                                                    value={user.name}
                                                                    onSelect={() => {
                                                                        setData("user_id", user.id.toString());
                                                                        setOpenUser(false);
                                                                    }}
                                                                >
                                                                    {user.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-indigo-600 text-white rounded-lg p-2">
                                        {t.loanerTooltip}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {errors.user_id && (
                                <p id="user-error" className="text-red-500 dark:text-red-400 text-sm mt-1">
                                    {errors.user_id}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="status"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                {t.status}
                            </label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Popover open={openStatus} onOpenChange={setOpenStatus}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openStatus}
                                                    className={`w-full justify-between px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border ${
    errors.status
        ? "border-red-500 dark:border-red-400"
        : "border-gray-300 dark:border-gray-600"
} focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-300 ease-in-out`}
                                                    disabled={processing}
                                                >
                                                    {data.status !== "none"
                                                        ? statusOptions.find((status) => status.value === data.status)?.label(t)
                                                        : t.statusPlaceholder}
                                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                side="bottom"
                                                align="start"
                                                sideOffset={2}
                                                className="w-full p-0 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                            >
                                                <Command>
                                                    <CommandInput placeholder={t.statusPlaceholder} className="h-10" />
                                                    <CommandList>
                                                        <CommandEmpty>{t.statusEmpty}</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandItem
                                                                value="none"
                                                                onSelect={() => {
                                                                    setData("status", "none");
                                                                    setOpenStatus(false);
                                                                }}
                                                            >
                                                                {t.statusNone}
                                                            </CommandItem>
                                                            {statusOptions.map((status) => (
                                                                <CommandItem
                                                                    key={status.value}
                                                                    value={status.label(t)}
                                                                    onSelect={() => {
                                                                        setData("status", status.value);
                                                                        setOpenStatus(false);
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        {status.icon}
                                                                        {status.label(t)}
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-indigo-600 text-white rounded-lg p-2">
                                        {t.statusTooltip}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {errors.status && (
                                <p id="status-error" className="text-red-500 dark:text-red-400 text-sm mt-1">
                                    {errors.status}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-6 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                                        >
                                            {processing ? t.creating : t.create}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-indigo-600 text-white rounded-lg p-2">
                                        {t.createTooltip}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 px-6 py-2 rounded-lg transition-all duration-300 ease-in-out"
                                            onClick={handleCancel}
                                            disabled={processing}
                                        >
                                            {t.cancel}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-indigo-600 text-white rounded-lg p-2">
                                        {t.cancelTooltip}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </form>
                    <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                        <AlertDialogContent className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-indigo-600 dark:text-indigo-300">
                                    {lang === "kh" ? "តើអ្នកប្រាកដទេ?" : "Are you sure?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                                    {lang === "kh"
                                        ? "អ្នកមានការផ្លាស់ប្តូរដែលមិនបានរក្សាទុក។ ចាកចេញនឹងបាត់បង់ការផ្លាស់ប្តូរទាំងនេះ។"
                                        : "You have unsaved changes. Leaving will discard these changes."}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300">
                                    {t.cancel}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={confirmLeave}
                                    className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-all duration-300"
                                    disabled={processing}
                                >
                                    {lang === "kh" ? "ចាកចេញ" : "Leave"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </AppLayout>
    );
}
