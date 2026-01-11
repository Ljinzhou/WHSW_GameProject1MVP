import Phaser from 'phaser';
import Bullet from './Bullet';

export default class SkillBullet extends Bullet {
  constructor(scene: Phaser.Scene, x: number, y: number, damage: number, owner: Phaser.GameObjects.Container, target?: Phaser.GameObjects.Container) {
    super(scene, x, y, damage, owner, target);

    // 绘制直径 8px 的圆球 (半径 4)
    const graphics = scene.add.graphics();
    graphics.fillStyle(0xFFA500, 1); // 橙色
    graphics.fillCircle(0, 0, 7);
    this.add(graphics);
    
    // 设置物理包围盒
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(4, -4, -4);
  }

  private hitEnemies: Set<Phaser.GameObjects.GameObject> = new Set();
  private isLocked: boolean = false;

  update(_time: number, _delta: number) {
    if (!this.isLocked && this.target && this.target.active) {
        // 简单的追踪逻辑：飞向目标
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.scene.physics.velocityFromRotation(angle, this.speed, (this.body as Phaser.Physics.Arcade.Body).velocity);
    }

    // 如果超出边界则销毁（带边距）
    this.checkOutOfBounds();
  }

  public handleHit(target: Phaser.GameObjects.GameObject): boolean {
      if (this.hitEnemies.has(target)) {
          return false; // 已经击中过该目标
      }
      this.hitEnemies.add(target);
      
      if (!this.isLocked) {
          this.isLocked = true;
          // 保持当前速度（方向）
      }
      
      return true; // Apply damage
  }
}
