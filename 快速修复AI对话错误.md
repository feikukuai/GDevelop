# GDevelop AI 对话错误快速修复指南

## 问题：设置第三方 API 后 AI 对话显示错误

### 根本原因

**GDevelop 使用自定义的 API 格式，与标准 OpenAI API 格式不兼容！**

- **GDevelop 期望**: `POST /ai-request` 端点，自定义请求体格式
- **OpenAI API 提供**: `POST /chat/completions` 端点，OpenAI 请求体格式

**这意味着你不能直接使用 OpenAI 官方 API、DeepSeek、Anthropic 等标准 API！**

---

## 解决方案

### 方案 1：使用 GDevelop 官方 API（最简单）

不设置任何自定义 API，直接使用 GDevelop 官方服务：

1. 在浏览器控制台运行：
   ```javascript
   window.disableCustomAI()
   ```

2. 刷新页面

3. 登录 GDevelop 账户即可使用

---

### 方案 2：使用 GDevelop-CNBBridge 代理（推荐）

我已经为你创建了一个兼容代理，它将 GDevelop 请求转换为 CNB API 格式。

#### 步骤 1：安装依赖

```bash
cd /workspace/GDevelop
pip install flask requests
```

#### 步骤 2：启动代理服务器

```bash
export CNB_TOKEN="your-cnb-token"  # 你的 CNB Token
python gdevelop-cnb-bridge.py
```

服务器将在 `http://localhost:8081` 启动。

#### 步骤 3：配置 GDevelop

打开浏览器，按 F12 打开控制台，运行：

```javascript
window.enableCustomAI('http://localhost:8081/v1', 'dummy-key')
```

**注意**: API Key 使用 `dummy-key`，因为实际认证由 CNB Token 处理。

#### 步骤 4：刷新页面

```javascript
location.reload()
```

#### 步骤 5：测试

在 GDevelop AI 界面发送一条消息，应该可以正常工作。

---

### 方案 3：诊断现有配置

如果你想使用其他第三方 API，先诊断问题：

#### 步骤 1：打开诊断工具

打开 `/workspace/GDevelop/检查AI配置.js` 文件，复制全部内容。

在浏览器控制台（F12）中粘贴并运行。

#### 步骤 2：查看 Network 标签

1. 切换到 Network 标签
2. 发送一条 AI 消息
3. 查看失败的请求

**常见错误**:

| HTTP 状态码 | 原因 | 解决方案 |
|------------|------|---------|
| 404 | 端点不存在 | 你的 API 不支持 `/ai-request` 端点 |
| 401 | 认证失败 | API Key 不正确 |
| 403 | 权限不足 | API Key 没有访问权限 |
| 500 | 服务器错误 | API 服务器内部错误 |
| CORS | 跨域错误 | API 服务器没有配置 CORS |

#### 步骤 3：查看请求和响应

点击失败的请求，查看：
- **Request URL**: 是否正确
- **Request Headers**: Authorization 头是否正确
- **Request Payload**: 请求体格式
- **Response**: 错误详情

---

## 核心代码位置

### 1. 配置文件

| 文件 | 说明 |
|------|------|
| `/newIDE/app/src/Utils/GDevelopServices/ApiConfigs.js` | 全局 API 配置存储 |
| `/newIDE/app/src/AiGeneration/AiSettings.js` | UI 设置界面 |
| `/newIDE/app/public/custom-ai-config.js` | 浏览器控制台配置接口 |
| `/newIDE/app/src/index.js:90-103` | 启动时从 localStorage 加载配置 |

### 2. API 调用核心

| 文件 | 说明 |
|------|------|
| `/newIDE/app/src/Utils/GDevelopServices/Generation.js` | 所有 API 调用逻辑 |
| `/newIDE/app/src/AiGeneration/UseGenerateEvents.js` | 事件生成逻辑 |
| `/newIDE/app/src/AiGeneration/AiRequestChat/index.js` | 对话界面 |

