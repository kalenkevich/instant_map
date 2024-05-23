/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const isProduction = true || process.env['APP_ENV'] === 'PRODUCTION';

module.exports = {
  entry: './src/index.ts',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.[fullhash].js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    static: './dist',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    allowedHosts: [
      '.ondigitalocean.app',
      '.kalenkevich.com',
    ],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        loader: 'arraybuffer-loader',
      },
      {
        test: /\.glsl$/,
        loader: 'raw-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
      filename: 'index.html',
      inject: 'body',
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, 'assets'), to: path.resolve(__dirname, 'dist') }],
    }),
    new BundleAnalyzerPlugin({ analyzerMode: isProduction ? 'disabled' : 'server' }),
  ],

  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? undefined : 'inline-source-map',
  optimization: isProduction ? {
    minimize: true,
    minimizer: [new TerserPlugin()],
  } : {},
};
