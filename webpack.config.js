var FlowBabelWebpackPlugin = require('flow-babel-webpack-plugin');

module.exports = {
  entry: './index',

  output: {
    filename: './dist/index.js'
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
