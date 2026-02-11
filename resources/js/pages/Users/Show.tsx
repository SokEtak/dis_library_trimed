"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Head, Link } from '@inertiajs/react';
import { Eye, Pencil, MoreHorizontal, CircleCheck, CircleX } from 'lucide-react';
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
import AppLayout from "@/layouts/app-layout";
import translations from "@/utils/translations/user/translations";

interface Campus {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
    avatar: string | null;
    campus: Campus | null;
    roles: string[];
    permissions: string[];
    isVerified: boolean;
    isActive: boolean;
}

interface UsersShowProps {
    user: User;
    flash?: {
        message?: string;
        type?: "success" | "error";
    };
    isSuperLibrarian?: boolean;
    lang?: "kh" | "en";
}

const commonStyles = {
    button: "rounded-lg text-sm font-medium transition-all duration-300 ease-in-out hover:scale-105 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
    text: "text-gray-800 dark:text-gray-100 text-sm",
    indigoButton: "bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-lg hover:shadow-xl",
    outlineButton: "bg-transparent dark:bg-transparent text-indigo-500 dark:text-indigo-400 border-2 border-indigo-400 dark:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 shadow-sm",
    gradientBg: "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-indigo-900",
    tooltipBg: "bg-gradient-to-br from-indigo-700 to-blue-500 text-white rounded-lg shadow-md",
    card: "bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-800",
    modal: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50",
    modalContent: "bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-auto",
};

