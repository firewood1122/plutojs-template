const fs = require("fs");
const path = require("path");
const pluginName = "DeleteSourceMapWebpackPlugin";

class DeleteSourceMapWebpackPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    if (compiler.hooks && compiler.hooks.done) {
      // webpack 5
      compiler.hooks.done.tapAsync(pluginName, (stats, cb) => {
        this.pluginDoneFn(stats, cb);
      });
    } else {
      compiler.plugin("done", (stats, cb) => {
        this.pluginDoneFn(stats, cb);
      });
    }
  }

  log(info) {
    console.log(`[${pluginName}] ${info}`);
  }

  pluginDoneFn(stats, cb) {
    const { dryRun = false, path: distPath } = this.options;
    if (dryRun) {
      this.log("DRY Run Mode");
      cb();
      return;
    }

    const assets = stats.compilation.getAssets();
    assets
      .filter((item) => /\.js\.map$/.test(item.name))
      .forEach((item) => {
        fs.unlinkSync(path.resolve(distPath, item.name));
      });
    cb();
  }
}

module.exports = DeleteSourceMapWebpackPlugin;
