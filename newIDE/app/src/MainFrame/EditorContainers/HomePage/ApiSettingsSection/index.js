// @flow
import * as React from 'react';
import TextField from '../../../../UI/TextField';
import {
  setCustomAiApiConfig,
  getCustomAiApiConfig,
} from '../../../../Utils/GDevelopServices/ApiConfigs';
import { showMessageBox } from '../../../../UI/Messages/MessageBox';

const styles = {
  container: {
    padding: 24,
    maxWidth: 900,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '2px solid #e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  switchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2c3e50',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.6,
    marginBottom: 8,
  },
  formRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    display: 'block',
  },
  helperText: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  buttonGroup: {
    display: 'flex',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '12px 32px',
    borderRadius: 6,
    border: 'none',
    fontSize: 15,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    color: '#666',
    padding: '12px 32px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: 15,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  fetchButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '8px 20px',
    borderRadius: 4,
    border: 'none',
    fontSize: 13,
    fontWeight: '500',
    cursor: 'pointer',
    marginLeft: 12,
    transition: 'background-color 0.2s',
  },
  fetchButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  modelList: {
    marginTop: 12,
    maxHeight: 200,
    overflowY: 'auto',
    border: '1px solid #ddd',
    borderRadius: 4,
    backgroundColor: 'white',
  },
  modelItem: {
    padding: 10,
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: 14,
    color: '#333',
  },
  modelItemHover: {
    backgroundColor: '#f0f0f0',
  },
  statusCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    border: '2px solid',
  },
  statusEnabled: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
    color: '#2E7D32',
  },
  statusDisabled: {
    backgroundColor: 'rgba(158, 158, 158, 0.1)',
    borderColor: '#9E9E9E',
    color: '#616161',
  },
  loadingText: {
    color: '#2196F3',
    fontSize: 14,
  },
  errorText: {
    color: '#f44336',
    fontSize: 13,
    marginTop: 8,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 13,
    marginTop: 8,
  },
  configPreview: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    marginTop: 16,
  },
  configItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  configLabel: {
    color: '#666',
    fontSize: 14,
  },
  configValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
};

type Model = {|
  id: string,
  name: string,
|};