export default function UsersShow({ user, flash, isSuperLibrarian = false, lang = "kh" }: UsersShowProps) {
    const t = translations['kh'];
    const [showLargeAvatar, setShowLargeAvatar] = useState(false);

    const breadcrumbs = [
        { title: translations.kh.indexTitle, href: route("users.index") },
        { title: translations.kh.showTitle, href: route("users.show", user.id) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={translations.kh.showTitle} />
            <div className="p-3 lg:p-5 bg-gradient-to-br from-blue-50/50 to-indigo-100/50 dark:from-gray-900/50 dark:to-indigo-950/50 min-h-screen">
                <div className="max-w-1xl mx-auto">
                    {/* User Details */}
                    <div className={`${commonStyles.card} p-6 lg:p-8`}>
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">{t.showTitle}</h1>
                            {isSuperLibrarian && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className={`${commonStyles.button} h-10 w-10 p-0 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30`}
                                            aria-label={`Open menu for user ${user.name}`}
                                        >
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className={`${commonStyles.gradientBg} w-56 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3 flex gap-3`}
                                    >
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <DropdownMenuItem asChild className="flex-1">
                                                        <Link
                                                            href={route("users.edit", user.id)}
                                                            className={`${commonStyles.button} ${commonStyles.outlineButton} flex items-center justify-center gap-2 py-2.5`}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                            <span>{t.editTooltip}</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className={commonStyles.tooltipBg}>
                                                    {t.editTooltip}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="flex justify-center lg:justify-start">
                                <button
                                    onClick={() => setShowLargeAvatar(true)}
                                    className="group relative"
                                    aria-label={`View ${user.name}'s avatar`}
                                >
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={`${user.name}'s avatar`}
                                            className="h-28 w-28 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-600 shadow-md group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
                                        />
                                    ) : (
                                        <div
                                            className="h-28 w-28 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-500 dark:text-indigo-400 text-2xl font-semibold shadow-md group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
                                        >
                                            {user.name ? user.name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2) : 'N/A'}
                                        </div>
                                    )}
                                </button>
                            </div>
                            <div className="lg:col-span-2 space-y-5">
                                <p className="flex items-center space-x-3">
                                    <strong className="font-semibold text-indigo-600 dark:text-indigo-400 text-base">{t.name}:</strong>
                                    <span className="text-gray-800 dark:text-gray-100 text-base font-medium">{user.name || "N/A"}</span>
                                </p>
                                <p className="flex items-center space-x-3">
                                    <strong className="font-semibold text-indigo-600 dark:text-indigo-400 text-base">{t.email}:</strong>
                                    <span className="text-gray-800 dark:text-gray-100 text-base font-medium">{user.email || "N/A"}</span>
                                </p>
                                {/* <p className="flex items-center space-x-3">
                                    <strong className="font-semibold text-indigo-600 dark:text-indigo-400 text-base">{t.campus}:</strong>
                                    {user.campus ? (
                                        <Link
                                            className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 underline text-base font-medium transition-colors duration-200"
                                            aria-label={`View campus ${user.campus.name} at route /campuses/${user.campus.id}`}
                                        >
                                            {user.campus.name}
                                        </Link>
                                    ) : (
                                        <span className="text-red-400 dark:text-red-300 text-base font-medium">{t.none}</span>
                                    )}
                                </p> */}
                                <p className="flex items-center space-x-3">
                                    <strong className="font-semibold text-indigo-600 dark:text-indigo-400 text-base">{t.roles}:</strong>
                                    <span className="flex flex-wrap gap-2">
                                        {user.roles?.length > 0 ? (
                                            user.roles.map((role, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-block bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs px-3 py-1.5 rounded-full font-medium transition-colors duration-200 hover:bg-indigo-200 dark:hover:bg-indigo-700"
                                                >
                                                    {role}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-red-400 dark:text-red-300 text-base font-medium">{t.none}</span>
                                        )}
                                    </span>
                                </p>
                                {/* <p className="flex items-center space-x-3">
                                    <strong className="font-semibold text-indigo-600 dark:text-indigo-400 text-base">{t.permissions}:</strong>
                                    <span className="flex flex-wrap gap-2">
                                        {user.permissions?.length > 0 ? (
                                            user.permissions.map((permission, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-block bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs px-3 py-1.5 rounded-full font-medium transition-colors duration-200 hover:bg-green-200 dark:hover:bg-green-700"
                                                >
                                                    {permission}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-red-400 dark:text-red-300 text-base font-medium">{t.none}</span>
                                        )}
                                    </span>
                                </p> */}
                                <p className="flex items-center space-x-3">
                                    <strong className="font-semibold text-indigo-600 dark:text-indigo-400 text-base">{t.isVerified}:</strong>
                                    {user.isVerified ? (
                                        <CircleCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <CircleX className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    )}
                                </p>
                                {/* <p className="flex items-center space-x-3">
                                    <strong className="font-semibold text-indigo-600 dark:text-indigo-400 text-base">{t.isActive}:</strong>
                                    {user.isActive ? (
                                        <CircleCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <CircleX className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    )}
                                </p> */}
                                <p className="flex items-center space-x-3">
                                    <strong className="font-semibold text-indigo-600 dark:text-indigo-400 text-base">{t.createdAt}:</strong>
                                    <span className="text-gray-800 dark:text-gray-100 text-base font-medium">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Large Avatar Modal */}
                {showLargeAvatar && (
                    <div className={commonStyles.modal} onClick={() => setShowLargeAvatar(false)}>
                        <div className={commonStyles.modalContent} onClick={(e) => e.stopPropagation()}>
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={`${user.name}'s large avatar`}
                                    className="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-lg"
                                />
                            ) : (
                                <div className="h-64 w-64 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-500 dark:text-indigo-400 text-4xl font-semibold shadow-lg">
                                    {user.name ? user.name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2) : 'N/A'}
                                </div>
                            )}
                            {showLargeAvatar && (
                                <div
                                    className={commonStyles.modal}
                                    onClick={() => setShowLargeAvatar(false)}
                                >
                                    <div
                                        className={`${commonStyles.modalContent} relative`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* ❌ Close button (top-right) */}
                                        <button
                                            onClick={() => setShowLargeAvatar(false)}
                                            className="absolute top-3 right-3 rounded-full p-2
                           text-gray-500 hover:text-gray-800
                           dark:text-gray-400 dark:hover:text-white
                           hover:bg-gray-200 dark:hover:bg-gray-700
                           transition"
                                            aria-label="Close"
                                        >
                                            ✕
                                        </button>

                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={`${user.name}'s large avatar`}
                                                className="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-lg"
                                            />
                                        ) : (
                                            <div className="h-64 w-64 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-500 dark:text-indigo-400 text-4xl font-semibold shadow-lg">
                                                {user.name
                                                    ? user.name
                                                        .split(' ')
                                                        .map(word => word.charAt(0).toUpperCase())
                                                        .join('')
                                                        .slice(0, 2)
                                                    : 'N/A'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
