<template>
  <div class="game-container" id="phaser-game">
    <div class="movement-area">
      <!-- 移动区域 -->
    </div>
    <div class="character-container">
      <div class="character-slot" v-for="(slot, index) in playerSlots" :key="index">
        <span v-if="slot.hasPlayer" class="player-name">{{ slot.name }}</span>
        <button v-if="!slot.hasPlayer" class="add-player-btn" @click="addPlayer(index)">
          + 添加玩家
        </button>
      </div>
    </div>
    <div class="enemy-destination">
      <!-- 敌人终点 -->
    </div>
    <div class="enemy-start">
      <!-- 敌人起点 -->
    </div>

    <!-- Pause Overlay -->
    <div v-if="isPaused" class="pause-overlay">
        <div class="pause-menu">
            <h2>游戏暂停</h2>
            <button class="menu-btn continue" @click="resumeGameUI">继续游戏</button>
            <button class="menu-btn settings" @click="openSettings">游戏设置</button>
            <button class="menu-btn exit" @click="exitGame">结束游戏</button>
        </div>
    </div>

    <div class="data-area top">
      <!-- Top HUD -->
      <div class="hud-left">
        <div class="upgrade-btn-container">
          <button class="hud-btn upgrade">升级</button>
          <div class="gold-text">💰 {{ gold }}</div>
        </div>
      </div>

      <div class="hud-center">
        <span class="level-text">Lv.{{ level }}</span>
        <div class="xp-bar-bg">
          <div class="xp-bar-fill" :style="{ width: (currentXp / maxXp * 100) + '%' }"></div>
        </div>
        <span class="xp-text-sm">{{ currentXp }}/{{ maxXp }}</span>
      </div>

      <div class="hud-right">
         <button class="hud-btn stat" @click="toggleStats">📊</button>
         <button class="hud-btn help">❓</button>
         <button class="hud-btn pause" @click="togglePause">⏸</button>
      </div>
    </div>
    <div class="data-area bottom">
      <!-- 底部数据区：基地血量 -->
      <div class="health-bar-container">
        <span>基地血量: {{ baseHealth }} / 2000</span>
        <div class="health-bar-bg">
          <div class="health-bar-fill" :style="{ width: (baseHealth / 2000 * 100) + '%' }"></div>
        </div>
      </div>
    </div>
    
    <!-- Draggable Stats Window -->
    <div v-if="showStats" class="stats-card" :style="{ left: statsPos.x + 'px', top: statsPos.y + 'px' }">
        <div class="stats-header" @mousedown="startDrag">
            <h2>战斗统计</h2>
            <button class="close-btn" @click="toggleStats">X</button>
        </div>
        <div class="stats-summary">
            <div class="stat-item">
                <span>总伤:</span>
                <span class="val">{{ globalStats.totalDamage }}</span>
            </div>
             <div class="stat-item">
                <span>DPS:</span>
                <span class="val">{{ globalStats.dps }}</span>
            </div>
        </div>
        <div class="chart-container">
            <v-chart class="chart" :option="chartOption" autoresize />
        </div>
        <div class="stats-list">
             <div v-for="p in globalStats.details" :key="p.name" class="player-stat-row">
                 <span>{{ p.name }}</span>
                 <span>{{ p.damage }}</span>
             </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, reactive, watch } from 'vue';
import Phaser from 'phaser';

import Enemy from '../game/Enemy';
import Player from '../game/Player';
import Bullet from '../game/Bullet';
import SkillBullet from '../game/SkillBullet';
import GameControl from '../game/GameControl';

import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent]);

let game: Phaser.Game | null = null;
const enemies: Enemy[] = [];
const players: Player[] = [];
const bullets: Bullet[] = []; // Track bullets for update

const baseHealth = ref(2000);

// 槽位状态
interface PlayerSlot {
    hasPlayer: boolean;
    name?: string;
}
const playerSlots = reactive<PlayerSlot[]>([
    { hasPlayer: true, name: "玩家一" }, // 默认第一个玩家
    { hasPlayer: false },
    { hasPlayer: false },
    { hasPlayer: false }
]);



// 暂停状态
const isPaused = ref(false);

function togglePause() {
    isPaused.value = true;
    if (game) {
        GameControl.pauseGame(game);
    }
}

function resumeGameUI() {
    isPaused.value = false;
    if (game) {
        GameControl.resumeGame(game);
    }
}

