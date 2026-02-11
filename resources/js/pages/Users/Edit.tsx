"use client";

import { useState, useEffect } from "react";
// Simple Tabs component (copied from Create)
function Tabs({ tabs, activeTab, setActiveTab }) {
    return (
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700 flex space-x-2">
            {tabs.map((tab, idx) => (
                <button
                    key={tab}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg focus:outline-none transition-colors duration-200 ${
                        activeTab === idx
                            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-500'
                            : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-800'
                    }`}
                    onClick={() => setActiveTab(idx)}
                    type="button"
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}
import { Button } from "@/components/ui/button";
import { Head, Link, useForm } from '@inertiajs/react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, Eye, EyeOff, X, Search } from 'lucide-react';
import AppLayout from "@/layouts/app-layout";
import translations from "@/utils/translations/user/translations";
import { RiShieldUserFill } from 'react-icons/ri';

interface Role {
    id: number;
    name: string;
}

interface Permission {
    id: number;
    name: string;
}

interface Campus {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    campus_id: string;
    roles: string[];
    permissions: string[];
    isVerified: boolean;
    isActive: boolean;
}

interface UsersEditProps {
    user: User;
    roles?: Role[];
    permissions?: Permission[];
    campuses?: Campus[];
    flash?: {
        message?: string;
        type?: "success" | "error";
    };
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

// Custom Multi-Select Component
const MultiSelect = ({ options, selected, setSelected, placeholder }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleChange = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value];
        setSelected(newSelected);
    };

    const filteredOptions = options.filter((option) =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={`${commonStyles.outlineButton} h-10 px-4 w-full justify-start`}>
                    <RiShieldUserFill className="h-6 w-6 mr-2" />
                    {selected.length > 0 ? `${selected.length} selected` : placeholder}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={`${commonStyles.card} w-56 max-h-72 overflow-y-auto border border-indigo-100 dark:border-indigo-800`} align="start">
                {/* Search Bar with Icon */}
                <div className="p-2 border-b border-indigo-100 dark:border-indigo-800">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-2 py-1 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            aria-label="Search options"
                        />
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                </div>
                {/* Options List */}
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                        <DropdownMenuItem
                            key={option.id}
                            className="text-sm text-gray-800 dark:text-gray-100 flex items-center py-2 px-4 hover:bg-indigo-100 dark:hover:bg-indigo-800/80 transition-colors duration-200"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(option.name)}
                                onChange={() => handleChange(option.name)}
                                className="mr-3 h-4 w-4 accent-indigo-500"
                                aria-label={`Select ${option.name}`}
                            />
                            {option.name}
                        </DropdownMenuItem>
                    ))
                ) : (
                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                        No options found
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default function UsersEdit({ user, roles = [], permissions = [], campuses = [], flash, lang = "kh" }: UsersEditProps) {
    const t = translations['kh'];//change it to dynamic
    const { data, setData, post, processing, errors } = useForm({
        _method: "PUT",
        name: user.name,
        email: user.email,
        password: "",
        password_confirmation: "",
        avatar: null as File | null,
        campus_id: user.campus_id,
        roles: user.roles,
        permissions: user.permissions,
        isVerified: user.isVerified,
        isActive: user.isActive,
    });

    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false);

    // Function to generate email from name
    const generateEmailFromName = (name: string) => {
        const nameParts = name.trim().split(/\s+/);
        if (nameParts.length === 1) {
            return `${nameParts[0].toLowerCase()}@diu.edu.kh`;
        }
        if (nameParts.length >= 2) {
            const firstName = nameParts[0].toLowerCase();
            const lastName = nameParts[nameParts.length - 1].toLowerCase();
            return `${firstName}.${lastName}@diu.edu.kh`;
        }
        return "";
    };

    // Handle name change and update email
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setData((prev) => ({
            ...prev,
            name: newName,
            email: generateEmailFromName(newName),
        }));
    };

    // Track form changes to detect unsaved state
    useEffect(() => {
        const hasChanges =
            data.name !== user.name ||
            data.email !== user.email ||
            data.password !== "" ||
            data.password_confirmation !== "" ||
            data.avatar !== null ||
            data.campus_id !== user.campus_id ||
            JSON.stringify(data.roles) !== JSON.stringify(user.roles) ||
            JSON.stringify(data.permissions) !== JSON.stringify(user.permissions) ||
            data.isVerified !== user.isVerified ||
            data.isActive !== user.isActive;

        setIsFormDirty(hasChanges);
    }, [data, user]);

    // Prevent accidental page refresh or navigation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isFormDirty) {
                e.preventDefault();
                e.returnValue = t.unsavedChanges;
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isFormDirty, t.unsavedChanges]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData("avatar", file);
            setAvatarPreview(URL.createObjectURL(file));
        } else {
            setData("avatar", null);
            setAvatarPreview(user.avatar);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Use 'post' (as 'put' doesn't support file uploads)
        post(route("users.update", user.id), {
            // Add a transform function to clean the data before sending
            transform: (data) => {
                const transformedData = { ...data };

                // If password is blank, remove it and its confirmation
                // so they don't trigger backend validation.
                if (!transformedData.password) {
                    delete transformedData.password;
                    delete transformedData.password_confirmation;
                }

                // If no new avatar was selected (it's still null),
                // remove it from the request.
                if (transformedData.avatar === null) {
                    delete transformedData.avatar;
                }

                return transformedData;
            },
            onSuccess: () => {
                setIsFormDirty(false);
            },
            // Explicitly preserve scroll and state on error
            // to avoid losing form data if validation fails
            preserveScroll: true,
            preserveState: true,
        });
    };

    const breadcrumbs = [
        { title: t.indexTitle, href: route("users.index") },
        { title: t.editTitle, href: route("users.edit", user.id) },
    ];

    // Tab state and labels (copied from Create)
    const tabLabels = [t.accountInfo, t.roles, t.otherInfo];
    const [activeTab, setActiveTab] = useState(0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={translations.kh.editTitle} />
            {isAvatarModalOpen && avatarPreview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => setIsAvatarModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Large avatar preview"
                >
                    <img
                        src={avatarPreview}
                        alt="Avatar preview (large)"
                        className="max-w-full max-h-full rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                        onClick={() => setIsAvatarModalOpen(false)}
                        aria-label="Close image preview"
                    >
                        <X className="h-8 w-8" />
                    </button>
                </div>
            )}

            <div className={`p-6 lg:p-4 ${commonStyles.gradientBg} min-h-screen`}>
                <div className="max-w-1xl mx-auto">
                    <div className={`${commonStyles.card} p-6 lg:p-8`}>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight mb-8">
                            {t.editTitle}
                        </h1>

                        {flash?.message && (
                            <div
                                className={`mb-6 p-4 rounded-lg text-sm font-medium ${
                                    flash.type === "success"
                                        ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200"
                                        : "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200"
                                }`}
                            >
                                {flash.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Tabs tabs={tabLabels} activeTab={activeTab} setActiveTab={setActiveTab} />
                            {activeTab === 0 && (
                                <div className="space-y-6">
                                    {/* Name Input */}
                                    <div>
                                        <Label htmlFor="name" className="text-base text-gray-900 dark:text-gray-50">
                                            {t.name}
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={handleNameChange}
                                            className={`${commonStyles.input} mt-2`}
                                            aria-required="true"
                                            aria-label={t.name}
                                        />
                                        {errors.name && <p className={commonStyles.error}>{errors.name}</p>}
                                    </div>

                                    {/* Email Input */}
                                    <div>
                                        <Label htmlFor="email" className="text-base text-gray-900 dark:text-gray-50">
                                            {t.email}
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            readOnly
                                            className={`${commonStyles.input} mt-2 bg-gray-100 dark:bg-gray-700 cursor-not-allowed`}
                                            aria-required="true"
                                            aria-label={t.email}
                                        />
                                        {errors.email && <p className={commonStyles.error}>{errors.email}</p>}
                                    </div>

                                    {/* Password Input */}
                                    <div>
                                        <Label htmlFor="password" className="text-base text-gray-900 dark:text-gray-50">
                                            {t.password}
                                        </Label>
                                        <div className="relative mt-2">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                value={data.password}
                                                onChange={(e) => setData("password", e.target.value)}
                                                className={`${commonStyles.input} pr-10`}
                                                aria-label={t.password}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                aria-label={showPassword ? t.hidePassword : t.showPassword}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && <p className={commonStyles.error}>{errors.password}</p>}
                                    </div>

                                    {/* Confirm Password Input */}
                                    <div>
                                        <Label htmlFor="password_confirmation" className="text-base text-gray-900 dark:text-gray-50">
                                            {t.confirmPassword}
                                        </Label>
                                        <div className="relative mt-2">
                                            <Input
                                                id="password_confirmation"
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={data.password_confirmation}
                                                onChange={(e) => setData("password_confirmation", e.target.value)}
                                                className={`${commonStyles.input} pr-10`}
                                                aria-label={t.confirmPassword}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                aria-label={showConfirmPassword ? t.hidePassword : t.showPassword}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password_confirmation && (
                                            <p className={commonStyles.error}>{errors.password_confirmation}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {activeTab === 1 && (
                                <div className="space-y-6">
                                    {/* Roles Input */}
                                    <div>
                                        <Label htmlFor="roles" className="text-base text-gray-900 dark:text-gray-50 mb-2">
                                            {t.roles}
                                        </Label>
                                        <MultiSelect
                                            options={roles}
                                            selected={data.roles}
                                            setSelected={(roles) => setData("roles", roles)}
                                            placeholder={t.selectRoles}
                                        />
                                        {errors.roles && <p className={commonStyles.error}>{errors.roles}</p>}
                                    </div>

                                    {/* Permissions Input */}
                                    {/* <div>
                                        <Label htmlFor="permissions" className="text-base text-gray-900 dark:text-gray-50">
                                            {t.permissions}
                                        </Label>
                                        <MultiSelect
                                            options={permissions}
                                            selected={data.permissions}
                                            setSelected={(permissions) => setData("permissions", permissions)}
                                            placeholder={t.selectPermissions}
                                        />
                                        {errors.permissions && <p className={commonStyles.error}>{errors.permissions}</p>}
                                    </div> */}
                                </div>
                            )}
                            {activeTab === 2 && (
                                <div className="space-y-6">
                                    {/* Avatar Input */}
                                    <div>
                                        <Label htmlFor="avatar" className="text-base text-gray-900 dark:text-gray-50">
                                            {t.avatar}
                                        </Label>
                                        <div className="mt-2 flex items-center space-x-4">
                                            <Input
                                                id="avatar"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                className={`${commonStyles.input} file:text-indigo-500 file:dark:text-indigo-400 file:bg-transparent file:border-0 file:cursor-pointer`}
                                                aria-label={t.uploadAvatar}
                                            />
                                            {avatarPreview && (
                                                <img
                                                    src={avatarPreview}
                                                    alt="Avatar preview"
                                                    className="h-16 w-16 rounded-full object-fill border-2 border-indigo-200 dark:border-indigo-600 shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setIsAvatarModalOpen(true)}
                                                />
                                            )}
                                        </div>
                                        {errors.avatar && <p className={commonStyles.error}>{errors.avatar}</p>}
                                    </div>

                                    {/* Campuses Input */}
                                    {/* <div>
                                        <Label htmlFor="campus_id" className="text-base text-gray-900 dark:text-gray-50">
                                            {t.campus}
                                        </Label>
                                        <Select
                                            value={data.campus_id}
                                            onValueChange={(value) => setData("campus_id", value)}
                                        >
                                            <SelectTrigger className={`${commonStyles.input} mt-2`} aria-label={t.selectCampus}>
                                                <SelectValue placeholder={t.selectCampus} />
                                            </SelectTrigger>
                                            <SelectContent className={`${commonStyles.card}`}>
                                                {campuses.map((campus) => (
                                                    <SelectItem key={campus.id} value={String(campus.id)}>
                                                        {campus.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.campus_id && <p className={commonStyles.error}>{errors.campus_id}</p>}
                                    </div> */}

                                    {/* Wrapper for inline layout on small screens and up */}
                                    <div className="flex flex-col sm:flex-row sm:space-x-8">

                                        {/* isVerified Input Group */}
                                        <div className="flex flex-col">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    id="isVerified"
                                                    type="checkbox"
                                                    checked={data.isVerified}
                                                    onChange={(e) => setData("isVerified", e.target.checked)}
                                                    className="h-4 w-4 accent-indigo-500"
                                                    aria-label={t.isVerified}
                                                />
                                                <Label htmlFor="isVerified" className="text-base text-gray-900 dark:text-gray-50">
                                                    {t.isVerified}
                                                </Label>
                                            </div>
                                            {errors.isVerified && <p className={`mt-1 text-sm text-red-600 ${commonStyles.error}`}>{errors.isVerified}</p>}
                                        </div>

                                        {/* isActive Input Group */}
                                        {/* <div className="flex flex-col mt-4 sm:mt-0">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    id="isActive"
                                                    type="checkbox"
                                                    checked={data.isActive}
                                                    onChange={(e) => setData("isActive", e.target.checked)}
                                                    className="h-4 w-4 accent-indigo-500"
                                                    aria-label={t.isActive}
                                                />
                                                <Label htmlFor="isActive" className="text-base text-gray-900 dark:text-gray-50">
                                                    {t.isActive}
                                                </Label>
                                            </div>
                                            {errors.isActive && <p className={`mt-1 text-sm text-red-600 ${commonStyles.error}`}>{errors.isActive}</p>}
                                        </div> */}

                                    </div>
                                </div>
                            )}
                            {/* Form Actions */}
                            <div className="flex justify-end space-x-4 mt-8">
                                <Link
                                    href={route("users.index")}
                                    className={`${commonStyles.button} ${commonStyles.outlineButton} px-6 py-2.5`}
                                    aria-label={t.cancel}
                                >
                                    {t.cancel}
                                </Link>
                                <Button
                                    type="submit"
                                    className={`${commonStyles.button} ${commonStyles.indigoButton} px-6 py-2.5`}
                                    disabled={processing}
                                    aria-label={t.submit}
                                >
                                    {t.submit}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
