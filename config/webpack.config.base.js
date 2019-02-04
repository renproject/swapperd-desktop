const path = require('path');

module.exports = {
  module: {
    rules: [

      {
        test: /\.[jt]sx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },

      {
        test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff$/i,
        loader: 'url-loader',
      },

      {
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader'],
      },

    ],
  },

  output: {
    path: path.join(__dirname, '/../dist'),
    filename: '[name].js',
  },

  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },

  plugins: [],

  externals: {},

  /** @type any */
  target: 'electron-renderer',
};