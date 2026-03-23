/**
 * GDevelop AI 配置诊断工具
 * 用于检查第三方 AI 配置是否正确设置
 */

console.log('=== GDevelop AI 配置诊断 ===\n');

// 1. 检查 localStorage 配置
console.log('1️⃣ 检查 localStorage 配置:');
const enabled = localStorage.getItem('gdevelop-custom-ai-enabled');
const baseUrl = localStorage.getItem('gdevelop-custom-ai-baseurl');
const apiKey = localStorage.getItem('gdevelop-custom-ai-apikey');

console.log('  enabled:', enabled);
console.log('  baseUrl:', baseUrl);
console.log('  apiKey:', apiKey ? '***' + apiKey.slice(-4) : 'null');

// 2. 检查全局配置对象
console.log('\n2️⃣ 检查全局配置对象:');
console.log('  window.GDevelopCustomAIConfig:', window.GDevelopCustomAIConfig);

// 3. 检查 GDevelop 内部配置（如果已加载）
console.log('\n3️⃣ 检查 GDevelop 内部配置:');
console.log('  React 应用是否已加载:', typeof React !== 'undefined');

// 4. 提供修复建议
console.log('\n4️⃣ 诊断结果和建议:');

if (!enabled || enabled !== 'true') {
  console.log('❌ 问题: 自定义 AI 未启用');
  console.log('   解决方案: 运行 window.enableCustomAI("你的API地址", "你的API密钥")');
} else if (!baseUrl) {
  console.log('❌ 问题: 未设置 API Base URL');
  console.log('   解决方案: 运行 window.enableCustomAI("你的API地址", "你的API密钥")');
} else if (!apiKey) {
  console.log('❌ 问题: 未设置 API Key');
  console.log('   解决方案: 运行 window.enableCustomAI("你的API地址", "你的API密钥")');
} else {
  console.log('✅ localStorage 配置看起来正确');
  console.log('   配置:', { enabled, baseUrl, apiKey: '***' + apiKey.slice(-4) });

  // 验证 URL 格式
  try {
    new URL(baseUrl);
    console.log('✅ URL 格式有效');
  } catch (e) {
    console.log('❌ 问题: URL 格式无效:', e.message);
  }

  // 检查是否以 /v1 或 /v1/chat/completions 结尾
  if (!baseUrl.includes('/v1')) {
    console.log('⚠️  警告: URL 可能不包含 /v1 路径');
    console.log('   大多数 OpenAI 兼容 API 使用 /v1 路径');
  }
}

// 5. 测试 API 连接
console.log('\n5️⃣ API 连接测试:');
if (baseUrl && apiKey) {
  console.log('   正在测试 API 连接...');
  fetch(baseUrl + '/models', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('   HTTP 状态码:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ API 响应成功');
    console.log('   可用模型:', data.data ? data.data.slice(0, 3).map(m => m.id).join(', ') : '无法获取');
  })
  .catch(error => {
    console.log('❌ API 连接失败:', error.message);
    console.log('   可能的原因:');
    console.log('   - API 地址不正确');
    console.log('   - API 密钥无效');
    console.log('   - CORS 限制');
    console.log('   - 网络问题');
  });
} else {
  console.log('   跳过: 未配置 API');
}

// 6. 显示常用命令
console.log('\n6️⃣ 常用命令:');
console.log('   window.enableCustomAI("https://api.openai.com/v1", "sk-你的密钥")');
console.log('   window.disableCustomAI()');
console.log('   window.GDevelopCustomAIConfig');

console.log('\n=== 诊断完成 ===');
