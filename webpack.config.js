const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator'); 

module.exports = {
  entry: './src/main.js',
  target: 'electron-main',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.(png|jpg|gif|ico)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[hash][ext]'
        }
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new UglifyJsPlugin(),
    new CopyPlugin({
      patterns: [
        { from: 'src/assets', to: 'assets' },
      ],
    }),
    new WebpackObfuscator (),
  ],
};
