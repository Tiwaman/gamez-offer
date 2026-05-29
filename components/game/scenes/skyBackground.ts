import Phaser from "phaser";

type Zone = {
  altitude: number;
  topColor: number;
  bottomColor: number;
  cloudAlpha: number;
  starAlpha: number;
};

const ZONES: Zone[] = [
  { altitude: 0, topColor: 0x7ec8ff, bottomColor: 0xb8e6ff, cloudAlpha: 0.9, starAlpha: 0 },
  { altitude: 10, topColor: 0x4a90e2, bottomColor: 0x9ed1ff, cloudAlpha: 0.85, starAlpha: 0 },
  { altitude: 25, topColor: 0x1f3a93, bottomColor: 0x4a76c4, cloudAlpha: 0.55, starAlpha: 0 },
  { altitude: 45, topColor: 0x0d1b4d, bottomColor: 0x1f3a93, cloudAlpha: 0.25, starAlpha: 0.4 },
  { altitude: 70, topColor: 0x05050f, bottomColor: 0x0a0e2a, cloudAlpha: 0, starAlpha: 1 },
];

function lerpColor(a: number, b: number, t: number) {
  const ar = (a >> 16) & 0xff,
    ag = (a >> 8) & 0xff,
    ab = a & 0xff;
  const br = (b >> 16) & 0xff,
    bg = (b >> 8) & 0xff,
    bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function zoneAt(altitude: number) {
  let lo = ZONES[0];
  let hi = ZONES[ZONES.length - 1];
  for (let i = 0; i < ZONES.length - 1; i++) {
    if (altitude >= ZONES[i].altitude && altitude <= ZONES[i + 1].altitude) {
      lo = ZONES[i];
      hi = ZONES[i + 1];
      const t = (altitude - lo.altitude) / (hi.altitude - lo.altitude);
      return {
        topColor: lerpColor(lo.topColor, hi.topColor, t),
        bottomColor: lerpColor(lo.bottomColor, hi.bottomColor, t),
        cloudAlpha: lerp(lo.cloudAlpha, hi.cloudAlpha, t),
        starAlpha: lerp(lo.starAlpha, hi.starAlpha, t),
      };
    }
  }
  if (altitude < ZONES[0].altitude)
    return { topColor: ZONES[0].topColor, bottomColor: ZONES[0].bottomColor, cloudAlpha: ZONES[0].cloudAlpha, starAlpha: ZONES[0].starAlpha };
  return { topColor: hi.topColor, bottomColor: hi.bottomColor, cloudAlpha: hi.cloudAlpha, starAlpha: hi.starAlpha };
}

export class SkyBackground {
  private scene: Phaser.Scene;
  private gradient!: Phaser.GameObjects.Graphics;
  private cloudFar: Phaser.GameObjects.Image[] = [];
  private cloudNear: Phaser.GameObjects.Image[] = [];
  private stars: Phaser.GameObjects.Image[] = [];
  private altitude = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  preload() {
    this.ensureCloudTexture();
    this.ensureStarTexture();
  }

  create() {
    const { width, height } = this.scene.scale;
    this.gradient = this.scene.add.graphics();
    this.gradient.setScrollFactor(0);
    this.gradient.setDepth(-100);

    for (let i = 0; i < 6; i++) {
      const c = this.scene.add.image(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        "cloud",
      );
      c.setScale(Phaser.Math.FloatBetween(0.6, 1.1));
      c.setScrollFactor(0.05);
      c.setDepth(-90);
      this.cloudFar.push(c);
    }
    for (let i = 0; i < 5; i++) {
      const c = this.scene.add.image(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        "cloud",
      );
      c.setScale(Phaser.Math.FloatBetween(1.0, 1.6));
      c.setScrollFactor(0.18);
      c.setDepth(-80);
      this.cloudNear.push(c);
    }
    for (let i = 0; i < 60; i++) {
      const s = this.scene.add.image(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        "star",
      );
      s.setScale(Phaser.Math.FloatBetween(0.4, 1.0));
      s.setScrollFactor(0.02);
      s.setDepth(-95);
      s.setAlpha(0);
      this.stars.push(s);
    }

    this.redraw();
  }

  setAltitude(altitude: number) {
    if (Math.abs(altitude - this.altitude) < 0.01) return;
    this.altitude = altitude;
    this.redraw();
  }

  private redraw() {
    const { width, height } = this.scene.scale;
    const z = zoneAt(this.altitude);
    this.gradient.clear();
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const color = lerpColor(z.topColor, z.bottomColor, t);
      this.gradient.fillStyle(color, 1);
      this.gradient.fillRect(
        0,
        Math.floor((i * height) / steps),
        width,
        Math.ceil(height / steps) + 1,
      );
    }
    for (const c of this.cloudFar) c.setAlpha(z.cloudAlpha * 0.6);
    for (const c of this.cloudNear) c.setAlpha(z.cloudAlpha);
    for (const s of this.stars) s.setAlpha(z.starAlpha * Phaser.Math.FloatBetween(0.4, 1));
  }

  handleResize() {
    this.redraw();
  }

  private ensureCloudTexture() {
    if (this.scene.textures.exists("cloud")) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(30, 26, 22);
    g.fillCircle(56, 22, 26);
    g.fillCircle(82, 28, 20);
    g.fillCircle(46, 36, 24);
    g.fillCircle(70, 38, 22);
    g.generateTexture("cloud", 110, 56);
    g.destroy();
  }

  private ensureStarTexture() {
    if (this.scene.textures.exists("star")) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 1.6);
    g.generateTexture("star", 6, 6);
    g.destroy();
  }
}
