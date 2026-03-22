// This file customizes webpack configuration for react-app-rewired.
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const webpack = require('webpack');

module.exports = {
  webpack: function override(config, env) {
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: {
        loader: 'worker-loader',
        options: {
          filename: '[name].[contenthash].worker.js',
        },
      },
    });

    // A lot of packages we use in node_modules trigger source map warnings
    // but it is not a blocking issue, so we ignore them.
    config.ignoreWarnings = [/Failed to parse source map/];

    config.resolve.plugins = config.resolve.plugins.filter(
      (plugin) => !(plugin instanceof ModuleScopePlugin)
    );

    // Increase timeout for chunk loading to handle remote access delays
    if (config.output) {
      config.output.crossOriginLoading = 'anonymous';
    }

    // Configure dev server for better remote access handling
    if (env === 'development') {
      config.devServer = config.devServer || {};
      config.devServer.client = config.devServer.client || {};
      config.devServer.client.webSocketURL = 'auto://0.0.0.0:0/ws';

      // Increase chunk loading timeout significantly
      config.devServer.static = config.devServer.static || {};
      config.devServer.static.timeout = 300000; // 5 minutes (increased from 120s)

      // Reduce polling to avoid connection issues
      config.watchOptions = config.watchOptions || {};
      config.watchOptions.poll = 2000; // Check every 2 seconds (increased from 1s)
      config.watchOptions.aggregateTimeout = 600; // Increased from 300ms

      // Define environment variable for chunk timeout
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.CHUNK_LOAD_TIMEOUT': JSON.stringify(180000), // 3 minutes
        })
      );
    }

    // Increase chunk loading timeout for production-like environment
    if (config.performance) {
      config.performance.maxAssetSize = 10000000; // 10MB
      config.performance.maxEntrypointSize = 10000000; // 10MB
    }

    return config;
  },

  jest: function(config) {
    config.transformIgnorePatterns = [
      '<rootDir>/node_modules/(?!react-markdown|unified|remark-parse|mdast-util-from-markdown|micromark|decode-named-character-reference|remark-rehype|trim-lines|hast-util-whitespace|remark-gfm|mdast-util-gfm|mdast-util-find-and-replace|mdast-util-to-markdown|markdown-table|is-plain-obj)',
    ];

    return config;
  },
};
