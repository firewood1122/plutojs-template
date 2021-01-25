const os = require('os');
const fs = require('fs');
const path = require('path');
const env = require('node-env-file')
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
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
const getHtmlWebpackPlugin = () => {
  return getEntry().map(item => new HtmlWebpackPlugin({
    filename: `${item}.html`,
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
      path: resolve('dist'),
      filename: isDev ? '[name].js' : '[name]_[chunkhash:8].js',
      publicPath: '/',
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
                importLoaders: 2,
              },
            },
            'postcss-loader',
            'sass-loader'
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
      new MiniCssExtractPlugin({
        filename: isDev ? '[name].css' : '[name]_[chunkhash:8].css',
      }),
      new ModuleFederationPlugin({
        name: 'demo',
        remotes: {
          baseMicro: getMicro(process.env.TARGET),
        },
        shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
      }),
      new webpack.DefinePlugin({
        'process.env': {
          'TARGET': JSON.stringify(process.env.TARGET),
          'REACT_APP_VERSION': JSON.stringify(package.version),
          'SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || ''),
          'SENTRY_PROJECT_NAME': JSON.stringify(process.env.SENTRY_PROJECT_NAME || ''),
        }
      }),
      ...getHtmlWebpackPlugin(),
    ],
    optimization: {
      minimize: !isDev,
    },
  };
}