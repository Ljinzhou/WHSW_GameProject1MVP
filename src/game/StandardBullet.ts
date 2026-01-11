import Phaser from 'phaser';
import Bullet from './Bullet';

export default class StandardBullet extends Bullet {
  constructor(scene: Phaser.Scene, x: number, y: number, damage: number, owner: Phaser.GameObjects.Container, target?: Phaser.GameObjects.Container) {
    super(scene, x, y, damage, owner, target);

    // 绘制直径 5px 的圆球 (半径 2.5)
    const graphics = scene.add.graphics();
    graphics.fillStyle(0xffff00, 1); // 黄色子弹
    graphics.fillCircle(0, 0, 2.5);
    this.add(graphics);
    
    // 设置物理包围盒
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(2.5, -2.5, -2.5);
    
    // 如果有目标，立即计算方向 (简单的预测射击可以这里加，这里先做直线或追踪)
    // 需求: "子弹会朝距离enemy-destination最近的敌人射击...确保子弹可以碰撞到敌人"
    // 简单的做法是追踪(Homing)或者预判(Intercept)。
    // 这里先实现简单的追踪，保证命中率。
  }

  update(_time: number, _delta: number) {
    if (this.target && this.target.active) {
        // 简单的追踪逻辑：飞向目标
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.scene.physics.velocityFromRotation(angle, this.speed, (this.body as Phaser.Physics.Arcade.Body).velocity);
    }

    // 如果超出边界则销毁（带边距）
    this.checkOutOfBounds();
  }
}
