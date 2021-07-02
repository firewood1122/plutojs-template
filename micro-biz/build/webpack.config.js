const fs = require('fs');
const path = require('path');
const env = require('node-env-file')
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const SentryWebpackPlugin = require('@sentry/webpack-plugin');
const UploadAlisOSSPlugin = require('./upload-ali-oss-plugin');
const DeleteSourcemapWebpackPlugin = require('./delete-sourcemap-webpack-plugin');
const { getEntry, getEntryMap } = require('./utils');
const package = require('../package.json');
const proejctConfig = require('../project.config');
const { open, openPage, moduleFederations } = proejctConfig;

const resolve = dir => path.resolve(__dirname, dir);
const pageDir = resolve('../src/page'); // 页面目录路径
const entries = getEntry(pageDir);

// 加载环境文件
const envFile = resolve('../.env');
if (fs.existsSync(envFile)) env(envFile);

/**
 * 生成多页面配置
 */
const getHtmlWebpackPlugin = (isDev) => {
  return entries.map(item => new HtmlWebpackPlugin({
    filename: isDev ? `${item}.html` : `../${item}.html`,
    template: './public/index.html',
    chunks: [item],
  }));
};

module.exports = (env, argv) => {
  // 判断是否开发模式
  const { mode = 'production' } = argv;
  const isDev = mode !== 'production';

  return {
    devtool: isDev ? false : 'source-map',
    entry: getEntryMap(pageDir),
    mode,
    devServer: {
      host: '0.0.0.0',
      port: process.env.PORT || 7001,
      publicPath: '/',
      useLocalIp: true,
      open,
      openPage,
      disableHostCheck: true,
    },
    output: {
      path: resolve('dist/static'),
      filename: isDev ? '[name].js' : '[name]_[chunkhash:8].js',
      publicPath: isDev ? '/' : (process.env.CDN || '/static/'),
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {
        '@': resolve('../src')
      }
    },
    module: {
      rules: [
        {
          test: /bootstrap\.tsx$/,
          use: [
            {
              loader: 'bundle-loader',
              options: {
                lazy: true,
              },
            },
            'ts-loader'
          ]
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: false,
                importLoaders: 2,
              },
            },
            'postcss-loader',
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  outputStyle: 'expanded',
                },
              },
            }
          ]
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              },
            },
            {
              loader: 'postcss-loader'
            }
          ]
        },
        {
          test: /\.(png|jpg|gif)$/,
          loader: 'url-loader',
          options: {
            limit: 8192,
          }
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new webpack.DefinePlugin({
        'process.env': {
          'TARGET': JSON.stringify(process.env.TARGET),
          'REACT_APP_VERSION': JSON.stringify(package.version),
          'SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || ''),
          'SENTRY_PROJECT_NAME': JSON.stringify(process.env.SENTRY_PROJECT_NAME || ''),
        }
      }),
      ...getHtmlWebpackPlugin(isDev),
      ...moduleFederations,
      new MiniCssExtractPlugin({
        filename: isDev ? '[name].css' : '[name]_[chunkhash:8].css',
      }),
      new DeleteSourcemapWebpackPlugin({
        dryRun: isDev,
        path: resolve('dist/static'),
      }),
      new CopyPlugin({
        patterns: [
          { from: 'public/asset', to: '..' },
        ],
      }),
      new UploadAlisOSSPlugin({
        dryRun: isDev,
        region: process.env.OSS_REGION,
        accessKeyId: process.env.OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        bucket: process.env.OSS_BUCKET,
        prefix: process.env.OSS_PREFIX,
      }),
      new SentryWebpackPlugin({
        dryRun: isDev,
        release: `${process.env.SENTRY_PROJECT_NAME}@${package.version}`,
        include: path.join(__dirname, 'dist'),
        ignoreFile: '.sentrycliignore',
        ignore: ['node_modules'],
        configFile: '.sentry.properties',
        urlPrefix: `~/${process.env.SENTRY_PROJECT_NAME}/`
      }),
    ],
    optimization: {
      minimize: !isDev,
    },
  };
}
