import AdminLoanRequestAlerts from '@/components/admin-loan-request-alerts';
import { AppSidebar } from '@/components/app-sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { dashboardCards } from '@/config/dashboard-cards';
import echo from '@/lib/echo';
import { Link, router, usePage } from '@inertiajs/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import clsx from 'clsx';
import {
  ArrowRight,
  BookCopy,
  BookOpenCheck,
  Building2,
  CalendarDays,
  Layers,
  Library,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, type ElementType } from 'react';

interface DashboardProps {
  auth: { user: { name: string; email: string; roles: string[] } };
  bookStats: {
    ebookCount: number;
    physicalBookCount: number;
    trashBookCount?: number;
    missingBookCount: number;
    bookLoansCount: number;
    overdueLoansCount: number;
  };
  assetStats: { totalAssets: number };
  schoolStats: { totalSchools: number; totalRooms: number };
  userStats: { totalUsers: number };
  extraStats: {
    categoryCount: number;
    subcategoryCount: number;
    bookcaseCount: number;
    shelfCount: number;
    assetCategoryCount: number;
    assetTransactionCount?: number;
    supplierCount: number;
    roleCount?: number;
    permissionCount?: number;
    campusCount: number;
    buildingCount: number;
    departmentCount: number;
  };
}

type DashboardStats = Pick<
  DashboardProps,
  'bookStats' | 'assetStats' | 'schoolStats' | 'userStats' | 'extraStats'
>;

type StatCardColors = {
  bg?: string;
  border?: string;
  icon?: string;
  tooltipBg?: string;
  tooltipArrow?: string;
};

type DashboardCardDefinition = {
  title: string;
  value: number | string | ((stats: DashboardStats) => number | string);
  Icon?: ElementType;
  tooltip?: string;
  colors?: StatCardColors;
  href?: string;
  showFor?: readonly string[];
};

type ResolvedDashboardCard = Omit<DashboardCardDefinition, 'value'> & {
  value: number | string;
};

type CardWithMeta = ResolvedDashboardCard & {
  key: string;
  path: string;
  isAdminOnly: boolean;
};

type SectionTone = {
  surface: string;
  iconWrap: string;
  icon: string;
  badge: string;
  grid: string;
};

type SectionDefinition = {
  id: string;
  title: string;
  description: string;
  Icon: ElementType;
  tone: SectionTone;
  match: (card: CardWithMeta) => boolean;
};

type DashboardSection = Omit<SectionDefinition, 'match'> & {
  cards: CardWithMeta[];
};

const kmFormatter = (() => {
  try {
    return new Intl.NumberFormat('km-KH');
  } catch {
    return new Intl.NumberFormat();
  }
})();

const normalizePath = (path: string): string => {
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
};

const parseHrefPath = (href?: string): string => {
  if (!href) {
    return '';
  }

  try {
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsedUrl = new URL(href, baseOrigin);
    return normalizePath(parsedUrl.pathname);
  } catch {
    const [rawPath = '/'] = href.split('?');
    return normalizePath(rawPath);
  }
};

const pathMatches = (path: string, prefixes: string[]): boolean =>
  prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

