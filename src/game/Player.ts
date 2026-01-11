import Phaser from 'phaser';
import StandardBullet from './StandardBullet';
import SkillBullet from './SkillBullet';
import Enemy from './Enemy';

export default class Player extends Phaser.GameObjects.Container {
  // 属性
  private damage: number = 10;
  private attackInterval: number = 1000; // 1秒
  private skillDamage: number = 50;
  private skillInterval: number = 10000; // 10秒

  // 状态
  private attackTimer: number = 0;
  private skillTimer: number = 0;
  
  public setLevel(level: number) {
      // 基础伤害 10，每级 +2
      this.damage = 10 + (level * 2);
      // 基础技能伤害 50，每级 +5
      this.skillDamage = 50 + (level * 5);
      
      // 攻击间隔：基础 1000ms，每级 -200ms
      // 限制最小 100ms 以防止瞬间攻击/崩溃
      let newInterval = 1000 - (level * 200);
      if (newInterval < 100) newInterval = 100;
      this.attackInterval = newInterval;
  }
  
  // 统计数据
  public name: string;
  public totalDamage: number = 0;
  public totalKills: number = 0;
  
  // 引用
  private weaponPoint: Phaser.Math.Vector2;
  private enemiesRef: Enemy[]; // 引用敌人列表以搜索目标
  
  // UI 组件
  private skillBar: Phaser.GameObjects.Graphics;
  private shape: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, enemies: Enemy[], name: string) {
    super(scene, x, y);
    this.enemiesRef = enemies;
    this.name = name; // 设置名称

    // 1. 玩家外观: 随机舒适颜色的长方形
    // "舒适的颜色" -> 柔和的色调？
    const color = Phaser.Display.Color.RandomRGB(100, 255).color; // 避免太暗
    this.shape = scene.add.rectangle(0, 0, width - 20, height - 10, color); // 稍微小一点留出边距
    this.add(this.shape);

    // 2. 技能区域: 在 character-container 内部，靠近右侧，宽 10px
    // 假设 Player 宽 180 (留边).
    // 技能条在右侧边缘。
    
    // 技能条背景
    const barX = width / 2 - 10; // 右边缘
    const barH = height - 20;    // 高度
    const skillBarBg = scene.add.rectangle(barX, 0, 10, barH, 0x333333);
    this.add(skillBarBg);

    // 技能条填充 (动态)
    this.skillBar = scene.add.graphics();
    this.add(this.skillBar);
    
    // 3. 子弹发射点: 紧贴右侧的一个点
    const firePointX = width / 2; 
    const firePointY = 0;
    this.weaponPoint = new Phaser.Math.Vector2(firePointX, firePointY);
    // 可选可视化发射点
    this.add(scene.add.circle(firePointX, firePointY, 3, 0xff0000));

    scene.add.existing(this);
  }

  update(_time: number, delta: number) {
    // 1. 普攻逻辑
    this.attackTimer += delta;
    if (this.attackTimer >= this.attackInterval) {
        this.attackTimer = 0;
        this.fire(false); // 普攻
    }

    // 2. 技能逻辑
    this.skillTimer += delta;
    // 绘制技能条
    this.drawSkillBar(this.shape.height - 10); // 传递绘制高度
    
    if (this.skillTimer >= this.skillInterval) {
        this.skillTimer = 0;
        this.fire(true); // 技能攻击
    }
  }

  private drawSkillBar(fullHeight: number) {
      this.skillBar.clear();
      const progress = Math.min(this.skillTimer / this.skillInterval, 1);
      const barHeight = fullHeight * progress;
      const barX = (this.shape.width / 2) + 5; // 对齐背景
      // 从下往上绘制？"逐渐被一个颜色填充满"
      // 起始 Y: 底部 (= fullHeight/2), 结束 Y: 底部 - barHeight
      
      this.skillBar.fillStyle(0x00ffff, 1); // 技能颜色为青色
      // 绘制矩形: x, y, w, h
      // 局部坐标 0,0 是中心。顶端是 -h/2。底部是 h/2。
      const bottomY = fullHeight / 2;
      this.skillBar.fillRect(barX - 5, bottomY - barHeight, 10, barHeight);
  }

  private fire(isSkill: boolean) {
      const target = this.findTarget();
      if (!target) return;

      const damage = isSkill ? this.skillDamage : this.damage;
      
      // 世界坐标
      const worldX = this.x + this.weaponPoint.x;
      const worldY = this.y + this.weaponPoint.y;

      // 创建子弹
      // 这里子弹需要添加到 Scene 的 update list 中
      // 由于我们不能在这里直接访问 GameView 里的 bullets 数组，
      // 我们最好触发一个事件，或者让 Scene 处理。
      
      // 注意：StandardBullet 需要手动加入 update 循环，或者依靠 Physics Arcade 自动更新 (velocity)。
      // 在 Bullet.ts 中我们只依赖 Physics 更新位置。
      
      const bullet = isSkill 
        ? new SkillBullet(this.scene, worldX, worldY, damage, this, target)
        : new StandardBullet(this.scene, worldX, worldY, damage, this, target);
      
      // 简单起见，我们触发一个 Scene 事件
      this.scene.events.emit('spawn-bullet', bullet);
  }

  private findTarget(): Enemy | undefined {
      // "每个角色攻击距离它自己最近的那个敌人"
      
      let bestTarget: Enemy | undefined;
      let minDist = Infinity;

      for (const enemy of this.enemiesRef) {
          if (!enemy.active) continue;
          
          // 距离玩家自身的距离
          const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
          
          if (dist < minDist) {
              minDist = dist;
              bestTarget = enemy;
          }
      }
      return bestTarget;
  }
}
