# SkyJump Rewards

A mobile-first web game where you tap-jump up through the sky on procedurally generated platforms. Better scores unlock better brand discount coupons. Players win, brands win, we win.

## Tech stack
- Next.js 14 (App Router) + TypeScript
- TailwindCSS
- Phaser 3 (game engine, lazy-loaded on `/play`)
- Vercel Postgres + Prisma (M5)
- Hosted on Vercel

## Local dev
```bash
npm install
npm run dev
```

App runs at http://localhost:3000.

## Routes
- `/` — landing
- `/play` — game (Phaser canvas, M2)
- `/result?score=N` — score + tier + coupon reveal (M4)
- `/admin` — coupon/tier admin (M6)

## Milestones
1. Scaffold + first Vercel deploy *(current)*
2. Core tap-to-jump mechanics
3. Parallax sky progression + art/sound
4. Score, tiers, scratch-card reveal
5. Backend + affiliate coupon engine
6. Admin panel
7. Share, retry-on-ad, leaderboard
8. Analytics, PWA, legal, launch
