// @flow
import * as React from 'react';
import { Trans } from '@lingui/macro';
import { t } from '@lingui/macro';
import { I18n } from '@lingui/react';
import TextField from '../../../../UI/TextField';
import RaisedButton from '../../../../UI/RaisedButton';
import {
  setCustomAiApiConfig,
  getCustomAiApiConfig,
} from '../../../../Utils/GDevelopServices/ApiConfigs';
import { showMessageBox } from '../../../../UI/Messages/MessageBox';

const styles = {
  container: {
    padding: 20,
    maxWidth: 800,
    margin: '0 auto',
  },
  section: {
    marginBottom: 30,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoBox: {
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 1.6,
  },
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleLabel: {
    marginLeft: 10,
    fontSize: 16,
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: 50,
    height: 24,
  },
  switchInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ccc',
    transition: '.4s',
    borderRadius: 24,
  },
  sliderChecked: {
    backgroundColor: '#2196F3',
  },
  knob: {
    position: 'absolute',
    content: '""',
    height: 18,
    width: 18,
    left: 3,
    bottom: 3,
    backgroundColor: 'white',
    transition: '.4s',
    borderRadius: '50%',
  },
  knobChecked: {
    transform: 'translateX(26px)',
  },
  inputField: {
    marginBottom: 15,
  },
  buttonContainer: {
    display: 'flex',
    gap: 10,
    marginTop: 10,
  },
  status: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 14,
  },
  statusEnabled: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#2E7D32',
    border: '1px solid #4CAF50',
  },
  statusDisabled: {
    backgroundColor: 'rgba(158, 158, 158, 0.1)',
    color: '#616161',
    border: '1px solid #9E9E9E',
  },
};

const ApiSettingsSection = () => {
  const i18n = React.useContext(I18n);
  const [enabled, setEnabled] = React.useState(false);
  const [baseUrl, setBaseUrl] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');

  // Load saved configuration
  React.useEffect(() => {
    const config = getCustomAiApiConfig();
    setEnabled(config.enabled || false);
    setBaseUrl(config.baseUrl || '');
    setApiKey(config.apiKey || '');
  }, []);

  const handleSave = () => {
    if (enabled && !baseUrl) {
      showMessageBox({
        title: i18n._(t`Error`),
        message: i18n._(
          t`Please enter a valid API base URL when custom AI is enabled.`
        ),
      });
      return;
    }

    setCustomAiApiConfig({
      enabled,
      baseUrl,
      apiKey,
    });

    // Save to localStorage for persistence
    localStorage.setItem('gdevelop-custom-ai-enabled', String(enabled));
    localStorage.setItem('gdevelop-custom-ai-baseurl', baseUrl);
    localStorage.setItem('gdevelop-custom-ai-apikey', apiKey);

    showMessageBox({
      title: i18n._(t`Settings Saved`),
      message: enabled
        ? i18n._(
            t`Custom AI API configuration saved. Please refresh the page to apply changes.`
          )
        : i18n._(t`Custom AI disabled. Using default GDevelop AI service.`),
    });
  };

  const handleReset = () => {
    setEnabled(false);
    setBaseUrl('');
    setApiKey('');

    setCustomAiApiConfig({
      enabled: false,
      baseUrl: null,
      apiKey: null,
    });

    localStorage.removeItem('gdevelop-custom-ai-enabled');
    localStorage.removeItem('gdevelop-custom-ai-baseurl');
    localStorage.removeItem('gdevelop-custom-ai-apikey');

    showMessageBox({
      title: i18n._(t`Settings Reset`),
      message: i18n._(t`Custom AI configuration has been reset.`),
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.heading}>
        <Trans>Custom AI API Settings</Trans>
      </div>

      <div style={styles.infoBox}>
        <Trans>
          Configure your own OpenAI-compatible AI service to use instead of
          GDevelop's default AI. This allows you to use local models (like
          Ollama, LLaMA), third-party APIs, or your own AI service.
        </Trans>
        <br />
        <br />
        <strong>Features:</strong>
        <ul style={{ marginTop: 8 }}>
          <li>
            <Trans>No GDevelop account required</Trans>
          </li>
          <li>
            <Trans>Use any OpenAI-compatible API</Trans>
          </li>
          <li>
            <Trans>Support for local models and custom endpoints</Trans>
          </li>
          <li>
            <Trans>Full control over your AI service</Trans>
          </li>
        </ul>
      </div>

      <div style={styles.toggleContainer}>
        <label style={styles.switch}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
            style={styles.switchInput}
          />
          <span
            style={{
              ...styles.slider,
              ...(enabled ? styles.sliderChecked : {}),
            }}
          >
            <span
              style={{
                ...styles.knob,
                ...(enabled ? styles.knobChecked : {}),
              }}
            />
          </span>
        </label>
        <span style={styles.toggleLabel}>
          <Trans>Enable Custom AI API</Trans>
        </span>
      </div>

      {enabled ? (
        <div style={styles.statusEnabled}>
          <strong>
            <Trans>Status: Custom AI Enabled</Trans>
          </strong>
          <br />
          <Trans>
            Your AI requests will be sent to your configured endpoint.
          </Trans>
        </div>
      ) : (
        <div style={styles.statusDisabled}>
          <strong>
            <Trans>Status: Using Default GDevelop AI</Trans>
          </strong>
          <br />
          <Trans>
            AI requests will use GDevelop's default service (requires login).
          </Trans>
        </div>
      )}

      {enabled && (
        <>
          <div style={styles.inputField}>
            <TextField
              floatingLabelText={<Trans>API Base URL</Trans>}
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              fullWidth
              helperText={
                <Trans>
                  Enter the base URL of your OpenAI-compatible API (e.g.,
                  http://localhost:11434/v1 for Ollama)
                </Trans>
              }
            />
          </div>

          <div style={styles.inputField}>
            <TextField
              floatingLabelText={<Trans>API Key (Optional)</Trans>}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              fullWidth
              type="password"
              helperText={
                <Trans>
                  Enter your API key if your service requires authentication.
                  Leave empty for services that don't require a key.
                </Trans>
              }
            />
          </div>

          <div style={styles.infoBox}>
            <strong>Examples:</strong>
            <ul style={{ marginTop: 8 }}>
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
        </>
      )}

      <div style={styles.buttonContainer}>
        <RaisedButton
          label={<Trans>Save Settings</Trans>}
          onClick={handleSave}
          primary
        />
        <RaisedButton
          label={<Trans>Reset to Default</Trans>}
          onClick={handleReset}
        />
      </div>

      {enabled && baseUrl && (
        <div style={{ ...styles.infoBox, marginTop: 20 }}>
          <strong>Current Configuration:</strong>
          <br />
          <Trans>Base URL:</Trans> {baseUrl}
          <br />
          <Trans>API Key:</Trans>{' '}
          {apiKey ? '***' + apiKey.slice(-4) : i18n._(t`None`)}
        </div>
      )}
    </div>
  );
};

export default ApiSettingsSection;
