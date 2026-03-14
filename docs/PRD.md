# Image Background Remover — MVP 需求文档

> 版本：v0.1 · 状态：草稿 · 日期：2026-03-14
> 飞书原文：https://feishu.cn/docx/YvV9dV5oaoZWXDxUmO9cIO8qn4b

---

## 1. 产品定位

一个极简的在线抠图工具，用户上传图片，一键去除背景，下载透明 PNG。

- **目标用户：** 电商卖家、设计师、社交媒体运营者
- **核心价值：** 快、免费（有限额）、无需注册即可使用

---

## 2. 技术架构

```
用户浏览器
  └─ 上传图片（最大 10MB）
       └─ Cloudflare Worker（边缘节点）
            └─ 调用 Remove.bg API
                 └─ 返回透明 PNG
                      └─ 浏览器直接下载（不落盘）
```

**技术栈：**
- 前端：纯 HTML/CSS/JS（单文件，内嵌在 Worker 中）
- 后端：Cloudflare Workers（无服务器，全球边缘）
- 抠图引擎：Remove.bg API
- 存储：无（图片仅在内存中流转）

---

## 3. MVP 功能范围

### 3.1 核心功能（必须有）

| 功能 | 描述 |
| --- | --- |
| 图片上传 | 支持拖拽、点击选择、粘贴（Ctrl+V） |
| 背景去除 | 调用 Remove.bg API，返回透明 PNG |
| 结果预览 | 左右对比展示原图与处理结果 |
| 下载 | 一键下载透明 PNG |
| 错误提示 | API 失败、格式不支持、超出限额时给出友好提示 |

### 3.2 不在 MVP 范围（后续迭代）

- 用户注册/登录
- 历史记录
- 批量处理
- 替换背景色/图片
- 付费订阅

---

## 4. 页面设计

### 4.1 主页（唯一页面）

**布局结构：**
```
[Header] Logo + 产品名 + 简短 slogan
[上传区] 拖拽区域，支持点击和粘贴
[处理中] Loading 动画（调用 API 期间）
[结果区] 左：原图 / 右：去背景结果 + 下载按钮
[Footer] 免责声明 + Remove.bg 归因
```

**交互流程：**
1. 用户上传图片 → 立即显示原图预览
2. 自动触发去背景请求（无需点击按钮）
3. 处理中显示进度动画
4. 完成后展示对比图 + 下载按钮
5. 用户可继续上传新图片（重置状态）

---

## 5. 技术约束

| 项目 | 限制 |
| --- | --- |
| 图片大小 | ≤ 10MB（Remove.bg 限制） |
| 图片格式 | JPG、PNG、WebP |
| 输出格式 | PNG（透明背景） |
| CF Worker 请求超时 | 30 秒 |
| Remove.bg 免费额度 | 50 次/月 |
| API Key 存储 | CF Worker 环境变量（不暴露给前端） |

---

## 6. API 设计

**POST** `/api/remove-bg`

Request:
```
Content-Type: multipart/form-data
Body: { image: File }
```

Response（成功）:
```
Content-Type: image/png
Body: <透明PNG二进制>
```

Response（失败）:
```json
{ "error": "错误描述", "code": "RATE_LIMIT | INVALID_FILE | API_ERROR" }
```

---

## 7. 部署方案

| 组件 | 平台 | 说明 |
| --- | --- | --- |
| 前端+后端 | Cloudflare Workers | 边缘计算，免费额度 10万次/天 |
| 域名 | Cloudflare | 可绑定自定义域名 |
| API Key | CF Worker 环境变量 | `REMOVE_BG_API_KEY` |

**部署步骤：**
1. `wrangler deploy` 发布 Worker
2. 在 CF Dashboard 设置环境变量 `REMOVE_BG_API_KEY`

---

## 8. 成功指标（MVP 验证）

- [ ] 用户能在 5 秒内完成上传→下载全流程
- [ ] 抠图成功率 > 90%
- [ ] 页面加载时间 < 1 秒
- [ ] 移动端可用（响应式布局）

---

## 9. 开发排期（参考）

| 阶段 | 内容 | 预估时间 |
| --- | --- | --- |
| Day 1 | CF Worker 开发 + Remove.bg 接入 | 2h |
| Day 1 | 前端页面开发（上传+预览+下载） | 3h |
| Day 2 | 联调测试 + 错误处理完善 | 2h |
| Day 2 | 部署上线 + 域名配置 | 1h |

**总计：约 1-2 天可上线 MVP**

---

## 10. 风险与注意事项

- **Remove.bg 免费额度有限**：MVP 阶段够用，规模化后需付费或切换引擎
- **API Key 安全**：必须放在 Worker 环境变量，绝不能暴露在前端代码中
- **CF Worker 限制**：免费版单次请求最大响应体 ~25MB，足够处理图片
- **国内访问**：Cloudflare 在国内速度不稳定，如目标用户在国内需考虑备案+国内 CDN