function openSettings() {
    alert("设置功能暂未实现");
}

function exitGame() {
    alert("结束游戏");
    // router.push('/'); // 如果路由可用
}

// 游戏状态
const gold = ref(0);
const level = ref(0);
const currentXp = ref(0);
const maxXp = ref(50); // 默认 0/50
const gameStartTime = ref(Date.now());

// 统计 UI
const showStats = ref(false);
const globalStats = reactive({
    totalDamage: 0,
    totalKills: 0,
    dps: '0',
    details: [] as { name: string, damage: number, kills: number }[]
});
const chartOption = ref({});
let statsInterval: number | null = null;



// 拖拽状态
const statsPos = reactive({ x: 100, y: 100 });
const isDragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });

function startDrag(e: MouseEvent) {
    isDragging.value = true;
    dragOffset.x = e.clientX - statsPos.x;
    dragOffset.y = e.clientY - statsPos.y;
    
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
}

function onDrag(e: MouseEvent) {
    if (!isDragging.value) return;
    statsPos.x = e.clientX - dragOffset.x;
    statsPos.y = e.clientY - dragOffset.y;
}

function stopDrag() {
    isDragging.value = false;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
}

function toggleStats() {
    showStats.value = !showStats.value;
    if (showStats.value) {
        updateStats();
        statsInterval = window.setInterval(updateStats, 1000);
    } else {
        if (statsInterval) clearInterval(statsInterval);
        statsInterval = null;
    }
}

function updateStats() {
    // 计算全局数据
    let totalDmg = 0;
    let totalKills = 0;
    
    const details = players.map(p => {
        totalDmg += p.totalDamage;
        totalKills += p.totalKills;
        return {
            name: p.name,
            damage: p.totalDamage,
            kills: p.totalKills
        };
    });
    
    globalStats.totalDamage = totalDmg;
    globalStats.totalKills = totalKills;
    
    // TPS (每秒伤害)
    const seconds = (Date.now() - gameStartTime.value) / 1000;
    globalStats.dps = (totalDmg / (seconds || 1)).toFixed(1);
    globalStats.details = details;
    
    // 图表配置
    // 按伤害排序
    const sorted = [...details].sort((a, b) => a.damage - b.damage); // 升序，用于条形图 Y 轴分类
    // ECharts Y 轴分类通常是从下到上。
    
    chartOption.value = {
        tooltip: { trigger: 'axis' },
        grid: { left: '20%', right: '15%', top: '10%', bottom: '10%' },
        xAxis: { type: 'value', name: '伤害', nameTextStyle: { fontSize: 10 } },
        yAxis: { type: 'category', data: sorted.map(d => d.name), axisLabel: { fontSize: 10 } },
        series: [
            {
                name: '伤害',
                type: 'bar',
                data: sorted.map(d => d.damage),
                itemStyle: { color: '#ef4444' },
                label: { show: true, position: 'right', fontSize: 10 }
            }
        ]
    };
}

onMounted(() => {
  // Phaser 游戏配置对象
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO, // 自动选择渲染器 (WebGL 或 Canvas)
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'phaser-game', // 挂载游戏的 DOM 元素 ID
    physics: {
      default: 'arcade', // 使用 Arcade 物理引擎
    },
    scene: {
      preload: preload, // 预加载函数
      create: create,   // 创建函数
      update: update    // 逻辑更新循环
    }
  };

  // 初始化 Phaser 游戏实例
  game = new Phaser.Game(config);
});

onUnmounted(() => {
  // 组件销毁时同步销毁 Phaser 实例，释放资源
  if (game) {
    game.destroy(true);
    game = null;
  }
});

// 监听等级变化
watch(level, (newLevel) => {
    updateLevelStats(newLevel);
});

function updateLevelStats(newLevel: number) {
    // 1. 更新玩家
    players.forEach(p => p.setLevel(newLevel));
    
    // 2. 更新生成计时器 (每级减少间隔 0.1s = 100ms)
    // 基础 1000ms。限制最小 100ms？
    if (spawnEvent && game && game.scene.scenes[0]) {
        spawnEvent.remove(false); // 移除旧事件
        
        let delay = 1000 - (newLevel * 100);
        if (delay < 100) delay = 100; // 上限
        
        const scene = game.scene.scenes[0];
        spawnEvent = scene.time.addEvent({
            delay: delay,
            callback: spawnEnemy,
            callbackScope: scene,
            loop: true
        });
    } else if (game && game.scene.scenes[0]) {
       // 如果不添加新事件，确保现有事件遵循暂停？
       // Phaser TimerEvents 自动遵循 scene.time.paused。
    }
}

