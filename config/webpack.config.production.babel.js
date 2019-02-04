const webpack = require('webpack');
const merge = require('webpack-merge');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const baseConfig = require('./webpack.config.base');

const config = merge(baseConfig, {
  entry: {
    'renderer': './src/renderer/index',
    // 'main': './main',
  },
  mode: 'production',

  optimization: {
    minimizer: [new UglifyJsPlugin()],
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),
  ],
});

module.exports = config;