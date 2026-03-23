# GDevelop 第三方 AI 配置问题诊断和解决方案

## 问题现象
设置第三方 API 后，AI 对话时显示错误。

## 核心代码位置

### 1. AI 配置文件
- **UI 设置**: `/newIDE/app/src/AiGeneration/AiSettings.js`
- **全局配置**: `/newIDE/app/src/Utils/GDevelopServices/ApiConfigs.js`
- **浏览器控制台配置**: `/newIDE/app/public/custom-ai-config.js`

### 2. AI 请求核心
- **请求处理**: `/newIDE/app/src/Utils/GDevelopServices/Generation.js`
- **事件生成**: `/newIDE/app/src/AiGeneration/UseGenerateEvents.js`
- **对话界面**: `/newIDE/app/src/AiGeneration/AiRequestChat/index.js`
- **聊天消息**: `/newIDE/app/src/AiGeneration/AiRequestChat/ChatMessages.js`

### 3. 错误处理
- **错误提取**: `/newIDE/app/src/Utils/GDevelopServices/Errors.js`
- **错误显示**: `/newIDE/app/src/AiGeneration/AskAiEditorContainer.js`

## 常见问题及解决方案

### 问题 1: API 端点不兼容

**症状**: 发送消息后立即显示错误，Network 标签显示 404 或 500 错误

**原因**: 第三方 API 不支持 GDevelop 需要的端点

**解决方案**:
1. 检查你的第三方 API 是否支持以下端点：
   - `POST /ai-request` - 创建 AI 请求
   - `GET /ai-request/{id}` - 获取 AI 请求状态
   - `POST /ai-generated-event` - 生成事件
   - `GET /ai-generated-event/{id}` - 获取生成事件

2. 如果使用纯 OpenAI API（如 OpenAI 官方 API、DeepSeek 等），需要一个代理服务器来转换 GDevelop 请求格式为 OpenAI 格式。

**推荐的代理方案**:
```bash
# 使用 CNB OpenAI 代理
# 见: /workspace/cnb_openai_proxy.py
```

### 问题 2: CORS 跨域问题

**症状**: Network 标签显示 CORS 错误

**原因**: 第三方 API 服务器没有配置允许 GDevelop 域名的 CORS

**解决方案**:
1. 配置第三方 API 服务器的 CORS：
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Authorization, Content-Type
   ```

2. 或使用支持 CORS 的代理服务器

### 问题 3: 认证头格式错误

**症状**: Network 标签显示 401 或 403 错误

**原因**: API Key 格式不正确或认证头设置有问题

**解决方案**:
1. 检查 API Key 格式（是否包含 `Bearer` 前缀）
2. 查看 `Generation.js:249-267` 中的 `getApiClient()` 函数

```javascript
// Generation.js 第 249-267 行
export const getApiClient = (): Axios => {
  const customConfig = getCustomAiApiConfig();
  if (customConfig.enabled && customConfig.baseUrl) {
    return axios.create({
      baseURL: customConfig.baseUrl,
      headers: customConfig.apiKey
        ? {
            Authorization: `Bearer ${customConfig.apiKey}`,
            'Content-Type': 'application/json',
          }
        : {
            'Content-Type': 'application/json',
          },
    });
  }
  return axios.create({
    baseURL: GDevelopGenerationApi.baseUrl,
  });
};
```

注意：代码会自动添加 `Bearer` 前缀，所以你的 API Key 不应该包含 `Bearer ` 前缀。

### 问题 4: API 配置未正确加载

**症状**: 配置后仍然显示要求登录

**原因**: localStorage 配置未正确加载或页面未刷新

**解决方案**:
1. 在浏览器控制台运行：
   ```javascript
   // 检查配置
   window.GDevelopCustomAIConfig

   // 如果为空或 enabled: false，重新配置
   window.enableCustomAI('https://你的API地址/v1', '你的API密钥')

   // 刷新页面
   location.reload()
   ```

2. 检查 index.js:90-103 中的配置加载逻辑

### 问题 5: 请求体格式不匹配

**症状**: Network 标签显示 400 Bad Request

**原因**: 第三方 API 期望的请求体格式与 GDevelop 发送的不同

**解决方案**:
查看 `Generation.js:417-445` 中 `createAiRequest` 的请求体格式：

```javascript
const response = await client.post(
  '/ai-request',
  {
    gdevelopVersionWithHash: getIDEVersionWithHash(),
    userRequest,
    gameProjectJson,
    gameProjectJsonUserRelativeKey,
    projectSpecificExtensionsSummaryJson,
    projectSpecificExtensionsSummaryJsonUserRelativeKey,
    payWithCredits: !!payWithCredits,
    payWithAiCredits: !payWithCredits,
    mode,
    aiConfiguration,
    gameId,
    projectVersionIdBeforeMessage,
    fileMetadata,
    storageProviderName,
    toolsVersion,
  },
  {
    params: { userId },
    headers: customConfig.enabled ? {} : { Authorization: authorizationHeader },
  }
);
```

GDevelop 期望的是 `/ai-request` 端点，而标准 OpenAI API 使用 `/chat/completions` 端点。

**这是关键问题！** GDevelop 的 API 格式与标准 OpenAI API 格式完全不同。

## 关键发现：API 格式不兼容

### GDevelop 期望的 API 格式
```
POST /ai-request
{
  "userRequest": "string",
  "gameProjectJson": "string",
  "mode": "chat" | "agent",
  "aiConfiguration": { "presetId": "string" },
  ...
}
```

### 标准 OpenAI API 格式
```
POST /chat/completions
{
  "model": "gpt-3.5-turbo",
  "messages": [
    { "role": "user", "content": "string" }
  ]
}
```

**结论**: 你不能直接使用标准 OpenAI API（如 OpenAI 官方 API、DeepSeek 等），因为它们不兼容 GDevelop 的 API 格式。

## 正确的解决方案

### 方案 1: 使用 GDevelop 官方 API

不修改任何配置，直接使用 GDevelop 官方 API 服务。

### 方案 2: 创建兼容代理服务器

创建一个代理服务器，将 GDevelop 的请求转换为 OpenAI 格式：

```javascript
// 示例：Node.js 代理服务器
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/ai-request', async (req, res) => {
  const { userRequest, mode } = req.body;

  // 将 GDevelop 格式转换为 OpenAI 格式
  const openaiRequest = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a game development assistant.' },
      { role: 'user', content: userRequest }
    ]
  };

  // 调用 OpenAI API
  const openaiResponse = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    openaiRequest,
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // 将 OpenAI 响应转换回 GDevelop 格式
  const gdevelopResponse = {
    id: generateId(),
    status: 'ready',
    output: [
      {
        type: 'message',
        status: 'completed',
        role: 'assistant',
        content: [
          {
            type: 'output_text',
            status: 'completed',
            text: openaiResponse.data.choices[0].message.content,
            annotations: []
          }
        ]
      }
    ]
  };

  res.json(gdevelopResponse);
});

