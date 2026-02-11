"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { CheckCircle2Icon, Pencil, Trash, ArrowLeft, X } from "lucide-react";
import translations from "@/utils/translations/bookloan/bookloanShowTranslations";

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
    return_date: string;
    returned_at: string | null;
    book_id: number;
    user_id: number;
    book: Book | null;
    user: User | null;
    status: "processing" | "returned" | "canceled" | null;
    created_at: string;
    updated_at: string;
}

interface BookLoanShowProps {
    loan: BookLoan;
    flash: {
        message: string | null;
    };
    lang?: "kh" | "en";
}

export default function BookLoanShow({ loan, flash, lang = "kh" }: BookLoanShowProps) {
    const t = translations[lang];
    const { processing } = useForm();
    const [showAlert, setShowAlert] = useState(!!flash.message);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        if (flash.message) setShowAlert(true);
    }, [flash.message]);

    const handleCloseAlert = () => setShowAlert(false);

    const confirmDelete = () => {
        router.delete(route("bookloans.destroy", loan.id), {
            onSuccess: () => {
                setShowDeleteDialog(false);
                router.visit(route("bookloans.index"));
            },
            onError: () => {
                setShowDeleteDialog(false);
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t.title,
            href: route("bookloans.index"),
        },
        {
            title: t.details || "ព័ត៌មានលម្អិត",
            href: "",
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.title}: ${loan.book?.title || t.na}`} />
            <div className="min-h-screen p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="max-w-1xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-8">
                        {t.title}
                    </h1>
                    {showAlert && flash.message && (
                        <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                    <CheckCircle2Icon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                    <div>
                                        <AlertTitle className="text-blue-600 dark:text-blue-400 font-semibold">
                                            {t.notification}
                                        </AlertTitle>
                                        <AlertDescription className="text-blue-600 dark:text-blue-400">
                                            {flash.message}
                                        </AlertDescription>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleCloseAlert}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-transparent hover:bg-blue-100 dark:hover:bg-blue-800/50 p-1 rounded-full"
                                    disabled={processing}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </Alert>
                    )}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t.id}
                            </label>
                            <p
                                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 transition-all duration-300"
                                aria-label={`${t.id}: ${loan.id}`}
                            >
                                {loan.id}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t.returnDate}
                            </label>
                            <p
                                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 transition-all duration-300"
                                aria-label={`${t.returnDate}: ${loan.return_date || t.na}`}
                            >
                                {loan.return_date || t.na}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t.book}
                            </label>
                            <p
                                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 transition-all duration-300"
                                aria-label={loan.book ? `${t.book}: ${loan.book.title}` : `${t.book}: ${t.na}`}
                            >
                                {loan.book_id ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href={route("books.show", loan.book_id)}
                                                    className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-400 underline transition-colors duration-200"
                                                >
                                                    {loan.book?.title || t.na}
                                                </Link>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-indigo-600 text-white rounded-lg p-2">
                                                {t.bookTooltip}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : (
                                    <span className="text-gray-500 dark:text-gray-400">{t.na}</span>
                                )}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t.loaner}
                            </label>
                            <p
                                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 transition-all duration-300"
                                aria-label={loan.user ? `${t.loaner}: ${loan.user.name}` : `${t.loaner}: ${t.na}`}
                            >
                                {loan.user_id ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href={route("users.show", loan.user_id)}
                                                    className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-400 underline transition-colors duration-200"
                                                >
                                                    {loan.user?.name || t.na}
                                                </Link>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-indigo-600 text-white rounded-lg p-2">
                                                {t.loanerTooltip}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : (
                                    <span className="text-gray-500 dark:text-gray-400">{t.na}</span>
                                )}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t.returnedAt || "Returned At"}
                            </label>
                            <p
                                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 transition-all duration-300"
                                aria-label={`${t.returnedAt || "Returned At"}: ${loan.returned_at || t.na}`}
                            >
                                {loan.returned_at || t.na}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t.status}
                            </label>
                            <p
                                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 transition-all duration-300"
                                aria-label={`${t.status}: ${loan.status ? t[`status${loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}`] : t.na}`}
                            >
                                {loan.status ? t[`status${loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}`] : t.na}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t.createdAt}
                            </label>
                            <p
                                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 transition-all duration-300"
                                aria-label={`${t.createdAt}: ${new Date(loan.created_at).toLocaleString()}`}
                            >
                                {new Date(loan.created_at).toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t.lastModified}
                            </label>
                            <p
                                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 transition-all duration-300"
                                aria-label={`${t.lastModified}: ${new Date(loan.updated_at).toLocaleString()}`}
                            >
                                {new Date(loan.updated_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-8">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href={route("bookloans.edit", loan.id)}>
                                        <Button
                                            className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-6 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                                            disabled={processing}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            {t.edit}
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent className="bg-indigo-600 text-white rounded-lg p-2">
                                    {t.editTooltip}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 px-6 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                                        onClick={() => setShowDeleteDialog(true)}
                                        disabled={processing}
                                    >
                                        <Trash className="h-4 w-4 mr-2" />
                                        {t.delete}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-indigo-600 text-white rounded-lg p-2">
                                    {t.deleteTooltip}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href={route("bookloans.index")}>
                                        <Button
                                            variant="outline"
                                            className="bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 px-6 py-2 rounded-lg transition-all duration-300 ease-in-out"
                                            disabled={processing}
                                        >
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            {t.back}
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent className="bg-indigo-600 text-white rounded-lg p-2">
                                    {t.backTooltip}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-indigo-600 dark:text-indigo-300">
                                {t.confirmDeleteTitle}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                                {t.confirmDeleteDescription}
                                <strong>{loan.book?.title || t.na}</strong>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300">
                                {t.cancel}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-all duration-300"
                                disabled={processing}
                            >
                                {t.delete}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
