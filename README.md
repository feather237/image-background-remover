# Image Background Remover

一键去除图片背景，基于 Remove.bg API + Next.js + Tailwind CSS。

## 功能

- 拖拽 / 点击 / 粘贴（Ctrl+V）上传图片
- 自动去除背景，返回透明 PNG
- 原图与结果对比预览
- 一键下载

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 Remove.bg API Key

# 3. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 部署到 Cloudflare Pages

```bash
# 构建
npm run build

# 部署（需要先 wrangler login）
wrangler pages deploy .next
```

在 Cloudflare Dashboard 设置环境变量 `REMOVE_BG_API_KEY`。

## 技术栈

- Next.js 15 (App Router)
- Tailwind CSS v4
- Remove.bg API
- Cloudflare Pages / Workers

## 需求文档

见 [docs/PRD.md](./docs/PRD.md)
