import Icon from "./Icon";
import ScrollProgress from "./ScrollProgress";

const LINKS = [
  ["How it works", "/#how"],
  ["Why it works", "/#proof"],
  ["Live demo", "/#try"],
  ["Dashboards", "/dashboards"],
  ["Trust", "/#trust"],
];

/* Small floating pill, always visible. No full-width bar. */
export default function Nav() {
  return (
    <>
      <ScrollProgress />
      <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-3">
        <nav
          aria-label="Primary"
          className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-night/90 p-1.5 text-sm text-cream shadow-[0_18px_60px_-24px_rgba(0,0,0,0.9)] ring-1 ring-white/5 backdrop-blur-md"
        >
          <a href="/" aria-label="BrandShield home" className="flex items-center gap-2 rounded-full px-3 py-1.5 text-mint">
            <Icon name="shield" className="h-5 w-5" />
            <span className="hidden font-display text-base text-cream sm:inline">BrandShield</span>
          </a>
          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map(([label, href]) => (
              <a key={href} href={href} className="rounded-full px-3 py-1.5 text-cream/75 transition hover:bg-white/10 hover:text-cream">
                {label}
              </a>
            ))}
          </div>
          <a href="/app" className="rounded-full px-3 py-1.5 text-cream/75 hover:bg-white/10 lg:hidden">
            Workspace
          </a>
          <a
            href="/app"
            className="ml-1 hidden rounded-full bg-mint px-4 py-1.5 font-medium text-night shadow-[0_8px_30px_-12px_rgba(111,245,201,0.7)] transition hover:-translate-y-0.5 hover:bg-white md:inline-block"
          >
            Open workspace
          </a>
        </nav>
      </header>
    </>
  );
}
