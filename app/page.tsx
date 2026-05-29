import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-between px-6 py-12 bg-gradient-to-b from-[#0b1020] via-[#1b2a5e] to-[#3a6bd6] text-white">
      <header className="w-full max-w-md flex items-center justify-between">
        <span className="text-sm font-semibold tracking-widest opacity-80">
          SKYJUMP
        </span>
        <span className="text-xs opacity-60">Rewards</span>
      </header>

      <section className="w-full max-w-md flex flex-col items-center text-center gap-6">
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
          Jump to the sky.
          <br />
          <span className="text-yellow-300">Win real coupons.</span>
        </h1>
        <p className="text-base opacity-80 max-w-xs">
          Tap to leap from platform to platform. The higher you climb, the
          better the brand discount you unlock.
        </p>
        <Link
          href="/play"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-yellow-300 px-10 py-4 text-lg font-bold text-[#0b1020] shadow-lg shadow-yellow-300/30 active:scale-95 transition"
        >
          Play Now
        </Link>
        <p className="text-xs opacity-60">No signup. Free to play.</p>
      </section>

      <footer className="text-[10px] opacity-50 tracking-wider">
        v0.1 · Built on Vercel
      </footer>
    </main>
  );
}
