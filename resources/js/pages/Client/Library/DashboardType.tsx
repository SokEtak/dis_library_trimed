import { Globe, Library, BookOpen } from "lucide-react";
import { route } from "ziggy-js";
import React from "react";

/** ---------------------------------------------------
 * Utilities: Motion-safe helpers and class tokens
 * --------------------------------------------------- */
const motionSafe = "motion-safe:transition-all motion-safe:duration-300";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500";

/** ---------------------------------------------------
  Button: Premium gradient + shadows + a11y
  --------------------------------------------------- */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; className?: string };
const Button = ({ children, className = "", ...props }: ButtonProps) => (
  <button
    type="button"
    className={[
      "group/button inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-base font-bold tracking-wide",
      "shadow-[0_10px_30px_-16px_rgba(2,6,23,.3)] hover:shadow-[0_22px_54px_-18px_rgba(2,6,23,.5)] active:scale-[.97]",
      "bg-gradient-to-r from-blue-600 to-indigo-600 text-white",
      "dark:from-blue-500 dark:to-indigo-500",
      "transition-all duration-300 ease-in-out",
      focusRing,
      motionSafe,
      className,
    ].join(" ")}
    style={{ boxShadow: "0 4px 24px -8px rgba(59,130,246,0.18)" }}
    {...props}
  >
    <span className="transition-transform duration-300 group-hover/button:scale-110 group-active/button:scale-95">
      {children}
    </span>
  </button>
);

/** ---------------------------------------------------
 * Link: Keep anchor semantics + a11y focus ring
 * --------------------------------------------------- */
type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode; className?: string };
const Link = ({ href, children, className = "", ...props }: LinkProps) => (
  <a
    href={href}
    className={[focusRing, "rounded-3xl outline-none", className].join(" ")}
    {...props}
  >
    {children}
  </a>
);

const colorStyles = {
  cyan: {
    iconWrap: "from-cyan-50 to-sky-50 text-cyan-700 ring-cyan-100 dark:from-cyan-950/30 dark:to-sky-950/30 dark:text-cyan-300 dark:ring-cyan-900/40",
    iconWrapHover: "group-hover:from-cyan-100 group-hover:to-sky-100",
    titleHover: "group-hover:text-cyan-700 dark:group-hover:text-cyan-300",
    button: "from-cyan-500 to-sky-600 hover:from-cyan-500 hover:to-sky-700 dark:from-cyan-500 dark:to-sky-600",
    glow: "from-cyan-500/20 via-sky-500/20 to-cyan-500/20",
  },
  yellow: {
    iconWrap: "from-yellow-50 to-amber-50 text-amber-700 ring-amber-100 dark:from-yellow-950/30 dark:to-amber-950/30 dark:text-amber-300 dark:ring-amber-900/40",
    iconWrapHover: "group-hover:from-yellow-100 group-hover:to-amber-100",
    titleHover: "group-hover:text-amber-700 dark:group-hover:text-amber-300",
    button: "from-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 dark:from-amber-500 dark:to-yellow-600",
    glow: "from-amber-500/20 via-yellow-500/20 to-amber-500/20",
  },
  rose: {
    iconWrap: "from-rose-50 to-pink-50 text-rose-700 ring-rose-100 dark:from-rose-950/30 dark:to-pink-950/30 dark:text-rose-300 dark:ring-rose-900/40",
    iconWrapHover: "group-hover:from-rose-100 group-hover:to-pink-100",
    titleHover: "group-hover:text-rose-700 dark:group-hover:text-rose-300",
    button: "from-rose-500 to-pink-600 hover:from-rose-500 hover:to-pink-700 dark:from-rose-500 dark:to-pink-600",
    glow: "from-rose-500/20 via-pink-500/20 to-rose-500/20",
  },
};

