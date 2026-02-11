
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardCards } from '@/config/dashboard-cards';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Link, usePage } from '@inertiajs/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Library, School, Package, Layers, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

interface DashboardProps {
  auth: { user: { name: string; email: string; roles: string[] } };
  bookStats: {ebookCount: number; physicalBookCount: number; missingBookCount: number; bookLoansCount: number; overdueLoansCount: number };
  assetStats: { totalAssets: number };
  schoolStats: { totalSchools: number; totalRooms: number };
  userStats: { totalUsers: number };
  extraStats: {
    categoryCount: number; subcategoryCount: number; bookcaseCount: number; shelfCount: number;
    assetCategoryCount: number; assetTransactionCount?: number; supplierCount: number;
    roleCount?: number; permissionCount?: number; campusCount: number; buildingCount: number; departmentCount: number;
  };
}

type StatCardColors = {
  bg?: string;
  border?: string;
  icon?: string;
  tooltipBg?: string;
  tooltipArrow?: string;
};

type StatCardProps = {
  title: string;
  value: number | string;
  Icon: React.ElementType;
  tooltipContent?: string;
  colors?: StatCardColors;
  href?: string;
};

// --------- Utilities ---------
const kmFormatter = (() => {
  try {
    return new Intl.NumberFormat('km-KH');
  } catch {
    return new Intl.NumberFormat(); // safe fallback
  }
})();

// Static theme variants (Tailwind-safe)
const sectionTheme = {
  library: {
    iconWrap: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-300 dark:from-emerald-800',
    label: 'ស្ថិតិបណ្ណាល័យ',
    Icon: Library,
  },
  libMgmt: {
    iconWrap: 'bg-cyan-100 dark:bg-cyan-900/40',
    iconColor: 'text-cyan-600',
    gradient: 'from-cyan-300 dark:from-cyan-800',
    label: 'គ្រប់គ្រងបណ្ណាល័យ',
    Icon: Layers,
  },
  asset: {
    iconWrap: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600',
    gradient: 'from-amber-300 dark:from-amber-800',
    label: 'គ្រប់គ្រងទ្រព្យសម្បត្តិ',
    Icon: Package,
  },
  school: {
    iconWrap: 'bg-purple-100 dark:bg-purple-900/40',
    iconColor: 'text-purple-600',
    gradient: 'from-purple-300 dark:from-purple-800',
    label: 'ហេដ្ឋារចនាសម្ព័ន្ធសាលា',
    Icon: School,
  },
  admin: {
    iconWrap: 'bg-rose-100 dark:bg-rose-900/40',
    iconColor: 'text-rose-600',
    gradient: 'from-rose-300 dark:from-rose-800',
    // label: 'គ្រប់គ្រងអ្នកប្រើប្រាស់ និងសិទ្ធិ',
    label: 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
    Icon: ShieldCheck,
  },
} as const;

// --------- Building Blocks ---------
function SectionHeader({
  themeKey,
  titleOverride,
}: {
  themeKey: keyof typeof sectionTheme;
  titleOverride?: string;
}) {
  const theme = sectionTheme[themeKey];
  const TitleIcon = theme.Icon;

  return (
    <div className="flex items-center gap-4">
      <div className={clsx("p-3 rounded-2xl", theme.iconWrap)}>
        <TitleIcon className={clsx("h-8 w-8", theme.iconColor)} />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        {titleOverride ?? theme.label}
      </h2>
      <div className={clsx("flex-1 h-px bg-gradient-to-r to-transparent", theme.gradient)} />
    </div>
  );
}

function StatCard({
  title,
  value,
  Icon,
  tooltipContent,
  colors,
  href,
}: StatCardProps) {
  const safeColors = {
    bg: colors?.bg ?? 'bg-white dark:bg-gray-800',
    border: colors?.border ?? 'border-gray-200/60 dark:border-gray-700/60',
    icon: colors?.icon ?? 'text-gray-600 dark:text-gray-400',
    tooltipBg: colors?.tooltipBg ?? 'bg-gray-800',
    tooltipArrow: colors?.tooltipArrow ?? 'fill-gray-800',
  };

  const inner = (
    <div
      role={href ? undefined : 'group'}
      tabIndex={href ? -1 : 0}
      aria-label={title}
      className={clsx(
        "group relative overflow-hidden rounded-2xl",
        safeColors.bg,
        "border", safeColors.border,
        "p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
        "backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/60"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900/50 shadow-inner">
          <Icon className={clsx("h-7 w-7 transition-transform group-hover:scale-110", safeColors.icon)} />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">
        {typeof value === 'number' ? kmFormatter.format(value) : value}
      </p>
      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 dark:to-black/10 pointer-events-none" />
    </div>
  );

  const content = href ? (
    <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/60 rounded-2xl">
      {inner}
    </Link>
  ) : inner;

  return tooltipContent ? (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className={clsx(
            safeColors.tooltipBg,
            "text-white text-sm font-medium rounded-xl px-4 py-2.5 shadow-2xl border border-white/20"
          )}
          sideOffset={10}
        >
          {tooltipContent}
          <Tooltip.Arrow className={safeColors.tooltipArrow} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  ) : content;
}

// Optional: lightweight skeleton if you load async
function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 p-6">
      <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700 mb-4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 w-2/5 mb-2 rounded" />
      <div className="h-7 bg-gray-200 dark:bg-gray-700 w-1/3 rounded" />
    </div>
  );
}

