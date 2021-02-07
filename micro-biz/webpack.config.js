const os = require('os');
const fs = require('fs');
const path = require('path');
const env = require('node-env-file')
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const SentryWebpackPlugin = require('@sentry/webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const UploadAlisOSSPlugin = require('./build/upload-ali-oss-plugin');
const DeleteSourcemapWebpackPlugin = require('./build/delete-sourcemap-webpack-plugin');
const package = require('./package.json');
const resolve = dir => path.resolve(__dirname, dir);
const pageDirPath = './src/page'; // 页面目录路径

// 加载环境文件
const envFile = resolve('.env');
if (fs.existsSync(envFile)) env(envFile);

/**
 * 获取页面入口
 */
const getEntry = () => {
  const pageDir = resolve(pageDirPath);
  return fs.readdirSync(pageDir).filter(item => fs.statSync(path.resolve(pageDir, item)).isDirectory());
}
const getEntryMap = () => {
  const entry = {};
  getEntry().forEach(item => {
    entry[item] = `${pageDirPath}/${item}/index`;
  });
  return entry;
}

/**
 * 生成多页面配置
 */
const getHtmlWebpackPlugin = (isDev) => {
  return getEntry().map(item => new HtmlWebpackPlugin({
    filename: isDev ? `${item}.html` : `../${item}.html`,
    template: './public/index.html',
    chunks: [item],
  }));
}

/**
 * 获取本机IP地址
 */
const getIPAddress = () => {
  const interfaces = os.networkInterfaces();
  for (let devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
}

/**
 * 获取前端微服务链接
 * @param {string} target
 */
const getMicro = (target) => {
  const name = 'test';
  const version = '0.0.1';
  const urlMap = {
    local: `${name}@http://${getIPAddress()}:6001/remoteEntry.js`,
    test: `${name}@http://${getIPAddress()}:6001/remoteEntry_${version}.js`,
    pre: `${name}@http://${getIPAddress()}:6001/remoteEntry_${version}.js`,
    product: `${name}@http://${getIPAddress()}:6001/remoteEntry_${version}.js`,
  };
  const url = urlMap[target] || urlMap.product;
  return url;
}

module.exports = (env, argv) => {
  // 判断是否开发模式
  const { mode = 'production' } = argv;
  const isDev = mode !== 'production';

  return {
    devtool: isDev ? false : 'source-map',
    entry: getEntryMap(),
    mode,
    devServer: {
      host: '0.0.0.0',
      port: process.env.PORT || 7001,
      publicPath: '/',
      useLocalIp: true,
      open: true,
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
        '@': resolve('src')
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
            'sass-loader'
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
      new MiniCssExtractPlugin({
        filename: isDev ? '[name].css' : '[name]_[chunkhash:8].css',
      }),
      // new ModuleFederationPlugin({
      //   name: 'demo',
      //   remotes: {
      //     baseMicro: getMicro(process.env.TARGET),
      //   },
      //   shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
      // }),
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
        dryRun: true,
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
