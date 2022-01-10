const fs = require("fs");
const path = require("path");
const env = require("node-env-file");
const webpack = require("webpack");
const { getEntry, getEntryMap, getLoaderConfig } = require("./utils");

// 官方插件
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { ModuleFederationPlugin } = require("webpack").container;

// 第三方插件
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");

// 自定义插件
const UploadAlisOSSPlugin = require("./upload-ali-oss-plugin");
const DeleteSourcemapWebpackPlugin = require("./delete-sourcemap-webpack-plugin");

// 引用项目配置
const package = require("../package.json");
const proejctConfig = require("../project.config");
const { open, openPage, moduleFederations } = proejctConfig;

// 加载环境文件
const resolve = (dir) => path.resolve(__dirname, "..", dir);
const envFile = resolve(".env");
if (fs.existsSync(envFile)) env(envFile);

// 项目路径
const pageDir = resolve("src/page");
const entries = getEntry(pageDir);

/**
 * 生成多页面配置
 */
const getHtmlWebpackPlugin = (isDev) => {
  return entries.map(
    (item) =>
      new HtmlWebpackPlugin({
        filename: isDev ? `${item}.html` : `../${item}.html`,
        template: "./public/index.html",
        chunks: [item],
      })
  );
};

module.exports = (env, argv) => {
  // 判断是否开发模式
  const { mode = "production" } = argv;
  const isDev = mode !== "production";

  // 可配置插件
  const extraPlugins = [];

  // AlisOSS插件
  const { OSS_REGION } = process.env;
  if (OSS_REGION) {
    extraPlugins.push(
      new UploadAlisOSSPlugin({
        dryRun: isDev,
        region: process.env.OSS_REGION,
        accessKeyId: process.env.OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        bucket: process.env.OSS_BUCKET,
        prefix: process.env.OSS_PREFIX,
      })
    );
  }

  // Sentry插件
  if (process.env.SENTRY_PROJECT_NAME) {
    extraPlugins.push(
      new SentryWebpackPlugin({
        dryRun: isDev,
        release: `${process.env.SENTRY_PROJECT_NAME}@${package.version}`,
        include: resolve("dist"),
        ignoreFile: ".sentrycliignore",
        ignore: ["node_modules"],
        configFile: ".sentry.properties",
        urlPrefix: `~/${process.env.SENTRY_PROJECT_NAME}/`,
      })
    );
  }

  // 模块联盟插件
  moduleFederations.map((option) => {
    extraPlugins.push(new ModuleFederationPlugin(option));
  });

  return {
    devtool: isDev ? false : "source-map",
    entry: getEntryMap(pageDir),
    mode,
    devServer: {
      host: "0.0.0.0",
      port: process.env.PORT || 7001,
      publicPath: "/",
      useLocalIp: true,
      open,
      openPage,
      disableHostCheck: true,
    },
    output: {
      path: resolve("dist/static"),
      filename: isDev ? "[name].js" : "[name]_[chunkhash:8].js",
      publicPath: isDev ? "/" : process.env.CDN || "/static/",
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      alias: {
        "@": resolve("src"),
      },
    },
    module: {
      rules: getLoaderConfig(),
    },
    plugins: [
      ...getHtmlWebpackPlugin(isDev),
      new webpack.DefinePlugin({
        "process.env": {
          TARGET: JSON.stringify(process.env.TARGET),
          REACT_APP_VERSION: JSON.stringify(package.version),
          SENTRY_DSN: JSON.stringify(process.env.SENTRY_DSN || ""),
          SENTRY_PROJECT_NAME: JSON.stringify(
            process.env.SENTRY_PROJECT_NAME || ""
          ),
        },
      }),
      new MiniCssExtractPlugin({
        filename: isDev ? "[name].css" : "[name]_[chunkhash:8].css",
      }),
      new CopyPlugin({
        patterns: [{ from: "public/asset", to: ".." }],
      }),
      new CleanWebpackPlugin(),
      new DeleteSourcemapWebpackPlugin({
        dryRun: isDev,
        path: resolve("dist/static"),
      }),
    ].concat(extraPlugins),
    optimization: {
      minimize: !isDev,
    },
  };
};
