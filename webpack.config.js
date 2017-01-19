var FlowBabelWebpackPlugin = require('flow-babel-webpack-plugin');

module.exports = {
  entry: './index',
  devtool: 'source-map',

  output: {
    filename: './dist/index.js',
    library: 'CssColorParser',
    libraryTarget: 'umd'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
    ]
  },

  plugins: [
    new FlowBabelWebpackPlugin(),
  ]
};
