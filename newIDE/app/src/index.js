// @flow
import 'element-closest';
// $FlowFixMe[missing-export]
import React, { Component, type Element } from 'react';
import ReactDOM from 'react-dom';
import Authentication from './Utils/GDevelopServices/Authentication';
import {
  sendProgramOpening,
  installAnalyticsEvents,
} from './Utils/Analytics/EventSender';
import { registerServiceWorker } from './ServiceWorkerSetup';
import './UI/icomoon-font.css'; // Styles for Icomoon font.
import optionalRequire from './Utils/OptionalRequire';
import { loadScript } from './Utils/LoadScript';
import { showErrorBox } from './UI/Messages/MessageBox';
import VersionMetadata from './Version/VersionMetadata';
import { loadPreferencesFromLocalStorage } from './MainFrame/Preferences/PreferencesProvider';
import { getFullTheme } from './UI/Theme';
import { setCustomAiApiConfig } from './Utils/GDevelopServices/ApiConfigs';

const GD_STARTUP_TIMES = global.GD_STARTUP_TIMES || [];

// No i18n in this file

const electron = optionalRequire('electron');

// Make sure that the process object is available, even if we are not in Node.
// This is needed by some libraries like path-browserify for example.
// and it avoids hard crashes when using them.
global.process = global.process || {
  cwd: () => '/',
};

// Use the user preferred theme to define the loading screen color.

let color = 'f0f0f0';

try {
  const values = loadPreferencesFromLocalStorage();
  if (values && values.themeName) {
    const theme = getFullTheme({
      themeName: values.themeName,
      language: 'en', // language is not important here as we only look for a color.
      isMobile: true, // window size is not important as we only look for a color.
    });
    color = theme.gdevelopTheme.surface.window.backgroundColor;
  }
} catch {}

document.getElementsByTagName('body')[0].style.backgroundColor = color;

const styles = {
  loadingMessage: {
    position: 'absolute',
    top: 'calc(50% + 80px)',
    left: 15,
    right: 15,
    fontSize: 20,
    fontFamily: 'sans-serif',
    color: 'darkgray',
    textAlign: 'center',
    animation:
      'text-focus-in 0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000) both',
  },
};

type State = {|
  loadingMessage: string,
  App: ?Element<any>,
|};

class Bootstrapper extends Component<{}, State> {
  // $FlowFixMe[missing-local-annot]
  state = {
    loadingMessage: '',
    App: null,
  };
  // $FlowFixMe[missing-local-annot]
  authentication = new Authentication();

  componentDidMount() {
    installAnalyticsEvents();
    GD_STARTUP_TIMES.push(['bootstrapperComponentDidMount', performance.now()]);

    // 显示初始加载提示
    this.setState({
      loadingMessage: 'Initializing GDevelop...',
    });

    // Load custom AI configuration from localStorage
    try {
      const enabled = localStorage.getItem('gdevelop-custom-ai-enabled') === 'true';
      const baseUrl = localStorage.getItem('gdevelop-custom-ai-baseurl');
      const apiKey = localStorage.getItem('gdevelop-custom-ai-apikey');

      if (enabled && baseUrl) {
        setCustomAiApiConfig({
          enabled: true,
          baseUrl: baseUrl,
          apiKey: apiKey,
        });
        console.log('✅ Custom AI API loaded:', baseUrl);
      }
    } catch (error) {
      console.warn('Failed to load custom AI config:', error);
    }

    // Load GDevelop.js, ensuring a new version is fetched when the version changes.
    this.setState({
      loadingMessage: 'Loading game engine...',
    });

    loadScript(
      `./libGD.js?cache-buster=${VersionMetadata.versionWithHash}`
    ).then(() => {
      GD_STARTUP_TIMES.push(['libGDLoadedTime', performance.now()]);
      const initializeGDevelopJs = global.initializeGDevelopJs;
      if (!initializeGDevelopJs) {
        this.handleEditorLoadError(
          new Error('Missing initializeGDevelopJs in libGD.js')
        );
        return;
      }

      this.setState({
        loadingMessage: 'Initializing WASM...',
      });

      initializeGDevelopJs({
        // Override the resolved URL for the .wasm file,
        // to ensure a new version is fetched when the version changes.
        locateFile: (path: string, prefix: string) => {
          // This function is called by Emscripten to locate the .wasm file only.
          // As the wasm is at the root of the public folder, we can just return
          // the path to the file.
          // Plus, on Electron, the prefix seems to be pointing to the root of the
          // app.asar archive, which is completely wrong.
          return path + `?cache-buster=${VersionMetadata.versionWithHash}`;
        },
      }).then(gd => {
        global.gd = gd;
        GD_STARTUP_TIMES.push([
          'libGD.js initialization done',
          performance.now(),
        ]);
        sendProgramOpening();

        this.setState({
          loadingMessage: 'Loading editor...',
        });

        // 使用动态导入，确保只在对应环境中加载对应的 App
        // 添加重试机制来处理 ChunkLoadError
        const loadAppWithRetry = (importFn, retries = 5, delay = 5000) => {
          return importFn()
            .then(module => {
              this.setState({
                App: module.create(this.authentication),
                loadingMessage: '',
              });
            })
            .catch(error => {
              console.warn(`Failed to load app (attempts left: ${retries}):`, error);

              if (error.name === 'ChunkLoadError' && retries > 0) {
                this.setState({
                  loadingMessage: `Loading editor... Retrying (${6 - retries}/5). Please wait...`,
                });
                // Wait longer before retrying (increased from 2s to 5s)
                return new Promise(resolve => {
                  setTimeout(() => {
                    resolve(loadAppWithRetry(importFn, retries - 1, delay));
                  }, delay);
                });
              }

              // If it's not a ChunkLoadError or we've exhausted retries
              this.handleEditorLoadError(error);
            });
        };

        if (electron) {
          loadAppWithRetry(
            () => import(/* webpackChunkName: "local-app" */ './LocalApp'),
            5,
            5000
          );
        } else {
          loadAppWithRetry(
            () => import(/* webpackChunkName: "browser-app" */ './BrowserApp'),
            5,
            5000
          );
        }
      });
    }, this.handleEditorLoadError);
  }

  // $FlowFixMe[missing-local-annot]
  handleEditorLoadError = rawError => {
    const message = !electron
      ? 'Please check your internet connectivity, close the tab and reopen it.'
      : 'Please restart the application or reinstall the latest version if the problem persists.';

    this.setState({
      loadingMessage: `Unable to load GDevelop. ${message}`,
    });
    showErrorBox({
      message: `Unable to load GDevelop. ${message}`,
      rawError,
      errorId: 'editor-load-error',
    });
  };

  // $FlowFixMe[missing-local-annot]
  render() {
    const { App, loadingMessage } = this.state;

    return (
      <React.Fragment>
        {App}
        {loadingMessage && (
          <div style={styles.loadingMessage}>{loadingMessage}</div>
        )}
      </React.Fragment>
    );
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  GD_STARTUP_TIMES.push(['reactDOMRenderCall', performance.now()]);
  ReactDOM.render(<Bootstrapper />, rootElement);
} else console.error('No root element defined in index.html');

registerServiceWorker();
