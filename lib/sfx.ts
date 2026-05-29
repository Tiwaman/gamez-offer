let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type ToneOpts = {
  freqStart: number;
  freqEnd?: number;
  durationMs: number;
  type?: OscillatorType;
  gain?: number;
};

function tone({
  freqStart,
  freqEnd,
  durationMs,
  type = "sine",
  gain = 0.18,
}: ToneOpts) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const dur = durationMs / 1000;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, now);
  if (freqEnd && freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, freqEnd),
      now + dur,
    );
  }
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

export const sfx = {
  jump() {
    tone({
      freqStart: 380,
      freqEnd: 720,
      durationMs: 140,
      type: "triangle",
      gain: 0.12,
    });
  },
  land() {
    tone({
      freqStart: 220,
      freqEnd: 140,
      durationMs: 90,
      type: "sine",
      gain: 0.14,
    });
  },
  score(n: number) {
    const base = 540 + Math.min(12, n) * 24;
    tone({
      freqStart: base,
      freqEnd: base * 1.5,
      durationMs: 120,
      type: "square",
      gain: 0.07,
    });
  },
  fall() {
    tone({
      freqStart: 420,
      freqEnd: 70,
      durationMs: 700,
      type: "sawtooth",
      gain: 0.14,
    });
  },
};

export function ensureAudioUnlocked() {
  getCtx();
}