const ApiSettingsSection = () => {
  const [enabled, setEnabled] = React.useState(false);
  const [baseUrl, setBaseUrl] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [modelName, setModelName] = React.useState('gpt-3.5-turbo');
  const [models, setModels] = React.useState<Model[]>([]);
  const [showModels, setShowModels] = React.useState(false);
  const [isLoadingModels, setIsLoadingModels] = React.useState(false);
  const [modelError, setModelError] = React.useState('');

  // Load saved configuration
  React.useEffect(() => {
    const config = getCustomAiApiConfig();
    setEnabled(config.enabled || false);
    setBaseUrl(config.baseUrl || '');
    setApiKey(config.apiKey || '');
    setModelName(config.modelName || 'gpt-3.5-turbo');
  }, []);

  const fetchModels = async () => {
    if (!baseUrl) {
      setModelError('Please enter API Base URL first');
      return;
    }

    setIsLoadingModels(true);
    setModelError('');
    setShowModels(true);

    try {
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      const availableModels = (data.data || [])
        .map((model: any) => ({
          id: model.id,
          name: model.id,
        }))
        .slice(0, 50); // Limit to 50 models

      setModels(availableModels);
      if (availableModels.length === 0) {
        setModelError('No models found on this endpoint');
      }
    } catch (error) {
      setModelError(`Error fetching models: ${error.message}`);
      console.error('Fetch models error:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleModelSelect = (model: Model) => {
    setModelName(model.id);
    setShowModels(false);
  };

  const handleSave = () => {
    if (enabled && !baseUrl) {
      showMessageBox({
        title: 'Error',
        message: 'Please enter a valid API base URL when custom AI is enabled.',
      });
      return;
    }

    setCustomAiApiConfig({
      enabled,
      baseUrl,
      apiKey,
      modelName,
    });

    // Save to localStorage for persistence
    localStorage.setItem('gdevelop-custom-ai-enabled', String(enabled));
    localStorage.setItem('gdevelop-custom-ai-baseurl', baseUrl);
    localStorage.setItem('gdevelop-custom-ai-apikey', apiKey);
    localStorage.setItem('gdevelop-custom-ai-modelname', modelName);

    showMessageBox({
      title: 'Settings Saved',
      message: enabled
        ? 'Custom AI API configuration saved. Please refresh page to apply changes.'
        : 'Custom AI disabled. Using default GDevelop AI service.',
    });
  };

  const handleReset = () => {
    setEnabled(false);
    setBaseUrl('');
    setApiKey('');
    setModelName('gpt-3.5-turbo');
    setModels([]);
    setShowModels(false);
    setModelError('');

    setCustomAiApiConfig({
      enabled: false,
      baseUrl: null,
      apiKey: null,
      modelName: 'gpt-3.5-turbo',
    });

    localStorage.removeItem('gdevelop-custom-ai-enabled');
    localStorage.removeItem('gdevelop-custom-ai-baseurl');
    localStorage.removeItem('gdevelop-custom-ai-apikey');
    localStorage.removeItem('gdevelop-custom-ai-modelname');

    showMessageBox({
      title: 'Settings Reset',
      message: 'Custom AI configuration has been reset.',
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>Custom AI API Settings</div>
        <div style={styles.switchContainer}>
          <span style={styles.switchLabel}>Enable Custom AI</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
            style={{
              width: 20,
              height: 20,
              cursor: 'pointer',
            }}
          />
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>About Custom AI</div>
        <div style={styles.infoText}>
          Configure your own OpenAI-compatible AI service to use instead of
          GDevelop's default AI. This allows you to use local models (like
          Ollama, LLaMA), third-party APIs, or your own AI service.
        </div>
        <div style={styles.infoText}>
          <strong>Key Benefits:</strong>
        </div>
        <ul
          style={{ marginLeft: 20, marginTop: 8, fontSize: 14, color: '#666' }}
        >
          <li>No GDevelop account required</li>
          <li>Use any OpenAI-compatible API</li>
          <li>Support for local models and custom endpoints</li>
          <li>Full control over your AI service</li>
          <li>Lower latency with local models</li>
        </ul>
      </div>

      {enabled ? (
        <div style={styles.statusCard}>
          <strong>Status: Custom AI Enabled</strong>
          <div style={styles.infoText}>
            Your AI requests will be sent to your configured endpoint.
          </div>
        </div>
      ) : (
        <div style={styles.statusCard}>
          <strong>Status: Using Default GDevelop AI</strong>
          <div style={styles.infoText}>
            AI requests will use GDevelop's default service (requires login).
          </div>
        </div>
      )}

      {enabled && (
        <>
          <div style={styles.card}>
            <div style={styles.cardTitle}>API Configuration</div>

            <div style={styles.formRow}>
              <label style={styles.label}>API Base URL *</label>
              <TextField
                fullWidth
                value={baseUrl}
                onChange={(e, value) => setBaseUrl(value)}
                placeholder="http://localhost:11434/v1"
              />
              <div style={styles.helperText}>
                The base URL of your OpenAI-compatible API
              </div>
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>API Key (Optional)</label>
              <TextField
                fullWidth
                value={apiKey}
                onChange={(e, value) => setApiKey(value)}
                type="password"
                placeholder="sk-..."
              />
              <div style={styles.helperText}>
                Leave empty for services that don't require authentication
              </div>
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>
                Model Name *
                <button
                  onClick={fetchModels}
                  disabled={!baseUrl || isLoadingModels}
                  style={{
                    ...styles.fetchButton,
                    ...(isLoadingModels && styles.fetchButtonDisabled),
                  }}
                >
                  {isLoadingModels ? 'Loading...' : 'Auto Fetch Models'}
                </button>
              </label>
              <TextField
                fullWidth
                value={modelName}
                onChange={(e, value) => setModelName(value)}
                placeholder="gpt-3.5-turbo"
              />
              <div style={styles.helperText}>
                The model name/ID to use for AI requests
              </div>

              {modelError && <div style={styles.errorText}>{modelError}</div>}

              {showModels && models.length > 0 && (
                <div style={styles.modelList}>
                  {models.map((model, index) => (
                    <div
                      key={index}
                      style={styles.modelItem}
                      onClick={() => handleModelSelect(model)}
                    >
                      {model.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Examples</div>

            <div style={styles.formRow}>
              <label style={styles.label}>Popular Endpoints</label>
              <ul style={{ marginLeft: 20, fontSize: 13, color: '#666' }}>
                <li>
                  <strong>Ollama (Local):</strong> http://localhost:11434/v1
                </li>
                <li>
                  <strong>OpenAI:</strong> https://api.openai.com/v1
                </li>
                <li>
                  <strong>CNB Proxy:</strong> https://your-cnb-proxy.com/v1
                </li>
                <li>
                  <strong>Custom Server:</strong> https://your-api.com/v1
                </li>
              </ul>
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>Common Models</label>
              <ul style={{ marginLeft: 20, fontSize: 13, color: '#666' }}>
                <li>
                  <strong>OpenAI:</strong> gpt-4, gpt-4-turbo, gpt-3.5-turbo
                </li>
                <li>
                  <strong>Ollama:</strong> qwen2.5-coder, llama3, mistral,
                  codellama
                </li>
                <li>
                  <strong>CNB/Local:</strong> Depends on your server
                  configuration
                </li>
              </ul>
            </div>
          </div>

          {enabled && baseUrl && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>Current Configuration</div>
              <div style={styles.configPreview}>
                <div style={styles.configItem}>
                  <span style={styles.configLabel}>Base URL:</span>
                  <span style={styles.configValue}>{baseUrl}</span>
                </div>
                <div style={styles.configItem}>
                  <span style={styles.configLabel}>API Key:</span>
                  <span style={styles.configValue}>
                    {apiKey ? '***' + apiKey.slice(-4) : 'None'}
                  </span>
                </div>
                <div style={styles.configItem}>
                  <span style={styles.configLabel}>Model:</span>
                  <span style={styles.configValue}>{modelName}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div style={styles.buttonGroup}>
        <button style={styles.primaryButton} onClick={handleSave}>
          Save Settings
        </button>
        <button style={styles.secondaryButton} onClick={handleReset}>
          Reset to Default
        </button>
      </div>
    </div>
  );
};

export default ApiSettingsSection;