const sectionDefinitions: SectionDefinition[] = [
  {
    id: 'library',
    title: 'ស្ថិតិបណ្ណាល័យ',
    description: 'ចំនួនសៀវភៅសរុប សៀវភៅដែលត្រូវបានបោះបង់ និងស្ថានភាពការខ្ចីត្រឡប់។',
    Icon: Library,
    tone: {
      surface: 'border-emerald-200/70 bg-white/80 dark:border-emerald-900/60 dark:bg-slate-950/70',
      iconWrap: 'bg-emerald-100/90 dark:bg-emerald-900/40',
      icon: 'text-emerald-600 dark:text-emerald-300',
      badge:
        'border-emerald-300/70 bg-emerald-100/70 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/40 dark:text-emerald-200',
      grid: 'xl:grid-cols-5',
    },
    match: (card) => pathMatches(card.path, ['/books', '/bookloans']),
  },
  {
    id: 'library-management',
    title: 'រចនាសម្ព័ន្ធបណ្ណាល័យ',
    description: 'គ្រប់គ្រងប្រភេទ និងទីតាំងផ្ទុកសៀវភៅ។',
    Icon: Layers,
    tone: {
      surface: 'border-cyan-200/70 bg-white/80 dark:border-cyan-900/60 dark:bg-slate-950/70',
      iconWrap: 'bg-cyan-100/90 dark:bg-cyan-900/40',
      icon: 'text-cyan-600 dark:text-cyan-300',
      badge:
        'border-cyan-300/70 bg-cyan-100/70 text-cyan-700 dark:border-cyan-700/60 dark:bg-cyan-900/40 dark:text-cyan-200',
      grid: 'xl:grid-cols-4',
    },
    match: (card) =>
      pathMatches(card.path, ['/categories', '/subcategories', '/bookcases', '/shelves']),
  },
  {
    id: 'school',
    title: 'ហេដ្ឋារចនាសម្ព័ន្ធសាលា',
    description: 'ទិន្នន័យសាលា និងសាខាដែលភ្ជាប់នឹងប្រព័ន្ធបណ្ណាល័យ។',
    Icon: Building2,
    tone: {
      surface: 'border-amber-200/70 bg-white/80 dark:border-amber-900/60 dark:bg-slate-950/70',
      iconWrap: 'bg-amber-100/90 dark:bg-amber-900/40',
      icon: 'text-amber-600 dark:text-amber-300',
      badge:
        'border-amber-300/70 bg-amber-100/70 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/40 dark:text-amber-200',
      grid: 'xl:grid-cols-4',
    },
    match: (card) =>
      pathMatches(card.path, ['/schools', '/rooms', '/campuses', '/buildings', '/departments']),
  },
  {
    id: 'assets',
    title: 'ប្រតិបត្តិការសម្ភារៈ',
    description: 'ប្រភេទសម្ភារៈ ប្រតិបត្តិការផ្លាស់ទី និងអ្នកផ្គត់ផ្គង់។',
    Icon: BookCopy,
    tone: {
      surface: 'border-violet-200/70 bg-white/80 dark:border-violet-900/60 dark:bg-slate-950/70',
      iconWrap: 'bg-violet-100/90 dark:bg-violet-900/40',
      icon: 'text-violet-600 dark:text-violet-300',
      badge:
        'border-violet-300/70 bg-violet-100/70 text-violet-700 dark:border-violet-700/60 dark:bg-violet-900/40 dark:text-violet-200',
      grid: 'xl:grid-cols-4',
    },
    match: (card) =>
      pathMatches(card.path, ['/assets', '/asset-categories', '/asset-transactions', '/suppliers']),
  },
  {
    id: 'admin',
    title: 'អ្នកប្រើប្រាស់ និងសុវត្ថិភាព',
    description: 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
    Icon: ShieldCheck,
    tone: {
      surface: 'border-rose-200/70 bg-white/80 dark:border-rose-900/60 dark:bg-slate-950/70',
      iconWrap: 'bg-rose-100/90 dark:bg-rose-900/40',
      icon: 'text-rose-600 dark:text-rose-300',
      badge:
        'border-rose-300/70 bg-rose-100/70 text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/40 dark:text-rose-200',
      grid: 'xl:grid-cols-4',
    },
    match: (card) => card.isAdminOnly || pathMatches(card.path, ['/users', '/roles', '/permissions']),
  },
];