app.listen(3000, () => {
  console.log('Proxy server running on port 3000');
});
```

### 方案 3: 使用已有的 CNB OpenAI 代理

你已经有了 `/workspace/cnb_openai_proxy.py`，它可以作为兼容层。

查看该文件以确保它正确实现了 GDevelop 的 API 格式。

## 诊断步骤

### 1. 打开浏览器开发者工具
按 F12，切换到 Console 标签

### 2. 加载诊断脚本
复制并粘贴 `/workspace/GDevelop/检查AI配置.js` 的内容到控制台

### 3. 查看 Network 标签
1. 切换到 Network 标签
2. 发送一条 AI 消息
3. 查看失败的请求：
   - 状态码（404, 401, 403, 500 等）
   - 请求 URL
   - 请求头
   - 请求体
   - 响应内容

### 4. 查看 Console 标签
查找任何 JavaScript 错误

### 5. 检查 localStorage
在 Console 中运行：
```javascript
localStorage.getItem('gdevelop-custom-ai-enabled')
localStorage.getItem('gdevelop-custom-ai-baseurl')
localStorage.getItem('gdevelop-custom-ai-apikey')
```

## 推荐配置方式

### 使用 CNB 代理（推荐）

```javascript
window.enableCustomAI('https://your-cnb-proxy-url.com/v1', 'your-cnb-token')
```

### 使用本地代理

```javascript
window.enableCustomAI('http://localhost:3000/v1', 'your-local-key')
```

### 禁用自定义 API

```javascript
window.disableCustomAI()
```

## 相关文件

- `/workspace/GDevelop/快速配置指南.md` - 快速配置指南
- `/workspace/GDevelop/CUSTOM_AI_README.md` - 详细技术文档
- `/workspace/cnb_openai_proxy.py` - CNB OpenAI 代理服务器

## 总结

**核心问题**: GDevelop 使用自定义的 API 格式，与标准 OpenAI API 格式不兼容。

**解决方案**: 使用兼容的代理服务器（如 CNB OpenAI 代理）将 GDevelop 请求转换为 OpenAI 格式。

**关键代码位置**:
- `ApiConfigs.js` - 配置存储
- `Generation.js` - API 调用
- `custom-ai-config.js` - 浏览器配置接口

如果问题仍然存在，请：
1. 运行诊断脚本
2. 查看 Network 标签的详细错误
3. 检查第三方 API 文档
4. 使用兼容的代理服务器
