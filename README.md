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

## 服务器部署指南 (Server Deployment)
**目标服务器 IP**: `115.190.233.126`

要实现“服务器拉取 Git 仓库动态更新网页”，请按以下步骤操作：

### 1. 服务器环境准备
确保服务器安装了 **Git**, **Node.js** (推荐 v20+), **pnpm**, 和 **Nginx**。

```bash
# 安装 Node.js & pnpm (示例)
curl -fsSL https://get.pnpm.io/install.sh | sh -
# 安装 Nginx
apt update && apt install nginx git -y
```

### 2. 克隆仓库
在服务器的 Web 目录（例如 `/var/www/` 或 `/home/user/`）克隆项目：

```bash
cd /var/www
git clone git@github.com:Ljinzhou/WHSW_GameProject1MVP.git
```

### 3. 配置 Nginx
1. 复制项目中的 `nginx.conf` 内容。
2. 修改服务器的 Nginx 配置（通常在 `/etc/nginx/sites-available/default` 或新建配置文件）。
3. **重要**：修改配置中的 `root` 路径指向你刚刚克隆的 `dist` 目录。
   - 例如：`root /var/www/WHSW_GameProject1MVP/dist;`
4. 重启 Nginx: `systemctl restart nginx`

### 4. 首次部署与更新
进入项目目录并运行提供的脚本：

```bash
cd /var/www/WHSW_GameProject1MVP
chmod +x deploy.sh  # 赋予执行权限
./deploy.sh         # 运行部署脚本
```

此脚本会自动执行：
1. `git pull` (拉取最新代码)
2. `pnpm install` (安装/更新依赖)
3. `pnpm run build` (构建项目到 dist 目录)

### 日后更新
每次有新代码推送到 GitHub 后，只需在服务器运行 `./deploy.sh` 即可完成更新。
