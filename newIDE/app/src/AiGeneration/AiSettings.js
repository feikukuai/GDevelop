// @flow
import * as React from 'react';
import { TextField, RaisedButton, Checkbox, Line, Column } from '../UI';
import {
  setCustomAiApiConfig,
  getCustomAiApiConfig,
} from '../Utils/GDevelopServices/ApiConfigs';
import { t } from '@lingui/macro';

const styles = {
  container: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    lineHeight: 1.5,
  },
};

type Props = {|
  onClose: () => void,
|};

export const AiSettings = ({ onClose }: Props) => {
  const [enabled, setEnabled] = React.useState(false);
  const [baseUrl, setBaseUrl] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');

  // Load saved config on mount
  React.useEffect(() => {
    const config = getCustomAiApiConfig();
    setEnabled(config.enabled);
    setBaseUrl(config.baseUrl || '');
    setApiKey(config.apiKey || '');
  }, []);

  const handleSave = () => {
    setCustomAiApiConfig({
      enabled,
      baseUrl: enabled ? baseUrl : null,
      apiKey: enabled ? apiKey : null,
    });
    onClose();
  };

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <div style={styles.title}>{t`Custom AI API Settings`}</div>

        <Checkbox
          checked={enabled}
          onCheck={(e, check) => setEnabled(check)}
          label={t`Enable custom AI API`}
        />

        <div style={styles.helpText}>
          {t`When enabled, GDevelop will use your custom OpenAI-compatible API instead of the official service. You will not need to log in to use AI features.`}
        </div>
      </div>

      <Line />

      {enabled && (
        <div style={styles.section}>
          <Column>
            <TextField
              fullWidth
              label={t`API Base URL`}
              value={baseUrl}
              onChange={(e, value) => setBaseUrl(value)}
              placeholder="https://your-api.com/v1"
              helperText={t`The base URL of your OpenAI-compatible API`}
            />

            <TextField
              fullWidth
              label={t`API Key`}
              value={apiKey}
              onChange={(e, value) => setApiKey(value)}
              type="password"
              placeholder="sk-..."
              helperText={t`Your API key for authentication`}
            />

            <div style={styles.helpText}>
              {t`Note: Your custom API must be compatible with the OpenAI API format. Make sure your API supports the same endpoints as GDevelop's AI service.`}
            </div>
          </Column>
        </div>
      )}

      <div style={styles.section}>
        <RaisedButton label={t`Save Settings`} primary onClick={handleSave} />
      </div>
    </div>
  );
};
