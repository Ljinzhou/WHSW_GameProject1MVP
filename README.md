# WHSW GameProject1 MVP

这是一个基于 Vue 3 + TypeScript + Phaser 3 的游戏 Demo 项目。

## 功能特性
- 类似塔防/生存的战斗核心玩法。
- 自动战斗、技能施放、等级成长系统。
- 敌人生成与寻路逻辑。
- 动态伤害飘字与战斗统计图表 (ECharts)。
- 游戏暂停、继续与全局控制。

## 开发环境
需要安装 Node.js 和 pnpm。

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm run dev
```

## 构建部署

### 打包
```bash
pnpm run build
```
构建产物将输出到 `dist` 目录。

## 主要目录结构
- `src/game/`: 游戏核心逻辑 (Phaser Scenes, Objects)
- `src/views/`: Vue 视图组件 (GameView.vue)
- `src/App.vue`: 程序入口
