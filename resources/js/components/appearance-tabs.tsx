import { Appearance, useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { LucideIcon, Moon, Sun, Monitor, Palette } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function AppearanceToggleTab({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'ភ្លឺ' },
        { value: 'dark', icon: Moon, label: 'ងងឹត' },
        { value: 'system', icon: Monitor, label: 'ប្រព័ន្ធ' },
        // { value: 'custom', icon: Palette, label: 'Custom' },
    ];

    return (
        <div className={cn('inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800', className)} {...props}>
            {tabs.map(({ value, icon: Icon, label }) => {
                const isActive = appearance === value;
                const base = 'flex items-center rounded-md px-3.5 py-1.5 transition-colors';
                const activeClasses =
                    value === 'custom'
                        ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow'
                        : 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100';
                const inactiveClasses =
                    value === 'custom'
                        ? 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-neutral-700/40'
                        : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60';

                return (
                    <button
                        key={value}
                        onClick={() => updateAppearance(value)}
                        className={cn(base, isActive ? activeClasses : inactiveClasses)}
                    >
                        <Icon className={cn('-ml-1 h-4 w-4', isActive ? 'text-white' : value === 'custom' ? 'text-pink-500' : '')} />
                        <span className="ml-1.5 text-sm">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
