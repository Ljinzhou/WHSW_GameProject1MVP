import Phaser from 'phaser';

export default abstract class Bullet extends Phaser.GameObjects.Container {
  protected speed: number = 1000; // 默认子弹速度
  protected damage: number = 10;
  protected target?: Phaser.GameObjects.Container;
  protected onHit?: () => void;
  protected velocity: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  public owner: Phaser.GameObjects.Container; // 发射子弹的玩家

  constructor(scene: Phaser.Scene, x: number, y: number, damage: number, owner: Phaser.GameObjects.Container, target?: Phaser.GameObjects.Container) {
    super(scene, x, y);
    this.damage = damage;
    this.target = target;
    this.owner = owner;
    
    scene.add.existing(this);

    scene.physics.add.existing(this);
  }

  // 设置击中回调
  public setOnHit(callback: () => void) {
    this.onHit = callback;
  }
  
  public getDamage(): number {
      return this.damage;
  }

  // 抽象方法：更新逻辑 (例如追踪)
  abstract update(time: number, delta: number): void;

  protected checkOutOfBounds() {
    // Destroy if out of bounds (with margin)
    const { width, height } = this.scene.scale;
    const margin = 50;
    if (this.x < -margin || this.x > width + margin || 
        this.y < -margin || this.y > height + margin) {
        this.destroy();
    }
  }
}