// --------- Page ---------
export default function Page() {
  const { auth, bookStats, assetStats, schoolStats, userStats, extraStats } = usePage<DashboardProps>().props;
  const isAdmin = auth.user.roles.includes('admin');
  const stats = { bookStats, assetStats, schoolStats, userStats, extraStats };

  // Evaluate dynamic values
  const evaluatedCards = dashboardCards.map(card => ({
    ...card,
    value: typeof card.value === 'function' ? card.value(stats) : card.value,
  }));

  // ✅ Fix: Correct showFor filtering (no operator precedence bug)
  const visibleCards = evaluatedCards.filter(card => {
    if (!card.showFor || card.showFor.length === 0) return true;
    if (card.showFor.includes('admin')) return isAdmin;
    // add more role checks if needed:
    return card.showFor.some((role: string) => auth.user.roles.includes(role));
  });

  // Grouped cards
  const libraryStatsCards = visibleCards.filter(card =>
    ['សៀវភៅសរុប','សៀវភៅបោះបង់', 'សៀវភៅអេឡិចត្រូនិក', 'សៀវភៅរូបវន្ត', 'កំពុងខ្ចីសរុប', 'ខ្ចីលើសកាលកំណត់'].includes(card.title)
  );

  const libraryManagementCards = visibleCards.filter(card =>
    ['ប្រភេទសៀវភៅ', 'ប្រភេទរង', 'ទូរសៀវភៅ', 'ធ្នើរ/ថតទូរ'].includes(card.title)
  );

  const assetManagementCards = visibleCards.filter(card =>
    ['សម្ភារៈសរុប', 'ប្រភេទសម្ភារៈ', 'ការផ្លាស់ទី', 'អ្នកផ្គត់ផ្គង់'].includes(card.title)
  );

  const schoolInfraCards = visibleCards.filter(card =>
    ['បន្ទប់សរុប', 'អគារ', 'ការិយាល័យ'].includes(card.title)
  );

  const adminCards = visibleCards.filter(card => Array.isArray(card.showFor) && card.showFor.includes('admin'));

  const firstName = auth.user.name?.split(' ')[0] ?? auth.user.name;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-gray-200/60 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-5 w-full">
            <SidebarTrigger className="text-gray-600 hover:text-gray-900" />
            <Separator orientation="vertical" className="h-5" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  ផ្ទាំងកិច្ចការ
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <Tooltip.Provider delayDuration={180}>
          <div className="p-6 lg:p-8 xl:p-10 space-y-12 bg-gradient-to-br from-gray-50/50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900/95 dark:to-indigo-950/20">

            {/* Welcome Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-10 text-white shadow-2xl">
              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  ជំរាបសួរ, {firstName}!
                </h1>
                <p className="mt-3 text-lg/7 opacity-90">
                  សូមស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រងបណ្ណាល័យរបស់សកលវិទ្យាល័យអន្តរជាតិ ឌូវី
                </p>
              </div>
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
            </div>

            {/* Library Statistics */}
            {libraryStatsCards.length > 0 && (
              <section className="space-y-6">
                <SectionHeader themeKey="library" />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                  {libraryStatsCards.map((card: any, i: number) => (
                    <StatCard
                      key={`lib-stat-${i}-${card.title}`}
                      title={card.title}
                      value={card.value}
                      Icon={card.Icon ?? Library}
                      tooltipContent={card.tooltip}
                      colors={card.colors}
                      href={card.href}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Library Management */}
            {libraryManagementCards.length > 0 && (
              <section className="space-y-6">
                <SectionHeader themeKey="libMgmt" />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {libraryManagementCards.map((card: any, i: number) => (
                    <StatCard
                      key={`lib-mgmt-${i}-${card.title}`}
                      title={card.title}
                      value={card.value}
                      Icon={card.Icon ?? Layers}
                      tooltipContent={card.tooltip}
                      colors={card.colors}
                      href={card.href}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Admin Only */}
            {isAdmin && adminCards.length > 0 && (
              <section className="space-y-6">
                <SectionHeader themeKey="admin" />
                <div className="grid gap-5 sm:grid-cols-4 lg:grid-cols-4">
                  {adminCards.map((card: any, i: number) => (
                    <StatCard
                      key={`admin-${i}-${card.title}`}
                      title={card.title}
                      value={card.value}
                      Icon={card.Icon ?? ShieldCheck}
                      tooltipContent={card.tooltip}
                      colors={card.colors}
                      href={card.href}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </Tooltip.Provider>
      </SidebarInset>
    </SidebarProvider>
  );
}
