import { type SharedData } from '@/types';
import echo from '@/lib/echo';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
  BookOpenIcon,
  LayoutDashboardIcon,
  MenuIcon,
  XIcon,
  UserIcon,
  BarChart3Icon,
  BookTextIcon,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';

// Define the props interface
type WelcomeProps = SharedData & {
  auth: { user: { name: string; roles: string[] } | null };
  bookCount: number;
  ebookCount: number;
  userCount: number;
  canLogin?: boolean;
  canRegister?: boolean;
};

interface CountingStatProps {
  endValue: number;
  duration: number; // Duration in milliseconds
}

const CountingStat: React.FC<CountingStatProps> = ({ endValue, duration }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let rafId: number;
    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      const currentValue = Math.floor(percentage * endValue);
      setCount(currentValue);

      if (percentage < 1) {
        rafId = requestAnimationFrame(animateCount);
      }
    };

    rafId = requestAnimationFrame(animateCount);
    return () => cancelAnimationFrame(rafId);
  }, [endValue, duration]);

  return <>{count.toLocaleString()}</>;
};

// NavUser Component
interface NavUserProps {
  auth: WelcomeProps['auth'];
  canRegister?: boolean;
}

const buttonBase =
  'inline-flex items-center justify-center gap-1 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 active:scale-[0.98]';
const buttonPrimary =
  'bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500';
const buttonSuccess =
  'bg-green-500 text-white hover:bg-green-600 dark:hover:bg-green-500';
const buttonDanger =
  'bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-600';
const buttonGhost =
  'border border-gray-300 text-gray-900 hover:border-blue-600 dark:border-gray-600 dark:text-gray-200 dark:hover:border-blue-400';

const NavUser: React.FC<NavUserProps> = ({ auth, canRegister }) => {
  const isStaffOrAdmin =
    auth.user && (auth.user.roles.includes('staff') || auth.user.roles.includes('admin'));

  return (
    <div className="ml-auto flex items-center">
      {auth.user ? (
        <ButtonGroup className="items-center" orientation="horizontal">
          <Button asChild className={`${buttonSuccess}`}>
            <Link href={route('library-type-dashboard')} aria-label="Browse Books">
              <BookOpenIcon size={16} />
              ពិភពសៀវភៅ
            </Link>
          </Button>

          {isStaffOrAdmin && (
            <Button asChild className={`${buttonPrimary}`}>
              <Link href={route('dashboard')} aria-label="Open Dashboard">
                <LayoutDashboardIcon size={16} />
                ផ្ទាំងគ្រប់គ្រង
              </Link>
            </Button>
          )}

          <Button asChild className={`${buttonDanger}`}>
            <Link href={route('logout')} method="post" as="button" aria-label="Logout">
              <LogOut size={16} />
              ចាកចេញ
            </Link>
          </Button>
        </ButtonGroup>
      ) : (
        <ButtonGroup className="items-center" orientation="horizontal">
          <Button asChild className={`${buttonPrimary}`}>
            <Link href={route('login')} aria-label="Login">
              <LogIn size={16} />
              ចុះឈ្មោះចូល
            </Link>
          </Button>

          {canRegister && (
            <Button asChild className={`${buttonGhost}`}>
              <Link href={route('register')} aria-label="Sign Up">
                Sign Up
              </Link>
            </Button>
          )}
        </ButtonGroup>
      )}
    </div>
  );
};

