import Link from "next/link";

type Props = {
  searchParams: Promise<{ score?: string }>;
};

export default async function ResultPage({ searchParams }: Props) {
  const { score: scoreParam } = await searchParams;
  const score = Number(scoreParam ?? 0);
  const tier =
    score >= 3000
      ? "Platinum"
      : score >= 1500
        ? "Gold"
        : score >= 500
          ? "Silver"
          : "Bronze";

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-[#0b1020] to-[#1b2a5e] text-white text-center gap-6">
      <p className="text-sm opacity-70 tracking-widest">YOUR SCORE</p>
      <p className="text-7xl font-extrabold text-yellow-300">{score}</p>
      <p className="text-xl font-semibold">
        Tier: <span className="text-yellow-300">{tier}</span>
      </p>
      <div className="mt-4 w-full max-w-xs rounded-2xl border border-white/20 bg-white/5 backdrop-blur p-6">
        <p className="text-xs opacity-60 mb-2">Coupon reveal placeholder</p>
        <p className="text-lg font-bold">Scratch card coming in M4</p>
      </div>
      <div className="flex gap-3 mt-4">
        <Link
          href="/play"
          className="rounded-full bg-yellow-300 px-6 py-3 font-bold text-[#0b1020]"
        >
          Play Again
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/30 px-6 py-3"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