let spawnEvent: Phaser.Time.TimerEvent;

function preload(this: Phaser.Scene) {
}

function create(this: Phaser.Scene) { // 添加提示文本
  // 监听生成子弹事件
  this.events.on('spawn-bullet', (bullet: Bullet) => {
      bullets.push(bullet);
  });

  // 初始化默认玩家 (Slot 0)
  createPlayer(this, 0);

  // 生成器定时器
  spawnEvent = this.time.addEvent({
    delay: 1000,
    callback: spawnEnemy,
    callbackScope: this,
    loop: true
  });
}

function spawnEnemy(this: Phaser.Scene) {
  // 移动区域边界 (基于 CSS 近似计算)
  // Top: 高度的 10%, Height: 80%
  // Start X: 宽度 (右边缘)
  // Target X: 200 (终点左边缘)
  
  const gameHeight = this.scale.height;
  const gameWidth = this.scale.width;
  
  const minY = gameHeight * 0.1;
  const maxY = gameHeight * 0.9;
  const spawnY = Phaser.Math.Between(minY, maxY);
  
  const spawnX = gameWidth; // 右边缘
  const targetX = 200;      // 敌人终点左侧位置
  
  const enemy = new Enemy(this, spawnX, spawnY, targetX, level.value);
  
  // 绑定攻击事件
  enemy.onAttack = (damage: number) => {
    // 扣除基地血量
    baseHealth.value = Math.max(0, baseHealth.value - damage);
  };
  
  // 绑定死亡/击杀事件 (掉落)
  enemy.onKilled = () => {
      // 增加金币
      gold.value += enemy.goldReward;
      
      // 增加经验
      currentXp.value += enemy.xpReward;
      
      // 升级逻辑
      if (currentXp.value >= maxXp.value) {
          currentXp.value -= maxXp.value; // 扣除消耗
          level.value++;
          maxXp.value += 50; // 上限增加 50
      }
      
      // Remove from list handled in update loop check? 
      // No, strictly splice here if relying on events?
      // Better to lazy remove in update or use filter.
      // Enemy.ts calls destroy() then onKilled().
  };
  
  enemies.push(enemy);
}

function createPlayer(scene: Phaser.Scene, index: number) {
    if (index < 0 || index >= 4) return;
    
    // 根据角色容器和插槽计算位置
    // Container: Top 10%, Height 80%. 4 Slots.
    const gameHeight = scene.scale.height;
    const containerTop = gameHeight * 0.1;
    const containerHeight = gameHeight * 0.8;
    const slotHeight = containerHeight / 4;
    
    // 插槽中心
    const y = containerTop + (slotHeight * index) + (slotHeight / 2);
    // X: Inside container (Width 200). Center? or left aligned?
    // "character-slot ... text-align center" CSS suggests center.
    // Container left: 0. Width 200. Center is 100.
    // Container left: 0. Width 200. Center is 100.
    const x = 100; 
    
    const names = ["玩家一", "玩家二", "玩家三", "玩家四"];
    const name = names[index] || `玩家${index + 1}`;
    
    // 更新插槽名称
    if (playerSlots[index]) {
        playerSlots[index].name = name;
    }
    
    const player = new Player(scene, x, y, 180, slotHeight - 10, enemies, name);
    player.setLevel(level.value); // 同步等级
    players.push(player);
}

function addPlayer(index: number) {
    const slot = playerSlots[index];
    if (!slot || slot.hasPlayer) return;
    if (!game) return;
    
    slot.hasPlayer = true;
    
    // 访问场景以创建玩家
    if (!game.scene || !game.scene.scenes || game.scene.scenes.length === 0) return;
    const scene = game.scene.scenes[0]; // 假设单个场景
    if (scene) {
        createPlayer(scene, index);
    }
}