function LibraryCard({ title, desc, colorKey, icon, href }: { title: string; desc: string; colorKey: keyof typeof colorStyles; icon: React.ReactNode; href: string; }) {
  const c = colorStyles[colorKey];
  return (
    <Link href={href} className="group block h-full">
      <div
        className={[
          "relative h-full rounded-3xl border border-white/50 bg-white/70 p-8 shadow-xl backdrop-blur-2xl",
          "dark:border-white/10 dark:bg-white/[0.08] dark:shadow-2xl",
          "transform transition-all duration-500 will-change-transform hover:-translate-y-3 hover:scale-[1.035] hover:shadow-2xl hover:shadow-blue-200/40 dark:hover:shadow-blue-900/30",
        ].join(" ")}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "radial-gradient(1200px 300px at 50% -10%, rgba(59,130,246,0.14), transparent 60%)" }} />
        <div className="relative z-[1] flex h-full flex-col items-center justify-between space-y-6 text-center">
          <div className="flex flex-col items-center space-y-6">
            <div className={["rounded-2xl p-6 ring-2 ring-inset bg-gradient-to-br", c.iconWrap, c.iconWrapHover, motionSafe, "transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg"].join(" ")}>
              <div className="transition-transform duration-700 group-hover:rotate-3 group-hover:scale-110">{icon}</div>
            </div>
            <h3 className={["text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white drop-shadow-sm transition-colors duration-300", c.titleHover].join(" ")}>{title}</h3>
            <p className="max-w-[32ch] text-balance text-gray-700 dark:text-gray-300 text-base opacity-90">{desc}</p>
            <div className={["mt-2 h-1 w-40 rounded-full bg-gradient-to-r blur-[2px] opacity-80", c.glow].join(" ")} />
          </div>
          <Button className={["mt-auto shadow-lg hover:shadow-xl bg-gradient-to-r", c.button, "transition-all duration-300"].join(" ")}>ចូលប្រើ</Button>
        </div>
      </div>
    </Link>
  );
}

const DashboardType = () => {
  const cards = [
    { title: "បណ្ណាល័យរូបវន្ត", desc: "ស្វែងរកសៀវភៅនៅក្នុងបណ្ណាល័យរបស់យើង", colorKey: "yellow" as const, icon: <Library className="h-8 w-8 sm:h-10 sm:w-10" />, route: route("local library") },
    { title: "បណ្ណាល័យអេឡិចត្រូនិក", desc: "សៀវ​ភៅឌីជីថលដែលអាចអានបានភ្លាមៗ", colorKey: "rose" as const, icon: <BookOpen className="h-8 w-8 sm:h-10 sm:w-10" />, route: route("global e-library") },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-fuchsia-200 via-sky-100 to-lime-100 dark:from-slate-950 dark:via-indigo-950 dark:to-blue-950 transition-colors duration-700 flex items-center justify-center py-16">
      {/* Background Decorators */}
      <div className="absolute inset-0 opacity-30 mix-blend-soft-light dark:opacity-20 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%271%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.02%27/%3E%3C/svg%3E")' }} />
      <div className="absolute inset-0 opacity-[0.25] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] pointer-events-none" style={{ backgroundImage: "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      <div className="absolute inset-0 -z-10 pointer-events-none">
         <div className="mx-auto h-[30rem] w-[30rem] translate-y-[-10%] rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,rgba(59,130,246,0.20)_0deg,rgba(16,185,129,0.18)_120deg,rgba(244,63,94,0.16)_240deg,rgba(59,130,246,0.20)_360deg)] blur-3xl dark:blur-[100px]" />
      </div>

      {/* Main Content (Now inside the wrapper) */}
      <div className="container relative z-10 mx-auto px-4 text-center">
        <a href="/" className="mb-10 inline-block transition-transform duration-300 hover:scale-110 drop-shadow-2xl" aria-label="ទៅកាន់ទំព័រដើម">
          <img src="/images/dis2.png" alt="DIS Library Logo" className="h-24 w-auto drop-shadow-2xl sm:h-32 md:h-36" />
        </a>

        <h1 className="mb-12 text-4xl font-extrabold leading-25 tracking-tight sm:text-5xl md:text-6xl bg-[linear-gradient(90deg,#2563eb_0%,#22c55e_50%,#a855f7_100%)] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(59,130,246,.18)]">
          បណ្ណាល័យឌីជីថលរបស់សាលាអន្តរជាតិ ឌូវី
        </h1>

        <div className="mx-auto grid max-w-5xl grid-cols-1 sm:grid-cols-2 gap-10">
          {cards.map((card, i) => (
            <LibraryCard key={i} title={card.title} desc={card.desc} colorKey={card.colorKey} icon={card.icon} href={card.route} />
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (prefers-reduced-motion: reduce) {
          .motion-safe\\:transition-all, .motion-safe\\:duration-300, .transition, .transform {
            animation: none !important;
            transition: none !important;
          }
        }
      `}} />
    </div>
  );
};

export default DashboardType;