# Picture Deal

一键去除图片背景，基于 Remove.bg API + Cloudflare Workers。

## 功能

- 拖拽/点击/粘贴上传图片
- 自动去除背景，返回透明 PNG
- 原图与结果对比预览
- 一键下载

## 部署

### 1. 安装依赖

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 设置 API Key

在 Cloudflare Dashboard → Workers → picture-deal → Settings → Variables 中添加：

```
REMOVE_BG_API_KEY = 你的 remove.bg API Key
```

或通过命令行：

```bash
wrangler secret put REMOVE_BG_API_KEY
```

### 4. 部署

```bash
wrangler deploy
```

## 本地开发

```bash
wrangler dev
```

## 技术栈

- Cloudflare Workers（边缘计算，无服务器）
- Remove.bg API（AI 抠图）
- 纯原生 HTML/CSS/JS 前端（内嵌在 Worker 中）
