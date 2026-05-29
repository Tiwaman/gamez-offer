import Link from "next/link";

export default function PlayPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-[#1b2a5e] to-[#3a6bd6] text-white text-center gap-6">
      <h1 className="text-3xl font-bold">Game canvas coming soon</h1>
      <p className="opacity-80 max-w-xs">
        Phaser game engine will load here in Milestone 2. For now, this is a
        placeholder so we can verify routing and deployment.
      </p>
      <Link
        href="/result?score=420"
        className="rounded-full bg-yellow-300 px-8 py-3 font-bold text-[#0b1020]"
      >
        Simulate Game Over
      </Link>
      <Link href="/" className="text-xs opacity-60 underline">
        Back home
      </Link>
    </main>
  );
}
