import Phaser from "phaser";
import { sfx } from "@/lib/sfx";
import { SkyBackground } from "./skyBackground";

type SceneHooks = {
  onScore: (score: number) => void;
  onGameOver: (score: number) => void;
};

const PLATFORM_HEIGHT = 18;
const CHAR_SIZE = 32;
const JUMP_DURATION_MS = 620;
const PLATFORM_GAP_Y = 180;

export function createMainScene(hooks: SceneHooks) {
  return class MainScene extends Phaser.Scene {
    private sky!: SkyBackground;
    private currentPlatform!: Phaser.GameObjects.Image;
    private targetPlatform!: Phaser.GameObjects.Image;
    private character!: Phaser.GameObjects.Container;
    private charBody!: Phaser.GameObjects.Arc;
    private platformWidth = 110;
    private platformSpeed = 120;
    private platformDir = 1;
    private isJumping = false;
    private score = 0;
    private inputLocked = false;
    private jumpParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor() {
      super({ key: "MainScene" });
    }

    create() {
      const { width, height } = this.scale;
      this.cameras.main.setBounds(-10000, -1000000, 20000, 1000000 + height);
      this.cameras.main.setScroll(0, 0);

      this.sky = new SkyBackground(this);
      this.sky.preload();
      this.sky.create();

      this.ensurePlatformTexture();
      this.ensureDustTexture();

      this.currentPlatform = this.makePlatform(width / 2, height - 120);

      this.character = this.createCharacter(
        this.currentPlatform.x,
        this.currentPlatform.y - PLATFORM_HEIGHT / 2 - CHAR_SIZE / 2,
      );

      this.jumpParticles = this.add.particles(0, 0, "dust", {
        speed: { min: 30, max: 80 },
        angle: { min: 230, max: 310 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 350,
        gravityY: 200,
        quantity: 0,
      });
      this.jumpParticles.setDepth(5);

      this.spawnTarget();

      this.input.on("pointerdown", () => this.handleTap());
      this.scale.on("resize", this.handleResize, this);
    }

    private handleResize = (gameSize: Phaser.Structs.Size) => {
      this.cameras.main.setSize(gameSize.width, gameSize.height);
      this.sky.handleResize();
    };

    private makePlatform(x: number, y: number) {
      const img = this.add.image(x, y, "platform");
      img.setDisplaySize(this.platformWidth, PLATFORM_HEIGHT);
      img.setDepth(2);
      return img;
    }

    private createCharacter(x: number, y: number) {
      const c = this.add.container(x, y);
      const shadow = this.add.ellipse(0, CHAR_SIZE / 2 + 4, CHAR_SIZE, 6, 0x000000, 0.25);
      const body = this.add.circle(0, 0, CHAR_SIZE / 2, 0xfde047);
      body.setStrokeStyle(2, 0x1a1a1a);
      const eyeL = this.add.circle(-6, -3, 3, 0x1a1a1a);
      const eyeR = this.add.circle(6, -3, 3, 0x1a1a1a);
      const cheekL = this.add.circle(-9, 4, 2.2, 0xff8aa7, 0.85);
      const cheekR = this.add.circle(9, 4, 2.2, 0xff8aa7, 0.85);
      const mouth = this.add.arc(0, 3, 4, 0, 180, false, 0x1a1a1a);
      mouth.setStrokeStyle(1.6, 0x1a1a1a);
      c.add([shadow, body, eyeL, eyeR, cheekL, cheekR, mouth]);
      c.setDepth(10);
      this.charBody = body;
      return c;
    }

    private spawnTarget() {
      const { width } = this.scale;
      const y = this.currentPlatform.y - PLATFORM_GAP_Y;
      const startX = Phaser.Math.Between(
        Math.floor(this.platformWidth / 2 + 20),
        Math.floor(width - this.platformWidth / 2 - 20),
      );
      this.targetPlatform = this.makePlatform(startX, y);
      this.platformDir = Math.random() > 0.5 ? 1 : -1;
    }

    update(_t: number, delta: number) {
      if (!this.targetPlatform || this.isJumping) return;
      const { width } = this.scale;
      const dx = (this.platformSpeed * delta) / 1000 * this.platformDir;
      this.targetPlatform.x += dx;
      const halfW = this.platformWidth / 2;
      if (this.targetPlatform.x < halfW + 10) {
        this.targetPlatform.x = halfW + 10;
        this.platformDir = 1;
      } else if (this.targetPlatform.x > width - halfW - 10) {
        this.targetPlatform.x = width - halfW - 10;
        this.platformDir = -1;
      }
    }

    private handleTap() {
      if (this.isJumping || this.inputLocked) return;
      this.isJumping = true;
      sfx.jump();

      this.jumpParticles.setPosition(this.character.x, this.character.y + CHAR_SIZE / 2);
      this.jumpParticles.explode(8);

      const lockedX = this.targetPlatform.x;
      const startX = this.character.x;
      const startY = this.character.y;
      const targetY =
        this.targetPlatform.y - PLATFORM_HEIGHT / 2 - CHAR_SIZE / 2;
      const arcHeight = 100;

      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: JUMP_DURATION_MS,
        ease: "Sine.easeInOut",
        onUpdate: (tween) => {
          const t = tween.getValue() ?? 0;
          const x = Phaser.Math.Linear(startX, lockedX, t);
          const yLine = Phaser.Math.Linear(startY, targetY, t);
          const arc = -Math.sin(t * Math.PI) * arcHeight;
          this.character.x = x;
          this.character.y = yLine + arc;
          this.character.setRotation(Phaser.Math.Linear(0, Math.PI * 2, t));
        },
        onComplete: () => {
          this.character.setRotation(0);
          this.resolveLanding(lockedX);
        },
      });
    }

    private resolveLanding(lockedX: number) {
      const targetX = this.targetPlatform.x;
      const half = this.platformWidth / 2;
      const hit = Math.abs(lockedX - targetX) <= half - CHAR_SIZE / 4;

      if (!hit) {
        this.inputLocked = true;
        sfx.fall();
        this.tweens.add({
          targets: this.character,
          y: this.character.y + 600,
          rotation: Math.PI,
          duration: 700,
          ease: "Cubic.easeIn",
          onComplete: () => hooks.onGameOver(this.score),
        });
        return;
      }

      this.score += 1;
      hooks.onScore(this.score);
      sfx.land();
      sfx.score(this.score);

      this.jumpParticles.setPosition(this.character.x, this.character.y + CHAR_SIZE / 2);
      this.jumpParticles.explode(10);

      this.tweens.add({
        targets: this.charBody,
        scaleY: 0.7,
        scaleX: 1.2,
        duration: 90,
        yoyo: true,
        ease: "Quad.easeOut",
      });

      this.character.x = targetX;

      const oldCurrent = this.currentPlatform;
      this.currentPlatform = this.targetPlatform;

      this.tweens.add({
        targets: oldCurrent,
        alpha: 0,
        duration: 300,
        onComplete: () => oldCurrent.destroy(),
      });

      this.platformSpeed = Math.min(360, this.platformSpeed + 12);
      if (this.score % 5 === 0 && this.platformWidth > 60) {
        this.platformWidth -= 6;
      }

      this.spawnTarget();
      this.sky.setAltitude(this.score);

      const cam = this.cameras.main;
      const desiredScroll = this.currentPlatform.y - this.scale.height + 220;
      this.tweens.add({
        targets: cam,
        scrollY: desiredScroll,
        duration: 400,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.isJumping = false;
        },
      });
    }

    private ensurePlatformTexture() {
      if (this.textures.exists("platform")) return;
      const W = 220;
      const H = 40;
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(0, 0, W, H, 12);
      g.fillStyle(0xe5e7eb, 1);
      g.fillRoundedRect(0, H - 14, W, 14, { tl: 0, tr: 0, bl: 12, br: 12 });
      g.lineStyle(2, 0x1a1a1a, 1);
      g.strokeRoundedRect(0, 0, W, H, 12);
      g.generateTexture("platform", W, H);
      g.destroy();
    }

    private ensureDustTexture() {
      if (this.textures.exists("dust")) return;
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 3);
      g.generateTexture("dust", 8, 8);
      g.destroy();
    }
  };
}