export default function Welcome() {
  const { auth, bookCount, ebookCount, userCount, canLogin, canRegister } =
    usePage<WelcomeProps>().props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const reloadTimerRef = useRef<number | null>(null);

  const isStaffOrAdmin =
    auth.user && (auth.user.roles.includes('staff') || auth.user.roles.includes('admin'));
  const totalLibraryItems = bookCount + ebookCount;
  const animationDuration = 2000;

  const handleNavigation = () => setIsMenuOpen(false);

  useEffect(() => {
    const echoInstance = echo;
    if (!echoInstance) {
      return;
    }

    const publicSummaryChannel = 'public.summary';
    const channel = echoInstance.channel(publicSummaryChannel);

    const handleSummaryUpdated = () => {
      if (reloadTimerRef.current !== null) {
        return;
      }

      reloadTimerRef.current = window.setTimeout(() => {
        reloadTimerRef.current = null;

        router.reload({
          only: ['bookCount', 'ebookCount', 'userCount'],
          preserveScroll: true,
          preserveState: true,
        });
      }, 250);
    };

    channel.listen('.dashboard.summary.updated', handleSummaryUpdated);

    return () => {
      if (reloadTimerRef.current !== null) {
        window.clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }

      channel.stopListening('.dashboard.summary.updated');
      echoInstance.leave(publicSummaryChannel);
    };
  }, []);

  return (
    <>
      <Head title="សូមស្វាគមន៏">
        {/* <link rel="preconnect" href="https://fonts.bunny.net" />
        <link
          href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
          rel="stylesheet"
        /> */}
      </Head>

      {/* Page wrapper with subtle gradient and grid texture */}
      <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC] font-['Instrument_Sans']">
        {/* Ambient gradient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_30%_10%,rgba(59,130,246,0.12)_0%,transparent_60%),radial-gradient(60%_60%_at_70%_30%,rgba(34,197,94,0.10)_0%,transparent_55%)] dark:bg-[radial-gradient(60%_60%_at_30%_10%,rgba(59,130,246,0.15)_0%,transparent_60%),radial-gradient(60%_60%_at_70%_30%,rgba(16,185,129,0.14)_0%,transparent_55%)]"
        />
        {/* Dotted grid overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
          style={{
            backgroundImage:
              'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            backgroundPosition: 'center',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 hidden dark:block opacity-[0.16] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
          style={{
            backgroundImage:
              'linear-gradient(#1f2937 1px, transparent 1px), linear-gradient(90deg, #1f2937 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            backgroundPosition: 'center',
          }}
        />

        {/* Header */}
        <header className="sticky top-0 z-20 w-full border-b border-gray-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-gray-800/70 dark:bg-[#0a0a0a]/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <img
                src="/images/dis2.png"
                alt="Dewey Digital Library Logo"
                className="h-18 w-auto object-contain transition-transform duration-1000 hover:scale-105 animate-pulse "
              />
              <span className="sr-only">Home</span>
            </Link>

            {/* Desktop actions */}
            <div className="hidden w-full items-center justify-end sm:flex">
              <NavUser auth={auth} canRegister={canRegister} />
            </div>

            {/* Mobile: menu toggle */}
            <button
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-800 sm:hidden"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {isMenuOpen && (
            <div className="sm:hidden">
              <div
                className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px]"
                aria-hidden="true"
                onClick={handleNavigation}
              />
              <div className="fixed inset-x-0 top-[64px] z-40 origin-top transform animate-[slideDown_180ms_ease-out] border-b border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-[#0a0a0a]">
                <button
                  aria-label="Close menu"
                  onClick={handleNavigation}
                  className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <XIcon size={18} />
                </button>
                <nav className="flex flex-col gap-4">
                  {auth.user ? (
                    <ButtonGroup orientation="vertical" className="w-full">
                      <Button asChild className={`${buttonSuccess} w-full`} onClick={handleNavigation}>
                        <Link href={route('library-type-dashboard')} aria-label="Browse Books">
                          <BookOpenIcon size={18} />
                          ពិភពសៀវភៅ
                        </Link>
                      </Button>

                      {isStaffOrAdmin && (
                        <Button asChild className={`${buttonPrimary} w-full`} onClick={handleNavigation}>
                          <Link href={route('dashboard')} aria-label="Open Dashboard">
                            <LayoutDashboardIcon size={16} />
                            ផ្ទាំងគ្រប់គ្រង
                          </Link>
                        </Button>
                      )}

                      <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800" />

                      <Button asChild className={`${buttonDanger} w-full`} onClick={handleNavigation}>
                        <Link href={route('logout')} method="post" as="button" aria-label="Logout">
                          <LogOut size={16} />
                          ចាកចេញ
                        </Link>
                      </Button>
                    </ButtonGroup>
                  ) : (
                    <ButtonGroup orientation="vertical" className="w-full">
                      <Button asChild className={`${buttonPrimary} w-full`} onClick={handleNavigation}>
                        <Link href={route('login')} aria-label="Login">
                          <LogIn size={16} />
                          ចុះឈ្មោះចូល
                        </Link>
                      </Button>

                      {canRegister && (
                        <Button asChild className={`${buttonGhost} w-full`} onClick={handleNavigation}>
                          <Link href={route('register')} aria-label="Sign Up">
                            Sign Up
                          </Link>
                        </Button>
                      )}
                    </ButtonGroup>
                  )}
                </nav>
              </div>
            </div>
          )}
        </header>

        {/* Main */}
        <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center sm:gap-8 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <h2 className="mb-0 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {auth.user ? (
              <>
                សូមស្វាគមន៍,{` `}
                <span className="mt-2 block bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-emerald-400 sm:mt-0 sm:inline-block">
                  {auth.user.name}
                </span>
              </>
            ) : (
              <>
                <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent leading-tight tracking-tight sm:inline-block dark:from-blue-400 dark:to-emerald-400 w-400 sm:w-300">
                  បណ្ណាល័យរបស់សាលាអន្តរជាតិ ឌូវី
                </span>
              </>
            )}
          </h2>

          <p className="max-w-3xl text-lg leading-relaxed text-gray-700 dark:text-gray-300 sm:text-xl lg:text-2xl">
            {auth.user ? (
              isStaffOrAdmin ? (
                <>ផ្ទាំងគ្រប់គ្រប់គ្រង៖គ្រប់គ្រងប្រព័ន្ធ  ទាំងមូល ចាប់ពីការគ្រប់គ្រងសៀវភៅ គណនីអ្នកប្រើប្រាស់ រហូតដល់ការកំណត់ប្រព័ន្ធ ទាំងអស់នៅក្នុងផ្ទាំងតែមួយ</>
              ) : (
                <>ស្វែងរកសៀវភៅ និងសៀវភៅអេឡិចត្រូនិកថ្មីៗ ដោយងាយស្រួល តាមដានការអានរបស់អ្នក និងគ្រប់គ្រងបញ្ជីបណ្ណាល័យផ្ទាល់ខ្លួនរបស់អ្នក</>
              )
            ) : (
              <>
                ស្វែងរកសៀវភៅចំនួន {totalLibraryItems} ក្បាលដែលមានទាំងសៀវភៅរូបវន្ត និងសៀវភៅឌីជីថល។ ចាប់ផ្តើមឥឡូវនេះ!
              </>
            )}
          </p>

          {/* Stats */}
          <div className="mt-8 grid w-full max-w-4xl grid-cols-2 justify-center gap-5 sm:mt-10 sm:gap-8 md:grid-cols-4 lg:gap-10">
            <div className="group rounded-xl border border-gray-200/70 bg-white/70 p-6 shadow-sm ring-1 ring-transparent backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-blue-100 dark:border-gray-700/70 dark:bg-[#111111]/60 dark:hover:ring-blue-900/40 sm:p-7">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-colors group-hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900/40">
                <BookOpenIcon size={24} />
              </div>
              <h3 className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 sm:text-3xl">
                <CountingStat endValue={totalLibraryItems} duration={animationDuration} />
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">សៀវភៅសរុប</p>
            </div>

            <div className="group rounded-xl border border-gray-200/70 bg-white/70 p-6 shadow-sm ring-1 ring-transparent backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-blue-100 dark:border-gray-700/70 dark:bg-[#111111]/60 dark:hover:ring-blue-900/40 sm:p-7">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-blue-600 ring-1 ring-indigo-100 transition-colors group-hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-blue-400 dark:ring-indigo-900/40">
                <BarChart3Icon size={24} />
              </div>
              <h3 className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 sm:text-3xl">
                <CountingStat endValue={bookCount} duration={animationDuration} />
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">សៀវភៅរូបវន្តសរុប</p>
            </div>

            <div className="group rounded-xl border border-gray-200/70 bg-white/70 p-6 shadow-sm ring-1 ring-transparent backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-blue-100 dark:border-gray-700/70 dark:bg-[#111111]/60 dark:hover:ring-blue-900/40 sm:p-7">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 text-blue-600 ring-1 ring-sky-100 transition-colors group-hover:bg-sky-100 dark:bg-sky-950/30 dark:text-blue-400 dark:ring-sky-900/40">
                <BookTextIcon size={24} />
              </div>
              <h3 className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 sm:text-3xl">
                <CountingStat endValue={ebookCount} duration={animationDuration} />
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">សៀវភៅឌីជីថលសរុប</p>
            </div>

            <div className="group rounded-xl border border-gray-200/70 bg-white/70 p-6 shadow-sm ring-1 ring-transparent backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-blue-100 dark:border-gray-700/70 dark:bg-[#111111]/60 dark:hover:ring-blue-900/40 sm:p-7">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-blue-600 ring-1 ring-emerald-100 transition-colors group-hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-blue-400 dark:ring-emerald-900/40">
                <UserIcon size={24} />
              </div>
              <h3 className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 sm:text-3xl">
                <CountingStat endValue={userCount} duration={animationDuration} />
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">សមាជិកសរុប</p>
            </div>
          </div>

          {/* CTA (only for guests) */}
          {!auth.user && canLogin && canRegister && (
            <div className="mt-12 flex flex-col gap-4 sm:mt-16 sm:flex-row">
              <Link
                href={route('register')}
                className={`${buttonBase} ${buttonPrimary} px-8 py-3 text-base shadow-lg hover:shadow-blue-200/60 dark:hover:shadow-blue-900/30`}
              >
                Start Your Journey Today
              </Link>
              <Link
                href={route('login')}
                className={`${buttonBase} ${buttonGhost} px-8 py-3 text-base`}
              >
                Explore Catalog
              </Link>
            </div>
          )}
        </main>

        <footer className="mt-auto border-t border-gray-200/70 bg-white/40 p-4 text-center text-sm text-gray-600 backdrop-blur dark:border-gray-800/70 dark:bg-[#0a0a0a]/40 dark:text-gray-400 sm:p-6">
          © {new Date().getFullYear()} រក្សាសិទ្ធិគ្រប់យ៉ាងដោយសាលាអន្តរជាតិ ឌូវី
        </footer>
      </div>

      {/* Keyframes for mobile dropdown */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
