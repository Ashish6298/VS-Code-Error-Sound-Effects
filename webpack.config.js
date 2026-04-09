const path = require('path');
const webpack = require('webpack');

/** @type {import('webpack').Configuration} */
const commonConfig = {
  mode: 'none', // leave 'production' for actual packaging
  target: 'node', // default for extension
  entry: {
    extension: './src/extension.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    devtoolModuleFilenameTemplate: '..[resource-path]',
  },
  resolve: {
    mainFields: ['module', 'main'],
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  externals: {
    vscode: 'commonjs vscode',
  },
  performance: {
    hints: false,
  },
  devtool: 'nosources-source-map',
};

/** @type {import('webpack').Configuration} */
const webConfig = {
  mode: 'none',
  target: 'webworker',
  entry: {
    browser: './src/browser.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    devtoolModuleFilenameTemplate: '..[resource-path]',
  },
  resolve: {
    mainFields: ['browser', 'module', 'main'],
    extensions: ['.ts', '.js'],
    alias: {
      // provide aliases for node-specific modules if needed
    },
    fallback: {
      // provide polyfills for node-specific modules if needed
      path: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  externals: {
    vscode: 'commonjs vscode',
  },
  performance: {
    hints: false,
  },
  devtool: 'nosources-source-map',
};

module.exports = [commonConfig, webConfig];
