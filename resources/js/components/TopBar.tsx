// components/TopBar.tsx
"use client";

import { router } from '@inertiajs/react';
import { Globe, LogOut, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { translations } from '@/utils/translations/library/translations';
import AppearanceToggleTab from './appearance-tabs';

interface AuthUser {
    name: string;
    email: string;
    avatar?: string;
    isVerified?: boolean;
}

interface SearchSuggestion {
    id: number;
    title: string;
}

interface TopBarProps {
    authUser?: AuthUser | null;
    language: 'en' | 'kh';
    onLanguageChange: () => void;
    searchIndexUrl?: string;
    searchSuggestions?: SearchSuggestion[];
}

export default function TopBar({
    authUser,
    language,
    onLanguageChange,
    searchIndexUrl,
    searchSuggestions = [],
}: TopBarProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    const t = translations[language] || translations.en;

    const filteredSuggestions = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase();

        if (!normalizedSearch) {
            return [];
        }

        return searchSuggestions
            .filter((suggestion) => {
                const normalizedTitle = suggestion.title.toLowerCase();
                return normalizedTitle.includes(normalizedSearch);
            })
            .sort((firstSuggestion, secondSuggestion) => firstSuggestion.title.localeCompare(secondSuggestion.title));
    }, [searchText, searchSuggestions]);

    const handleLanguageChange = () => {
        onLanguageChange();
        setShowUserMenu(false);
    };

    const handleLogout = () => {
        setShowUserMenu(false);
        router.post('/logout');
    };

    const handleSearchSubmit = (rawValue?: string) => {
        if (!searchIndexUrl) {
            return;
        }

        const query = (rawValue ?? searchText).trim();

        if (!query) {
            return;
        }

        setShowSearchSuggestions(false);
        router.get(searchIndexUrl, { search: query, page: 1 });
    };

    // Click outside handlers
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setShowUserMenu(false);
            }

            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setShowSearchSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-white py-2 sm:py-3 shadow-md dark:bg-gray-800">
            <div className="mx-auto grid max-w-[1440px] grid-cols-3 items-center gap-1 px-2 sm:gap-2 sm:px-3 md:gap-3 lg:gap-4 lg:px-8">
                {/* Logo */}
                <a href="/" className="flex shrink-0 items-center justify-start">
                    <img
                        src="/images/dis2.png"
                        alt="Library Logo"
                        className="h-10 w-auto sm:h-12 md:h-14 transition-transform hover:scale-105"
                    />
                </a>

                {/* Center search */}
                <div ref={searchRef} className="relative flex justify-center w-full min-w-0 px-1 sm:px-2">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-500 dark:text-cyan-300" />
                    <input
                        type="text"
                        value={searchText}
                        onChange={(event) => {
                            setSearchText(event.target.value);
                            setShowSearchSuggestions(true);
                        }}
                        onFocus={() => setShowSearchSuggestions(true)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                handleSearchSubmit();
                            }

                            if (event.key === 'Escape') {
                                setShowSearchSuggestions(false);
                            }
                        }}
                        placeholder={t.searchPlaceholder}
                        aria-label={language === 'en' ? 'Search books' : 'ស្វែងរកសៀវភៅ'}
                        className="h-8 sm:h-9 md:h-10 w-full max-w-xs sm:max-w-sm md:max-w-md rounded-lg sm:rounded-xl border border-cyan-200 bg-white/90 pl-8 sm:pl-10 pr-8 sm:pr-10 text-xs sm:text-sm text-gray-800 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:border-cyan-900 dark:bg-gray-900/80 dark:text-gray-100"
                    />
                    {searchText && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchText('');
                                setShowSearchSuggestions(false);
                            }}
                            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-gray-500 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            aria-label={language === 'en' ? 'Clear search' : 'សម្អាត'}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    {showSearchSuggestions && searchText.trim().length > 0 && (
                        <div className="absolute top-[calc(100%+0.35rem)] z-[70] w-full overflow-hidden rounded-xl border border-cyan-200 bg-white/98 shadow-2xl backdrop-blur dark:border-cyan-900 dark:bg-gray-900/98">
                            {filteredSuggestions.length > 0 ? (
                                <ul className="max-h-80 overflow-y-auto py-1">
                                    {filteredSuggestions.map((suggestion) => (
                                        <li key={suggestion.id}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchText(suggestion.title);
                                                    handleSearchSubmit(suggestion.title);
                                                }}
                                                className="block w-full truncate px-3 py-2 text-left text-sm font-semibold text-gray-900 transition-colors hover:bg-cyan-50 dark:text-gray-100 dark:hover:bg-gray-800"
                                            >
                                                {suggestion.title}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                                    {language === 'en' ? 'No suggestions found.' : 'មិនមានការណែនាំ'}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right actions */}
                <div className="relative flex h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12 shrink-0 items-center justify-end justify-self-end" ref={menuRef}>
                    {authUser && (
                        <button
                            onClick={() => setShowUserMenu((v) => !v)}
                            className="flex items-center focus:outline-none"
                            aria-label={`${authUser.name}'s profile`}
                        >
                            <img
                                src={authUser.avatar ?? 'https://via.placeholder.com/40'}
                                alt={authUser.name}
                                className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full border-2 border-amber-500 transition-transform hover:scale-105"
                            />
                        </button>
                    )}

                    {/* Email tooltip */}
                    {/* {showEmailTooltip && (
                        <div className="absolute right-1/2 translate-x-1/2 top-14 z-20 rounded-lg bg-gray-800 px-3 py-1 text-sm text-white shadow-md">
                            {authUser.email}
                        </div>
                    )} */}

                    {/* Popup Menu */}
                    {showUserMenu && authUser && (
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
            </div>
        </header>
    );
}
