"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureAudioUnlocked } from "@/lib/sfx";

export default function GameClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let game: import("phaser").Game | null = null;
    let cancelled = false;

    (async () => {
      const Phaser = (await import("phaser")).default;
      const { createMainScene } = await import("./scenes/mainScene");
      if (cancelled || !containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        width,
        height,
        backgroundColor: "#0b1020",
        physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 }, debug: false } },
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: createMainScene({
          onScore: (s) => setScore(s),
          onGameOver: (s) => {
            router.push(`/result?score=${s}`);
          },
        }),
      });
      setReady(true);
    })();

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [router]);

  return (
    <div
      className="relative flex-1 w-full overflow-hidden touch-none select-none"
      onPointerDown={ensureAudioUnlocked}
    >
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
        <div className="rounded-full bg-black/40 backdrop-blur px-5 py-2 text-white font-bold text-lg tracking-wider">
          {score}
        </div>
      </div>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-white/80">
          Loading…
        </div>
      )}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <div className="text-white/70 text-xs tracking-widest">TAP TO JUMP</div>
      </div>
    </div>
  );
}
