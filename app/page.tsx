import Workbench from "@/components/Workbench";

export default function Home() {
  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-display text-xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white">
            B
          </span>
          BrandShield AI
        </div>
        <a href="#try" className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-white">
          Start the demo
        </a>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-6 pt-14">
        <h1 className="max-w-3xl font-display text-5xl leading-[1.1] md:text-6xl">
          Catch brand mistakes before the world does.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Wrong numbers, expired offers, banned promises and off-tone language get flagged in seconds.
          Every issue names the rule it breaks and suggests a fix. A person makes the final call.
        </p>
      </section>

      <Workbench />

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted">
        BrandShield AI · Round 2 build · Arun Sharma · PayNest is a fictional brand used for the demo.
      </footer>
    </main>
  );
}
