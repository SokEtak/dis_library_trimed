"use client";

import { useState, useEffect } from "react";
import { useForm, Link } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2Icon, X } from "lucide-react";
import { translations } from "@/utils/translations/role/role";
interface Permission {
    id: number;
    name: string;
}

interface RolesCreateProps {
    permissions: Permission[];
    flash?: { message?: string; type?: "success" | "error" };
    isSuperLibrarian?: boolean;
    lang?: "kh" | "en";
}

const commonStyles = {
    button: "rounded-lg text-sm font-medium transition-all duration-300 ease-in-out hover:scale-105 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
    text: "text-gray-800 dark:text-gray-100 text-sm",
    indigoButton: "bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-lg hover:shadow-xl",
    outlineButton: "bg-transparent dark:bg-transparent text-indigo-500 dark:text-indigo-400 border-2 border-indigo-400 dark:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 shadow-sm",
    gradientBg: "bg-gradient-to-br from-blue-50/50 to-indigo-100/50 dark:from-gray-900/50 dark:to-indigo-950/50",
    card: "bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-800",
    input: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg focus:ring-indigo-500 focus:border-indigo-500",
    error: "text-red-500 dark:text-red-400 text-sm mt-1",
};

export default function RolesCreate({
                                        permissions,
                                        flash,
                                        isSuperLibrarian = false,
                                        lang = "kh",
                                    }: RolesCreateProps) {
    const t = translations[lang] || translations.en;
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        permissions: [] as number[],
    });
    const [showErrorAlert, setShowErrorAlert] = useState(!!Object.keys(errors).length);
    const [showSuccessAlert, setShowSuccessAlert] = useState(!!flash?.message);

    useEffect(() => {
        setShowErrorAlert(!!Object.keys(errors).length);
        if (flash?.message) setShowSuccessAlert(true);
    }, [errors, flash?.message]);

    const handlePermissionChange = (permissionId: number) => {
        const currentPermissions = data.permissions as number[];
        const newPermissions = currentPermissions.includes(permissionId)
            ? currentPermissions.filter((id) => id !== permissionId)
            : [...currentPermissions, permissionId];
        setData("permissions", newPermissions);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("roles.store"), {
            onSuccess: () => setShowErrorAlert(false),
            onError: () => setShowErrorAlert(true),
        });
    };

    const handleCloseErrorAlert = () => setShowErrorAlert(false);
    const handleCloseSuccessAlert = () => setShowSuccessAlert(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.indexTitle || "Roles", href: route("roles.index") },
        { title: t.createBreadcrumb || "Create", href: "" },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.createTitle || "Create Role"} />
            <div className={`p-6 lg:p-4 ${commonStyles.gradientBg} min-h-screen`}>
                <div className="max-w-1xl mx-auto">
                    <div className={`${commonStyles.card} p-6 lg:p-8`}>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight mb-8">
                            {t.createTitle || "Create Role"}
                        </h1>
                        {showSuccessAlert && flash?.message && (
                            <Alert className="mb-6 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3">
                                        <CheckCircle2Icon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                        <div>
                                            <AlertTitle className="text-green-600 dark:text-green-400 font-semibold">
                                                {t.createNotification || "Success"}
                                            </AlertTitle>
                                            <AlertDescription className="text-green-600 dark:text-green-400">
                                                {flash.message}
                                            </AlertDescription>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleCloseSuccessAlert}
                                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 bg-transparent hover:bg-green-100 dark:hover:bg-green-800/50 p-1 rounded-full"
                                        disabled={processing}
                                        aria-label="Close success alert"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </Alert>
                        )}
                        {showErrorAlert && Object.keys(errors).length > 0 && (
                            <Alert className="mb-6 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3">
                                        <CheckCircle2Icon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                                        <div>
                                            <AlertTitle className="text-red-600 dark:text-red-400 font-semibold">
                                                {t.createError || "Error"}
                                            </AlertTitle>
                                            <AlertDescription className="text-red-600 dark:text-red-400">
                                                {Object.values(errors).join(", ")}
                                            </AlertDescription>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleCloseErrorAlert}
                                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 bg-transparent hover:bg-red-100 dark:hover:bg-red-800/50 p-1 rounded-full"
                                        disabled={processing}
                                        aria-label="Close error alert"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </Alert>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label
                                    htmlFor="name"
                                    className="text-base text-gray-900 dark:text-gray-50"
                                >
                                    {t.createName || "Role Name"}
                                </Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Input
                                                id="name"
                                                maxLength={255}
                                                value={data.name}
                                                onChange={(e) => setData("name", e.target.value)}
                                                placeholder={t.createNamePlaceholder || "Enter pms name"}
                                                className={`${commonStyles.input} mt-2`}
                                                disabled={processing}
                                                aria-invalid={!!errors.name}
                                                aria-describedby={errors.name ? "name-error" : undefined}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-indigo-600 text-white rounded-lg p-2">
                                            {t.createNameTooltip || "Enter a unique name for the pms"}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                {errors.name && (
                                    <p id="name-error" className={commonStyles.error}>
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            {/* <div>
                                <Label
                                    className="text-base text-gray-900 dark:text-gray-50"
                                >
                                    {t.createPermissions || "Permissions"}
                                </Label>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto mt-2">
                                    {permissions.map((permission) => (
                                        <div key={permission.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`permission-${permission.id}`}
                                                checked={(data.permissions as number[]).includes(permission.id)}
                                                onCheckedChange={() => handlePermissionChange(permission.id)}
                                                disabled={processing}
                                                className="h-4 w-4 accent-indigo-500"
                                            />
                                            <Label
                                                htmlFor={`permission-${permission.id}`}
                                                className="text-base text-gray-900 dark:text-gray-50"
                                            >
                                                {permission.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.permissions && (
                                    <p className={commonStyles.error}>
                                        {errors.permissions}
                                    </p>
                                )}
                            </div> */}
                            <div className="flex justify-end space-x-4 mt-8">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className={`${commonStyles.button} ${commonStyles.indigoButton} px-6 py-2.5`}
                                            >
                                                {processing ? t.createCreating || "Creating..." : t.createCreate || "Create"}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-indigo-600 text-white rounded-lg p-2">
                                            {t.createCreateTooltip || "Save the new pms"}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link href={route("roles.index")}>
                                                <Button
                                                    variant="outline"
                                                    className={`${commonStyles.button} ${commonStyles.outlineButton} px-6 py-2.5`}
                                                    disabled={processing}
                                                >
                                                    {t.createCancel || "Cancel"}
                                                </Button>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-indigo-600 text-white rounded-lg p-2">
                                            {t.createCancelTooltip || "Return to roles list"}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
