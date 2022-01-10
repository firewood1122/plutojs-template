const os = require("os");
const fs = require("fs");
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

/**
 * 获取页面入口
 * @param {string} pageDir
 */
const getEntry = (dir) => {
  return fs
    .readdirSync(dir)
    .filter((item) => fs.statSync(path.resolve(dir, item)).isDirectory());
};

/**
 * 获取页面对应关系
 * @param {string} pageDir
 */
const getEntryMap = (pageDir) => {
  const entry = {};
  getEntry(pageDir).forEach((item) => {
    try {
      // 判断页面文件是否存在
      fs.accessSync(`${pageDir}/${item}/index.tsx`, fs.constants.F_OK);
      entry[item] = `${pageDir}/${item}/index`;
    } catch (e) {
      console.error(`Page not exists: ${item}`);
    }
  });
  return entry;
};

/**
 * 项目loader配置
 */
const getLoaderConfig = () => {
  return [
    {
      test: /bootstrap\.tsx$/,
      use: [
        {
          loader: "bundle-loader",
          options: {
            lazy: true,
          },
        },
        "ts-loader",
      ],
    },
    {
      test: /\.tsx?$/,
      loader: "ts-loader",
      exclude: /node_modules/,
    },
    {
      test: /\.scss$/,
      use: [
        MiniCssExtractPlugin.loader,
        {
          loader: "css-loader",
          options: {
            sourceMap: false,
            importLoaders: 2,
          },
        },
        "postcss-loader",
        {
          loader: "sass-loader",
          options: {
            sassOptions: {
              outputStyle: "expanded",
            },
          },
        },
      ],
    },
    {
      test: /\.css$/,
      use: [
        "style-loader",
        {
          loader: "css-loader",
          options: {
            importLoaders: 1,
          },
        },
        {
          loader: "postcss-loader",
        },
      ],
    },
    {
      test: /\.(png|jpg|gif)$/,
      loader: "url-loader",
      options: {
        limit: 8192,
      },
    },
  ];
};

/**
 * 获取本机IP地址
 */
const getIPAddress = () => {
  const interfaces = os.networkInterfaces();
  for (let devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (
        alias.family === "IPv4" &&
        alias.address !== "127.0.0.1" &&
        !alias.internal
      ) {
        return alias.address;
      }
    }
  }
};

module.exports = {
  getEntry,
  getEntryMap,
  getLoaderConfig,
  getIPAddress,
};
