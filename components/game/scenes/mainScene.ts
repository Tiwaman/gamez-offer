import Phaser from "phaser";

type SceneHooks = {
  onScore: (score: number) => void;
  onGameOver: (score: number) => void;
};

const PLATFORM_HEIGHT = 16;
const CHAR_SIZE = 28;
const JUMP_DURATION_MS = 650;
const PLATFORM_GAP_Y = 180;

export function createMainScene(hooks: SceneHooks) {
  return class MainScene extends Phaser.Scene {
    private currentPlatform!: Phaser.GameObjects.Rectangle;
    private targetPlatform!: Phaser.GameObjects.Rectangle;
    private character!: Phaser.GameObjects.Rectangle;
    private platformWidth = 110;
    private platformSpeed = 120;
    private platformDir = 1;
    private isJumping = false;
    private score = 0;
    private camTargetY = 0;
    private inputLocked = false;

    constructor() {
      super({ key: "MainScene" });
    }

    create() {
      const { width, height } = this.scale;
      this.camTargetY = 0;
      this.cameras.main.setBounds(-10000, -1000000, 20000, 1000000 + height);
      this.cameras.main.setScroll(0, 0);

      this.currentPlatform = this.add.rectangle(
        width / 2,
        height - 120,
        this.platformWidth,
        PLATFORM_HEIGHT,
        0xffffff,
      );
      this.currentPlatform.setStrokeStyle(2, 0x0b1020);

      this.character = this.add.rectangle(
        this.currentPlatform.x,
        this.currentPlatform.y - PLATFORM_HEIGHT / 2 - CHAR_SIZE / 2,
        CHAR_SIZE,
        CHAR_SIZE,
        0xfde047,
      );
      this.character.setStrokeStyle(2, 0x0b1020);

      this.spawnTarget();

      this.input.on("pointerdown", () => this.handleTap());

      this.scale.on("resize", this.handleResize, this);
    }

    private handleResize = (gameSize: Phaser.Structs.Size) => {
      this.cameras.main.setSize(gameSize.width, gameSize.height);
    };

    private spawnTarget() {
      const { width } = this.scale;
      const y = this.currentPlatform.y - PLATFORM_GAP_Y;
      const startX = Phaser.Math.Between(
        Math.floor(this.platformWidth / 2 + 20),
        Math.floor(width - this.platformWidth / 2 - 20),
      );
      this.targetPlatform = this.add.rectangle(
        startX,
        y,
        this.platformWidth,
        PLATFORM_HEIGHT,
        0xffffff,
      );
      this.targetPlatform.setStrokeStyle(2, 0x0b1020);
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

      const lockedX = this.targetPlatform.x;
      const startX = this.character.x;
      const startY = this.character.y;
      const targetY =
        this.targetPlatform.y - PLATFORM_HEIGHT / 2 - CHAR_SIZE / 2;
      const arcHeight = 90;

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
        },
        onComplete: () => this.resolveLanding(lockedX),
      });
    }

    private resolveLanding(lockedX: number) {
      const targetX = this.targetPlatform.x;
      const half = this.platformWidth / 2;
      const hit = Math.abs(lockedX - targetX) <= half - CHAR_SIZE / 4;

      if (!hit) {
        this.inputLocked = true;
        this.tweens.add({
          targets: this.character,
          y: this.character.y + 600,
          duration: 600,
          ease: "Cubic.easeIn",
          onComplete: () => hooks.onGameOver(this.score),
        });
        return;
      }

      this.score += 1;
      hooks.onScore(this.score);

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
  };
}