### 3. 错误处理

| 文件 | 说明 |
|------|------|
| `/newIDE/app/src/Utils/GDevelopServices/Errors.js` | 错误提取工具 |
| `/newIDE/app/src/AiGeneration/AskAiEditorContainer.js` | 错误显示逻辑 |
| `/newIDE/app/src/AiGeneration/AiRequestChat/ChatMessages.js` | 聊天错误显示 |

---

## API 格式对比

### GDevelop 发送的请求格式

```javascript
// POST /ai-request
{
  "userRequest": "如何创建一个平台游戏？",
  "gameProjectJson": "...",
  "mode": "chat",
  "aiConfiguration": {
    "presetId": "default"
  },
  "toolsVersion": "..."
}
```

### 标准 OpenAI API 格式

```javascript
// POST /chat/completions
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "如何创建一个平台游戏？"
    }
  ]
}
```

**完全不同的格式！这就是为什么需要代理。**

---

## 详细技术文档

- `/workspace/GDevelop/快速配置指南.md` - 快速配置指南
- `/workspace/GDevelop/CUSTOM_AI_README.md` - 详细技术文档
- `/workspace/GDevelop/AI配置问题诊断和解决方案.md` - 完整诊断文档

---

## 常见问题 FAQ

### Q1: 为什么不能直接使用 OpenAI API？

**A**: GDevelop 使用自定义的 API 格式和端点（`/ai-request`），与标准 OpenAI API（`/chat/completions`）不兼容。需要一个代理服务器来转换格式。

### Q2: 代理服务器安全吗？

**A**: 代理服务器运行在你的本地或私有服务器上，所有 API 调用都通过你配置的 Token 认证。只要保护好 CNB Token，就是安全的。

### Q3: 可以使用其他 AI 服务吗？

**A**: 可以，但需要创建一个兼容代理。参考 `gdevelop-cnb-bridge.py` 的实现，将其中的 CNB API 调用替换为你想使用的 API。

### Q4: 为什么配置后仍要求登录？

**A**:
1. 检查 localStorage 配置是否正确加载
2. 检查 `ApiConfigs.js:117-123` 中的 `customAiApiConfig.enabled` 是否为 `true`
3. 刷新页面

### Q5: Network 标签显示 CORS 错误怎么办？

**A**:
1. 使用本地代理（如 `gdevelop-cnb-bridge.py`）
2. 或配置第三方 API 服务器的 CORS 头：
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, OPTIONS
   Access-Control-Allow-Headers: Authorization, Content-Type
   ```

### Q6: 如何查看详细错误信息？

**A**:
1. 打开浏览器开发者工具（F12）
2. Console 标签：查看 JavaScript 错误
3. Network 标签：查看 API 请求和响应
4. 运行诊断脚本 `/workspace/GDevelop/检查AI配置.js`

---

## 快速命令参考

### 配置自定义 API

```javascript
// 启用
window.enableCustomAI('http://localhost:8081/v1', 'dummy-key')

// 查看配置
window.GDevelopCustomAIConfig

// 禁用
window.disableCustomAI()

// 刷新页面
location.reload()
```

### 代理服务器命令

```bash
# 启动 CNB 代理
python gdevelop-cnb-bridge.py

# 或使用现有的 OpenAI 代理
python ../cnb_openai_proxy.py
```

---

## 总结

**问题**: GDevelop API 格式与标准 OpenAI API 不兼容

**解决方案**: 使用兼容代理（如 `gdevelop-cnb-bridge.py`）转换请求格式

**关键文件**:
- `ApiConfigs.js` - 配置
- `Generation.js` - API 调用
- `custom-ai-config.js` - 浏览器配置

**下一步**:
1. 启动 `gdevelop-cnb-bridge.py`
2. 在浏览器中配置自定义 API
3. 测试 AI 对话功能

如有问题，请查看浏览器控制台和 Network 标签的详细错误信息。
