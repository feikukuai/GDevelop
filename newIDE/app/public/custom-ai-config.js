/**
 * Custom AI Configuration for GDevelop
 *
 * You can configure a custom OpenAI-compatible API by setting these values
 * before the GDevelop app loads, or by calling these functions in the browser console.
 */

// Configuration object
window.GDevelopCustomAIConfig = {
  enabled: false,
  baseUrl: null,
  apiKey: null,
};

/**
 * Enable and configure custom AI API
 * Call this in the browser console:
 * window.enableCustomAI('https://your-api.com/v1', 'your-api-key')
 */
window.enableCustomAI = function(baseUrl, apiKey) {
  if (typeof baseUrl !== 'string' || typeof apiKey !== 'string') {
    console.error('Both baseUrl and apiKey must be strings');
    return;
  }

  window.GDevelopCustomAIConfig = {
    enabled: true,
    baseUrl: baseUrl,
    apiKey: apiKey,
  };

  // Store in localStorage for persistence
  localStorage.setItem('gdevelop-custom-ai-enabled', 'true');
  localStorage.setItem('gdevelop-custom-ai-baseurl', baseUrl);
  localStorage.setItem('gdevelop-custom-ai-apikey', apiKey);

  console.log('✅ Custom AI API enabled:', baseUrl);

  // Reload the page to apply changes
  console.log('🔄 Reload the page to apply the configuration');
};

/**
 * Disable custom AI API and use official service
 * Call this in the browser console: window.disableCustomAI()
 */
window.disableCustomAI = function() {
  window.GDevelopCustomAIConfig = {
    enabled: false,
    baseUrl: null,
    apiKey: null,
  };

  localStorage.removeItem('gdevelop-custom-ai-enabled');
  localStorage.removeItem('gdevelop-custom-ai-baseurl');
  localStorage.removeItem('gdevelop-custom-ai-apikey');

  console.log('❌ Custom AI API disabled. Using official GDevelop AI service.');

  // Reload the page to apply changes
  console.log('🔄 Reload the page to apply the configuration');
};

/**
 * Load configuration from localStorage on page load
 */
(function loadCustomAIConfig() {
  const enabled = localStorage.getItem('gdevelop-custom-ai-enabled') === 'true';
  const baseUrl = localStorage.getItem('gdevelop-custom-ai-baseurl');
  const apiKey = localStorage.getItem('gdevelop-custom-ai-apikey');

  if (enabled && baseUrl) {
    window.GDevelopCustomAIConfig = {
      enabled: true,
      baseUrl: baseUrl,
      apiKey: apiKey,
    };
    console.log('✅ Custom AI API configuration loaded from localStorage:', baseUrl);
  }
})();

console.log(`
🤖 GDevelop Custom AI Configuration
===================================

Usage examples in browser console:

1. Enable custom API:
   window.enableCustomAI('https://api.openai.com/v1', 'sk-your-key-here')

2. Disable custom API:
   window.disableCustomAI()

3. Check current config:
   window.GDevelopCustomAIConfig

Note: Your custom API must be OpenAI-compatible.
`);