function update(this: Phaser.Scene, time: number, delta: number) {
  // 检查暂停
  if (isPaused.value) return;

  // 更新游戏循环
  
  // 1. 更新敌人
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (enemy && enemy.active) {
      enemy.update(time, delta);
    } else {
      enemies.splice(i, 1);
    }
  }
  
  // 2. 更新玩家
  players.forEach(p => p.update(time, delta));
  
  // 3. 更新子弹并检查碰撞
  for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      if (bullet && bullet.active) {
          bullet.update(time, delta);
          
          let hit = false;
          // 使用物理重叠进行可靠的碰撞检测
          for (const enemy of enemies) {
              if (!enemy.active) continue;
              
              if (this.physics.overlap(bullet, enemy)) {
                  // 检查是否为技能子弹
                  if (bullet instanceof SkillBullet) {
                      if ((bullet as SkillBullet).handleHit(enemy)) {
                          // 伤害敌人
                          const dmg = bullet.getDamage();
                          enemy.takeDamage(dmg);
                          
                          // 统计
                          if (bullet.owner instanceof Player) {
                              bullet.owner.totalDamage += dmg;
                              if (enemy.health <= 0 && enemy.active) { // 只处理一次击杀？
                                  // 击杀由 takeDamage -> kill() 处理。
                                  // 但我们需要归功于玩家。
                              }
                           }
                           
                           // 更好的逻辑：检查是否是我们造成了致命一击。
                           // 如果敌人由于此伤害而在本帧死亡。
                           if (enemy.health <= 0) {
                               if (bullet.owner instanceof Player) {
                                   bullet.owner.totalKills++;
                               }
                           }
                          // 不要销毁子弹，它会穿透
                      }
                  } else {
                      // 标准子弹逻辑
                      hit = true;
                      // 伤害敌人
                      const dmg = bullet.getDamage();
                      enemy.takeDamage(dmg);
                      
                      if (bullet.owner instanceof Player) {
                          bullet.owner.totalDamage += dmg;
                          if (enemy.health <= 0) {
                              bullet.owner.totalKills++;
                          }
                      }
                      
                      bullet.destroy();
                      break; // 标准子弹击中一个敌人即销毁
                  }
              }
          }
           
           if (hit) {
               bullets.splice(i, 1);
           }
          
      } else {
          bullets.splice(i, 1);
      }
  }
}
</script>

<style scoped>
.game-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  background-color: #000;
}

.character-container {
  position: absolute;
  top: 10%;
  left: 0;
  width: 200px;
  height: 80%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  background-color: rgba(255, 255, 255, 0.1); /* Optional: semi-transparent background to see container */
  z-index: 10;
}

.character-slot {
  flex: 1;
  border: 1px dashed rgba(255, 255, 255, 0.5); /* Visual aid for slots */
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 1.2rem;
}

.data-area {
  position: absolute;
  left: 0;
  width: 100%;
  height: 10%;
  border: 1px solid rgba(255, 255, 0, 0.5); /* Yellow border for distinction */
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ff0;
  font-size: 0.9rem;
  z-index: 20; /* Ensure on top of game and character container if needed */
  pointer-events: none; /* Let clicks pass through if just for display */
}

.data-area.top {
  top: 0;
}

.data-area.bottom {
  bottom: 0;
}

.enemy-destination {
  position: absolute;
  top: 10%;
  left: 200px; /* 紧挨着 character-container (宽度 200px) */
  width: 10px;
  height: 80%;
  background-color: rgba(255, 0, 0, 0.5); /* 红色半透明，用于调试可见 */
  z-index: 10;
}

.enemy-start {
  position: absolute;
  top: 10%;
  right: 0;
  width: 1px;
  height: 80%;
  background-color: rgba(0, 255, 0, 0.5); /* 绿色半透明，用于调试可见 */
  z-index: 10;
}

.movement-area {
  position: absolute;
  top: 10%;
  left: 200px;
  right: 0;
  height: 80%;
  /* background-color: rgba(0, 0, 255, 0.1); 可选:用于调试的蓝色背景 */
  pointer-events: none;
  z-index: 5;
}
.health-bar-container {
  width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.health-bar-bg {
  width: 100%;
  height: 20px;
  background-color: #333;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 5px;
  border: 1px solid #555;
}

.health-bar-fill {
  height: 100%;
  background-color: #42b883; /* Vue Green */
  transition: width 0.2s ease-in-out;
}

/* Top HUD Styles */
.data-area.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  box-sizing: border-box;
}

.hud-left {
  display: flex;
  align-items: center;
  width: 25%; /* Fixed width for alignment */
}

.upgrade-btn-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gold-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: gold;
  margin-top: 4px;
}

.hud-center {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
  gap: 10px;
}

.level-text {
  font-weight: bold;
  font-size: 1.2rem;
  color: white;
  min-width: 50px;
  text-align: right;
}

