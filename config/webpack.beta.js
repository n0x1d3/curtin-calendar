'use strict';

const { merge } = require('webpack-merge');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const PATHS = require('./paths');

// Beta build: outputs to build-beta/ and uses public-beta/ for the manifest and assets.
// This lets the beta extension be installed alongside the stable version in Chrome,
// since Chrome assigns a unique ID per extension directory.
const config = (env, argv) =>
  merge(
    // Start from the common config (loaders, resolve, etc.)
    require('./webpack.common.js'),
    {
      entry: {
        popup: PATHS.src + '/popup.ts',
        contentScript: PATHS.src + '/contentScript.ts',
        readTable: PATHS.src + '/readTable.ts',
        background: PATHS.src + '/background.ts',
      },

      // Override output directory to build-beta/ instead of build/
      output: {
        path: path.resolve(__dirname, '../build-beta'),
        filename: '[name].js',
      },

      // Source maps in dev, none in production (same as stable)
      devtool: argv.mode === 'production' ? false : 'source-map',

      plugins: [
        // Copy from public-beta/ (which has the "(Beta)" name in the manifest)
        // instead of public/ used by the stable build.
        // force: true ensures these files overwrite anything already emitted by
        // the common config's CopyWebpackPlugin (which copies from public/).
        new CopyWebpackPlugin({
          patterns: [{ from: '**/*', context: 'public-beta', force: true }],
        }),

        // Extract CSS into separate files (required — common config has its own
        // instance scoped to build/, so we need a fresh one for build-beta/)
        new MiniCssExtractPlugin({
          filename: '[name].css',
        }),
      ],
    }
  );

module.exports = config;
