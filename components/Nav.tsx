import Icon from "./Icon";

const LINKS = [
  ["How it works", "#how"],
  ["Try it", "#try"],
  ["Content Watch", "#watch"],
  ["Features", "#depth"],
  ["Trust", "#trust"],
];

/* Small floating pill, always visible. No full-width bar. */
export default function Nav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-3">
      <nav className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-[#0b1816]/85 p-1.5 text-sm text-[#f3efe4] shadow-xl backdrop-blur-md">
        <a href="#top" aria-label="BrandShield home" className="flex items-center gap-2 rounded-full px-3 py-1.5 text-mint">
          <Icon name="shield" className="h-5 w-5" />
          <span className="hidden font-display text-base text-[#f3efe4] sm:inline">BrandShield</span>
        </a>
        {LINKS.map(([label, href]) => (
          <a key={href} href={href} className="rounded-full px-3 py-1.5 hover:bg-white/10">
            {label}
          </a>
        ))}
        <a href="#try" className="ml-1 hidden rounded-full bg-mint px-4 py-1.5 font-medium text-night hover:bg-white sm:inline-block">
          Start the demo
        </a>
      </nav>
    </header>
  );
}