.xp-bar-bg {
  width: 200px;
  height: 10px;
  background-color: #444;
  border: 1px solid #666;
  border-radius: 5px;
  overflow: hidden;
  position: relative;
}

.xp-bar-fill {
  height: 100%;
  background-color: #3b82f6; /* Blue for XP */
  width: 0%;
  transition: width 0.2s ease-out;
}

.xp-text-sm {
  font-size: 0.8rem;
  color: #ccc;
  min-width: 60px;
}

.hud-right {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 25%;
}

.hud-btn {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 1px solid #666;
  background-color: #222;
  color: white;
  font-size: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  pointer-events: auto; /* Enable clicks */
}
.player-name {
    font-size: 1.2rem;
    font-weight: bold;
    color: #fff;
    text-shadow: 1px 1px 2px black;
}

.hud-btn:hover {
  background-color: #444;
}

.hud-btn.upgrade {
  background-color: #eab308; /* Yellow/Gold for upgrade */
  border-color: #ca8a04;
  font-weight: bold;
  color: black;
  width: auto;     /* Allow width to expand for text */
  padding: 0 1rem; /* Add horizontal padding */
  font-size: 1.2rem;
}

.add-player-btn {
  background-color: rgba(66, 184, 131, 0.8);
  border: 1px solid #42b883;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.add-player-btn:hover {
  background-color: rgba(66, 184, 131, 1);
}

.stats-card {
    position: fixed; /* Floating */
    background-color: rgba(20, 20, 20, 0.9);
    border: 1px solid #444;
    border-radius: 8px;
    padding: 10px;
    width: 300px; /* Smaller width */
    height: 380px; /* Smaller height */
    display: flex;
    flex-direction: column;
    color: white;
    z-index: 200;
    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
}

.stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    cursor: move; /* Drag cursor */
    background: rgba(255,255,255,0.1);
    padding: 5px;
    border-radius: 4px;
}

.stats-header h2 {
    font-size: 1.1rem;
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    color: #999;
    font-size: 1.2rem;
    cursor: pointer;
}

.stats-summary {
    display: flex;
    justify-content: space-around;
    margin-bottom: 10px;
    background: rgba(255,255,255,0.05);
    padding: 5px;
    border-radius: 4px;
    font-size: 0.8rem;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-item .val {
    font-size: 1rem;
    font-weight: bold;
    color: #42b883;
}

.chart-container {
    flex: 1;
    min-height: 150px;
}

.chart {
    height: 100%;
    width: 100%;
}

.stats-list {
    margin-top: 5px;
    display: flex;
    flex-direction: column; /* Vertical list more compact? Or default flex wrap? */
    /* Original was space-between flex row, but with loop of rows? Wait. */
    /* Original loop was rows in stat-list? */
    /* "player-stat-row" suggests rows. */
    font-size: 0.8rem;
    color: #ccc;
    border-top: 1px solid #333;
    padding-top: 5px;
    gap: 2px;
}

.player-stat-row {
    display: flex;
    justify-content: space-between;
    /* Compact row */
}

/* Pause Overlay */
.pause-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 9999; /* Ensure highest */
    display: flex !important;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(5px);
}

.pause-menu {
    background: rgba(30, 30, 30, 0.95);
    padding: 30px;
    border-radius: 15px;
    border: 1px solid #555;
    display: flex;
    flex-direction: column;
    justify-content: center; /* Center children vertically */
    align-items: center;    /* Center children horizontally */
    gap: 15px;
    min-width: 250px;
    text-align: center;
    box-shadow: 0 10px 25px rgba(0,0,0,0.8);
}

.pause-menu h2 {
    color: white;
    margin-bottom: 20px;
    font-size: 1.8rem;
    letter-spacing: 2px;
}

.menu-btn {
    padding: 12px 24px;
    font-size: 1.1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.1s, background 0.2s;
    font-weight: bold;
}

.menu-btn:hover {
    transform: scale(1.05);
}

.menu-btn.continue {
    background-color: #42b883;
    color: white;
}
.menu-btn.continue:hover {
    background-color: #3aa876;
}

.menu-btn.settings {
    background-color: #444;
    color: white;
}
.menu-btn.settings:hover {
    background-color: #555;
}

.menu-btn.exit {
    background-color: #ef4444;
    color: white;
}
.menu-btn.exit:hover {
    background-color: #dc2626;
}
</style>
