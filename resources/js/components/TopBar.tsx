// components/TopBar.tsx
"use client";

import { router } from '@inertiajs/react';
import { Globe, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { translations } from '@/utils/translations/library/translations';
import AppearanceToggleTab from './appearance-tabs';

interface AuthUser {
    name: string;
    email: string;
    avatar?: string;
    isVerified?: boolean;
}

interface TopBarProps {
    authUser?: AuthUser | null;
    language: 'en' | 'kh';
    onLanguageChange: () => void;
}

export default function TopBar({ authUser, language, onLanguageChange }: TopBarProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showEmailTooltip, setShowEmailTooltip] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const t = translations[language] || translations.en;

    const handleLanguageChange = () => {
        onLanguageChange();
        setShowUserMenu(false);
    };

    const handleLogout = () => {
        setShowUserMenu(false);
        router.post('/logout');
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    return (
        <header className="sticky top-0 z-50 bg-white py-4 shadow-md dark:bg-gray-800">
            <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-12">
                {/* Logo */}
                <a href="/" className="flex items-center">
                    <img
                        src="/images/dis2.png"
                        alt="Library Logo"
                        className="h-14 w-auto transition-transform hover:scale-105"
                    />
                </a>

                {/* Right actions */}
                {authUser && (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowUserMenu((v) => !v)}
                            onMouseEnter={() => setShowEmailTooltip(true)}
                            onMouseLeave={() => setShowEmailTooltip(false)}
                            className="flex items-center focus:outline-none"
                            aria-label={`${authUser.name}'s profile`}
                        >
                            <img
                                src={authUser.avatar ?? 'https://via.placeholder.com/40'}
                                alt={authUser.name}
                                className="h-12 w-12 rounded-full border-2 border-amber-500 transition-transform hover:scale-105"
                            />
                        </button>

                        {/* Email tooltip */}
                        {/* {showEmailTooltip && (
                            <div className="absolute right-1/2 translate-x-1/2 top-14 z-20 rounded-lg bg-gray-800 px-3 py-1 text-sm text-white shadow-md">
                                {authUser.email}
                            </div>
                        )} */}

                        {/* Popup Menu */}
                        {showUserMenu && (
                            <div className="absolute right-0 top-14 z-30 w-72 max-w-[90vw] -translate-x-1/4 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 transition-all duration-200 ease-out">
                                {/* User info */}
                                <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {authUser.name}
                                    </p>
                                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                                        {authUser.email}
                                    </p>
                                </div>

                                {/* Theme Toggle */}
                                <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                                    <AppearanceToggleTab />
                                </div>

                                {/* Language Switch */}
                                <button
                                    onClick={handleLanguageChange}
                                    className="flex w-full items-center gap-3 px-5 py-3 text-left text-gray-700 transition hover:bg-amber-100 dark:text-gray-200 dark:hover:bg-amber-900/30"
                                >
                                    <Globe className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    <span className="font-medium">{t.switch_language}</span>
                                </button>

                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 px-5 py-3 text-left text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span className="font-medium">{t.logout}</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
