import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Container {
  public health: number = 20;
  private maxHealth: number = 20;
  private speed: number = 1;
  private pixelsPerMeter: number = 100;
  private targetX: number;
  private graphics: Phaser.GameObjects.Graphics;
  
  // UI 组件
  private healthBar: Phaser.GameObjects.Graphics;
  private healthText: Phaser.GameObjects.Text;
  
  // 攻击相关属性
  private attackDamage: number = 10;
  private attackInterval: number = 2000; // 2秒
  private isAttacking: boolean = false;
  private attackTimer?: Phaser.Time.TimerEvent;
  
  // 掉落属性
  public goldReward: number = 2;
  public xpReward: number = 10;
  
  // 回调函数
  public onAttack?: (damage: number) => void;
  public onKilled?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, targetX: number, level: number = 0) {
    super(scene, x, y);
    this.targetX = targetX;
    
    // 根据等级缩放属性
    // 基础 HP 20, 每级 +10
    this.maxHealth = 20 + (level * 10);
    this.health = this.maxHealth;
    
    // 基础 XP 10, 每级 +10
    this.xpReward = 10 + (level * 10);
    
    // 使容器可交互，方便点击测试 (模拟被杀死)
    this.setSize(20, 20);
    this.setInteractive();
    this.on('pointerdown', () => {
        this.kill();
    });

    // 创建视觉表现 (等边三角形, 边长 10px)
    // 用户确认: "边长为10px"
    const h = 20 * Math.sqrt(3) / 2;
    const halfSide = 5;
    const halfH = h / 2;

    // 三角形指向左侧 (朝向目的地)
    this.graphics = scene.add.graphics();
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillTriangle(-halfH, 0, halfH, -halfSide, halfH, halfSide);
    
    this.add(this.graphics);
    
    // 初始化血条
    // 我们会创建它但只在更新时显示或更新逻辑中处理。
    this.healthBar = scene.add.graphics();
    this.healthText = scene.add.text(0, -25, '', { fontSize: '12px', color: '#ffffff' });
    this.healthText.setOrigin(0.5);
    this.add(this.healthBar);
    this.add(this.healthText);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  public takeDamage(damage: number) {
      this.health -= damage;
      this.updateHealthBar();
      this.showDamagePopup(damage);
      
      if (this.health <= 0) {
          this.kill();
      }
  }

  private updateHealthBar() {
      this.healthBar.clear();
      this.healthText.setText(`${Math.max(0, this.health)}/${this.maxHealth}`);
      
      // 血条尺寸
      const width = 40; // 最大宽度
      const height = 5;
      const x = -width / 2;
      const y = -20; // 敌人上方
      
      // 绘制背景
      this.healthBar.fillStyle(0x000000, 0.5);
      this.healthBar.fillRect(x, y, width, height);
      
      // 绘制填充
      if (this.health > 0) {
          const ratio = this.health / this.maxHealth;
          const fillWidth = width * ratio;
          // 绿色
          this.healthBar.fillStyle(0x00ff00, 1);
          this.healthBar.fillRect(x, y, fillWidth, height);
      }
  }

  private showDamagePopup(damage: number) {
      // 在当前位置创建文本
      
      const popup = this.scene.add.text(this.x, this.y, `-${damage}`, {
          fontSize: '16px',
          color: '#ff0000',
          stroke: '#fff',
          strokeThickness: 2
      });
      popup.setOrigin(0.5);
      
      // 动画: "向后斜上方抛出"
      // 向后 = 与移动方向相反 (敌人向左移动，所以向后是向右 +x)
      // 向上 = -y
      // 持续 0.8s
      
      this.scene.tweens.add({
          targets: popup,
          x: this.x + 50, // 向右移动 50px
          y: this.y - 50, // 向上移动 50px
          duration: 800,
          ease: 'Cubic.easeOut', // 快速开始，慢速结束 (上抛)
          onComplete: () => {
              popup.destroy();
          }
      });
      
      // 添加淡出
      this.scene.tweens.add({
          targets: popup,
          alpha: 0,
          delay: 400,
          duration: 400
      });
  }

  update(_time: number, delta: number) {
    const deltaSeconds = delta / 1000;
    const pixelSpeed = this.speed * this.pixelsPerMeter;

    // 移动逻辑: 向 targetX (左侧) 移动
    if (this.x > this.targetX) {
      this.x -= pixelSpeed * deltaSeconds;
      if (this.x <= this.targetX) {
        this.x = this.targetX;
        // 到达目的地，停止移动，不销毁
        if (!this.isAttacking) {
          this.startAttacking();
        }
      }
    } else if (this.x < this.targetX) {
        // 鉴于起点/终点设置，这种情况不应发生，但为了完整性保留
      this.x += pixelSpeed * deltaSeconds;
      if (this.x >= this.targetX) {
        this.x = this.targetX;
        // 到达目的地，停止移动
        if (!this.isAttacking) {
           this.startAttacking();
        }
      }
    }
  }

  private startAttacking() {
    this.isAttacking = true;
    // 使用 Phaser 的 Timer Event
    this.attackTimer = this.scene.time.addEvent({
      delay: this.attackInterval,
      callback: this.performAttack,
      callbackScope: this,
      loop: true
    });
  }

  private performAttack() {
      if (this.onAttack && this.active) {
          this.onAttack(this.attackDamage);
      }
  }
  
  // 模拟被击杀
  public kill() {
      if (this.onKilled) {
          this.onKilled();
      }
      this.destroy(); // 销毁对象
  }

  // 销毁时清理定时器
  destroy(fromScene?: boolean) {
      if (this.attackTimer) {
          this.attackTimer.destroy();
      }
      super.destroy(fromScene);
  }
}