function StatCard({ card }: { card: CardWithMeta }) {
  const Icon = card.Icon ?? Library;
  const value = typeof card.value === 'number' ? kmFormatter.format(card.value) : card.value;

  const content = (
    <div
      className={clsx(
        'group relative h-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/70 dark:bg-slate-900/80',
        card.colors?.bg,
        card.colors?.border
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300 opacity-75 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">{card.title}</p>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/70">
          <Icon className={clsx('h-5 w-5 text-slate-600 dark:text-slate-300', card.colors?.icon)} />
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between gap-2">
        <p className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</p>
        {card.href ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            មើល
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-white/5" />
    </div>
  );

  const interactiveContent = card.href ? (
    <Link
      href={card.href}
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {content}
    </Link>
  ) : (
    content
  );

  if (!card.tooltip) {
    return interactiveContent;
  }

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{interactiveContent}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className={clsx(
            card.colors?.tooltipBg ?? 'bg-slate-900',
            'max-w-xs rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white shadow-2xl'
          )}
          sideOffset={10}
        >
          {card.tooltip}
          <Tooltip.Arrow className={card.colors?.tooltipArrow ?? 'fill-slate-900'} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function DashboardSectionBlock({ section }: { section: DashboardSection }) {
  const Icon = section.Icon;

  return (
    <section className={clsx('rounded-3xl border p-5 shadow-sm sm:p-6', section.tone.surface)}>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={clsx('inline-flex h-12 w-12 items-center justify-center rounded-2xl', section.tone.iconWrap)}>
            <Icon className={clsx('h-6 w-6', section.tone.icon)} />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{section.title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{section.description}</p>
          </div>
        </div>

        <span
          className={clsx(
            'inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
            section.tone.badge
          )}
        >
          {kmFormatter.format(section.cards.length)} កាត
        </span>
      </div>

      <div className={clsx('grid gap-4 sm:grid-cols-2', section.tone.grid)}>
        {section.cards.map((card) => (
          <StatCard key={card.key} card={card} />
        ))}
      </div>
    </section>
  );
}

export default function Page() {
  const { auth, bookStats, assetStats, schoolStats, userStats, extraStats } = usePage<DashboardProps>().props;
  const userRoles = auth.user.roles;
  const isAdmin = userRoles.includes('admin');
  const reloadTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const echoInstance = echo;
    if (!echoInstance) {
      return;
    }

    const dashboardChannel = 'dashboard.summary';
    const channel = echoInstance.private(dashboardChannel);

    const handleSummaryUpdated = () => {
      if (reloadTimerRef.current !== null) {
        return;
      }

      reloadTimerRef.current = window.setTimeout(() => {
        reloadTimerRef.current = null;

        router.reload({
          only: ['bookStats', 'assetStats', 'schoolStats', 'userStats', 'extraStats'],
          preserveScroll: true,
          preserveState: true,
        });
      }, 200);
    };

    channel.listen('.dashboard.summary.updated', handleSummaryUpdated);

    return () => {
      if (reloadTimerRef.current !== null) {
        window.clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }

      channel.stopListening('.dashboard.summary.updated');
      echoInstance.leave(dashboardChannel);
    };
  }, []);

  const evaluatedCards: ResolvedDashboardCard[] = useMemo(
    () => {
      const currentStats: DashboardStats = { bookStats, assetStats, schoolStats, userStats, extraStats };

      return (dashboardCards as readonly DashboardCardDefinition[]).map((card) => ({
        ...card,
        value: typeof card.value === 'function' ? card.value(currentStats) : card.value,
      }));
    },
    [bookStats, assetStats, schoolStats, userStats, extraStats]
  );

  const visibleCards = useMemo(
    () =>
      evaluatedCards.filter((card) => {
        if (!card.showFor || card.showFor.length === 0) {
          return true;
        }

        return card.showFor.some((role) => userRoles.includes(role));
      }),
    [evaluatedCards, userRoles]
  );

  const sections = useMemo(() => {
    const cardsWithMeta: CardWithMeta[] = visibleCards.map((card, index) => ({
      ...card,
      key: `${card.title}-${card.href ?? 'nourl'}-${index}`,
      path: parseHrefPath(card.href),
      isAdminOnly: card.showFor?.includes('admin') ?? false,
    }));

    const sectionMap = new Map<string, CardWithMeta[]>(sectionDefinitions.map((definition) => [definition.id, []]));
    const leftovers: CardWithMeta[] = [];

    for (const card of cardsWithMeta) {
      const matchedSection = sectionDefinitions.find((section) => section.match(card));

      if (matchedSection) {
        sectionMap.get(matchedSection.id)?.push(card);
      } else {
        leftovers.push(card);
      }
    }

    const orderedSections: DashboardSection[] = sectionDefinitions
      .map((definition) => ({
        id: definition.id,
        title: definition.title,
        description: definition.description,
        Icon: definition.Icon,
        tone: definition.tone,
        cards: sectionMap.get(definition.id) ?? [],
      }))
      .filter((section) => section.cards.length > 0);

    if (leftovers.length > 0) {
      orderedSections.push({
        id: 'additional',
        title: 'សូចនាករបន្ថែម',
        description: 'ស្ថិតិបន្ថែមដែលមិនទាន់ស្ថិតក្នុងក្រុមស្តង់ដារ',
        Icon: Sparkles,
        tone: {
          surface: 'border-slate-200/70 bg-white/80 dark:border-slate-800/70 dark:bg-slate-950/70',
          iconWrap: 'bg-slate-100/90 dark:bg-slate-800/70',
          icon: 'text-slate-700 dark:text-slate-200',
          badge:
            'border-slate-300/70 bg-slate-100/70 text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-200',
          grid: 'xl:grid-cols-5',
        },
        cards: leftovers,
      });
    }

    return orderedSections;
  }, [visibleCards]);

  const totalBooks = (bookStats.ebookCount ?? 0) + (bookStats.physicalBookCount ?? 0);
  const trashedBooks = bookStats.trashBookCount ?? 0;
  const activeLoans = bookStats.bookLoansCount ?? 0;
  const overdueLoans = bookStats.overdueLoansCount ?? 0;
  const missingBooks = bookStats.missingBookCount ?? 0;
  const collectionHealth = Math.max(
    0,
    100 - Math.round(((overdueLoans + missingBooks) / Math.max(totalBooks, 1)) * 100)
  );

  const healthBarTone =
    collectionHealth >= 85
      ? 'from-emerald-200 via-lime-200 to-emerald-400'
      : collectionHealth >= 70
        ? 'from-amber-200 via-amber-300 to-orange-400'
        : 'from-rose-200 via-rose-300 to-red-400';

  const firstName = auth.user.name?.trim().split(/\s+/)[0] ?? auth.user.name ?? 'User';

  const quickActions = [
    {
      label: 'បង្កើតការខ្ចី',
      description: 'កត់ត្រាសំណើខ្ចីសៀវភៅថ្មី។',
      href: route('bookloans.create'),
      Icon: BookOpenCheck,
    },
    {
      label: 'បន្ថែមសៀវភៅ',
      description: 'ចុះបញ្ជីសៀវភៅថ្មីក្នុងកាតាឡុក។',
      href: route('books.create'),
      Icon: BookCopy,
    },
  ];

  const heroStats = [
    { label: 'សៀវភៅសរុប', value: totalBooks },
    { label: 'កំពុងខ្ចី', value: activeLoans },
    { label: 'ខ្ចីហួសកំណត់', value: overdueLoans },
    { label: 'សៀវភៅបោះបង់', value: trashedBooks },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AdminLoanRequestAlerts />

        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/80">
          <div className="flex w-full items-center gap-3 px-5">
            <SidebarTrigger className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" />
            <Separator orientation="vertical" className="h-5" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  ផ្ទាំងកិច្ចការ
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <Tooltip.Provider delayDuration={150}>
          <div className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_40%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,#082f49_0%,#020617_48%,#020617_100%)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_62%)]" />

            <div className="relative space-y-8 p-4 sm:p-6 lg:p-8 xl:p-10">
              <section className="relative overflow-hidden rounded-3xl border border-cyan-200/30 bg-[linear-gradient(130deg,#0f766e_0%,#0e7490_42%,#1d4ed8_100%)] p-6 text-white shadow-[0_30px_100px_-45px_rgba(14,116,144,0.95)] sm:p-8">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

                <div className="relative grid gap-8 xl:grid-cols-[1.2fr_1fr]">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100">
                      <CalendarDays className="h-3.5 w-3.5" />
                      សង្ខេបពេលវេលាពិត
                    </div>

                    <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">សូមស្វាគមន៍មកវិញ, {firstName}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-cyan-50/90 sm:text-base">
                      ផ្ទាំងគ្រប់គ្រងបណ្ណាល័យត្រូវបានរៀបចំថ្មី ដើម្បីឱ្យអ្នកមើលឃើញហានិភ័យ
                      កំណត់អាទិភាពការងារ និងសម្រេចចិត្តបានលឿនជាងមុន។
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {quickActions.map((action) => (
                        <Link
                          key={action.label}
                          href={action.href}
                          className="group rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        >
                          <div className="flex items-center justify-between">
                            <action.Icon className="h-5 w-5 text-cyan-100" />
                            <ArrowRight className="h-4 w-4 text-white/70 transition-transform group-hover:translate-x-0.5" />
                          </div>
                          <p className="mt-3 text-sm font-semibold text-white">{action.label}</p>
                          <p className="mt-1 text-xs leading-5 text-cyan-100/90">{action.description}</p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {heroStats.map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-2xl border border-white/25 bg-white/12 px-4 py-3 backdrop-blur-sm"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-100/90">
                            {stat.label}
                          </p>
                          <p className="mt-1 text-2xl font-semibold text-white">{kmFormatter.format(stat.value)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-white/25 bg-white/12 p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">
                          សុខភាពបណ្ណាល័យ
                        </p>
                        <p className="text-sm font-semibold text-white">{collectionHealth}%</p>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                        <div
                          className={clsx('h-full rounded-full bg-gradient-to-r transition-all duration-500', healthBarTone)}
                          style={{ width: `${collectionHealth}%` }}
                        />
                      </div>
                      <p className="mt-3 text-xs text-cyan-100/90">
                        {isAdmin
                          ? 'ការជូនដំណឹងសម្រាប់អ្នកគ្រប់គ្រង និងកាតស្ថិតិ នឹងធ្វើបច្ចុប្បន្នភាពពេលវេលាពិត។'
                          : 'កាតស្ថិតិនឹងធ្វើបច្ចុប្បន្នភាពពេលវេលាពិត នៅពេលទិន្នន័យសំខាន់ផ្លាស់ប្តូរ។'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {sections.length > 0 ? (
                sections.map((section) => <DashboardSectionBlock key={section.id} section={section} />)
              ) : (
                <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-center shadow-sm dark:border-slate-800/70 dark:bg-slate-950/70">
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    មិនមានកាតស្ថិតិសម្រាប់បង្ហាញទេ។
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    សូមបន្ថែមកាតក្នុងការកំណត់ dashboard ដើម្បីបង្ហាញស្ថិតិនៅទីនេះ។
                  </p>
                </section>
              )}
            </div>
          </div>
        </Tooltip.Provider>
      </SidebarInset>
    </SidebarProvider>
  );
}
