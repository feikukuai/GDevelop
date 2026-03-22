# GDevelop 自定义 AI 配置指南

## 概述

已成功修改 GDevelop，支持使用第三方 OpenAI 兼容的 AI 接口，完全绕过官方认证。

## 修改内容

### 1. API 配置 (`ApiConfigs.js`)
添加了自定义 AI 配置管理：
```javascript
export let customAiApiConfig = {
  baseUrl: null,
  apiKey: null,
  enabled: false,
};

export const setCustomAiApiConfig = (config) => { ... };
export const getCustomAiApiConfig = () => customAiApiConfig;
```

### 2. 生成服务 (`Generation.js`)
修改了以下函数以支持自定义 API：
- `getApiClient()` - 动态返回自定义或官方 API 客户端
- `getAiRequest()` - 使用自定义 API 时跳过官方认证
- `createAiRequest()` - 使用自定义 API 时跳过官方认证
- `createAiGeneratedEvent()` - 使用自定义 API 时跳过官方认证

### 3. 事件生成 Hook (`UseGenerateEvents.js`)
修改登录检查逻辑，使用自定义 API 时不需要登录：
```javascript
const customConfig = getCustomAiApiConfig();
if (!customConfig.enabled && !profile) {
  throw new Error('User should be authenticated.');
}
```

### 4. 前端配置 (`custom-ai-config.js`)
提供了浏览器控制台配置接口：
```javascript
window.enableCustomAI('https://your-api.com/v1', 'your-api-key')
window.disableCustomAI()
```

## 使用方法

### 方法一：浏览器控制台（推荐）

1. 打开 GDevelop Web 界面
2. 按 F12 打开浏览器控制台
3. 运行以下命令：

```javascript
// 启用自定义 AI
window.enableCustomAI('https://your-api.com/v1', 'sk-your-api-key-here')

// 禁用自定义 AI（恢复官方服务）
window.disableCustomAI()

// 查看当前配置
window.GDevelopCustomAIConfig
```

### 方法二：修改环境变量

在构建时设置环境变量：
```bash
REACT_APP_CUSTOM_AI_API_URL=https://your-api.com/v1
REACT_APP_CUSTOM_AI_API_KEY=sk-your-api-key-here
```

### 方法三：代码中配置

在 `ApiConfigs.js` 中直接设置：
```javascript
export const GDevelopGenerationApi = {
  baseUrl: 'https://your-api.com/v1', // 修改为你的 API 地址
};
```

## 自定义 API 要求

你的自定义 API 必须：

1. **OpenAI 兼容**：支持 OpenAI API 格式
2. **必需端点**：
   - `POST /ai-request` - 创建 AI 请求
   - `GET /ai-request/{id}` - 获取 AI 请求状态
   - `POST /ai-generated-event` - 生成事件
   - `GET /ai-generated-event/{id}` - 获取生成事件

3. **认证方式**：
   - 支持 `Authorization: Bearer <token>` 头
   - 或支持 API Key 参数

## 使用示例

### 配置本地 OpenAI 代理

```javascript
window.enableCustomAI('http://localhost:8000/v1', 'your-api-key')
```

### 配置 CNB OpenAI 代理

```javascript
window.enableCustomAI('https://your-cnb-proxy.com/v1', 'your-cnb-token')
```

### 配置其他 OpenAI 兼容服务

```javascript
window.enableCustomAI('https://api.deepseek.com/v1', 'your-deepseek-key')
window.enableCustomAI('https://api.anthropic.com/v1', 'your-anthropic-key')
```

## 注意事项

1. **API 兼容性**：确保你的 API 完全兼容 OpenAI 接口格式
2. **请求格式**：GDevelop 发送的请求格式与官方服务一致
3. **安全性**：API Key 会保存在 localStorage 中，请注意安全性
4. **清除配置**：使用 `window.disableCustomAI()` 或清除浏览器数据

## 故障排除

### 问题：仍然要求登录

**解决方案**：
1. 确认自定义 API 已启用：检查 `window.GDevelopCustomAIConfig.enabled`
2. 刷新页面以应用配置
3. 检查控制台是否有错误信息

### 问题：请求失败

**解决方案**：
1. 确认 API 地址正确
2. 检查 API Key 是否有效
3. 打开浏览器开发者工具查看网络请求
4. 确认 API 服务器正常运行

### 问题：配置不生效

**解决方案**：
1. 清除浏览器缓存和 localStorage
2. 重新运行配置命令
3. 刷新页面
4. 检查 `custom-ai-config.js` 是否正确加载

## 技术细节

### 数据流

```
用户输入 → UseGenerateEvents
         ↓
    Generation.js (createAiGeneratedEvent)
         ↓
    getApiClient() → 检查 customAiApiConfig.enabled
         ↓
    自定义 API (如果启用) 或 官方 API
         ↓
    返回结果到 GDevelop
```

### 关键修改点

1. **ApiConfigs.js**: 添加配置存储和获取函数
2. **Generation.js**: 修改所有 API 调用以使用动态客户端
3. **UseGenerateEvents.js**: 跳过登录检查
4. **index.html**: 加载配置脚本
5. **index.js**: 初始化时加载 localStorage 配置

## 下一步

- [ ] 添加 UI 设置界面（替代控制台配置）
- [ ] 支持多个 API 配置切换
- [ ] 添加配置验证和测试功能
- [ ] 支持更多 AI 提供商

## 许可

本修改基于 GDevelop 开源项目，遵循原项目许可证。
