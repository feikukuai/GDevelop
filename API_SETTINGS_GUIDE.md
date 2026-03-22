# GDevelop 自定义 AI 设置指南

## 功能介绍

现在 GDevelop 已经支持在左侧菜单中配置自定义 OpenAI 兼容的 AI API，无需登录 GDevelop 账户即可使用 AI 功能。

## 新增功能

### 左侧菜单新增 "API Settings" 选项卡

在左侧菜单栏的 "Shop" 和 "Teach" 之间添加了 "API Settings" 选项卡，提供图形化界面配置自定义 AI API。

## 使用方法

### 1. 访问设置页面

1. 打开 GDevelop Web 版（http://localhost:3000）
2. 点击左侧菜单栏的 **"API Settings"** 选项（在 Shop 和 Teach 之间）

### 2. 配置自定义 API

在 API Settings 页面中：

#### 启用自定义 AI
- 打开 **"Enable Custom AI API"** 开关

#### 设置 API Base URL
- **Ollama (本地)**: `http://localhost:11434/v1`
- **OpenAI**: `https://api.openai.com/v1`
- **CNB 代理**: 你的 CNB 代理地址（如 `http://localhost:8082/v1`）
- **其他兼容 API**: 输入完整的 API 地址

#### 设置 API Key（可选）
- 如果你的 API 需要认证，输入 API Key
- 对于 Ollama 或某些本地服务，可以留空

### 3. 保存设置

点击 **"Save Settings"** 按钮保存配置。

### 4. 刷新页面

保存后会提示刷新页面以应用更改。

## 配置示例

### 本地 Ollama 配置

```
Enable Custom AI API: ✓ 开启
API Base URL: http://localhost:11434/v1
API Key: (留空)
```

### CNB 代理配置

```
Enable Custom AI API: ✓ 开启
API Base URL: http://localhost:8082/v1
API Key: (留空或输入你的 CNB Token)
```

### OpenAI 配置

```
Enable Custom AI API: ✓ 开启
API Base URL: https://api.openai.com/v1
API Key: sk-xxxxx (你的 OpenAI API Key)
```

## 特性

- ✅ **无需登录**：使用自定义 API 时不需要登录 GDevelop 账户
- ✅ **OpenAI 兼容**：支持任何 OpenAI 兼容的 API
- ✅ **本地模型**：支持使用本地运行的模型（如 Ollama、LLaMA）
- ✅ **持久化存储**：配置保存在 localStorage 中，刷新页面不丢失
- ✅ **一键切换**：可以随时启用/禁用自定义 API
- ✅ **图形界面**：简单易用的设置页面

## 常见问题

### Q: 配置后 AI 请求失败？
A: 检查 API URL 是否正确，确保服务正在运行，并查看浏览器控制台的错误信息。

### Q: 如何恢复使用默认 GDevelop AI？
A: 在设置页面关闭 "Enable Custom AI API" 开关，保存即可。

### Q: 支持哪些 AI 服务？
A: 任何提供 OpenAI 兼容接口的服务都支持，包括：
- Ollama（本地）
- OpenAI
- CNB 代理
- 其他自定义服务

### Q: API Key 会泄露吗？
A: API Key 仅保存在浏览器的 localStorage 中，不会发送到 GDevelop 服务器。

## 技术说明

配置保存在以下 localStorage 键中：
- `gdevelop-custom-ai-enabled`: 是否启用自定义 API
- `gdevelop-custom-ai-baseurl`: API 基础 URL
- `gdevelop-custom-ai-apikey`: API Key

## 浏览器控制台配置方式

如果你想通过浏览器控制台配置（备用方案），仍然可以使用之前的方法：

```javascript
// 启用自定义 API
window.enableCustomAI('http://localhost:11434/v1', 'your-api-key');

// 禁用自定义 API
window.disableCustomAI();

// 查看当前配置
window.getCustomAIConfig();
```

## 反馈和问题

如果遇到问题，请检查：
1. 浏览器控制台是否有错误信息
2. API 服务是否正在运行
3. API URL 和 Key 是否正确
4. 网络连接是否正常
