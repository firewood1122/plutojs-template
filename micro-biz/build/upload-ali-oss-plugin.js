const OSS = require('ali-oss');
const Buffer = require('buffer').Buffer;
const pluginName = 'UploadAlisOSSPlugin';

class UploadAlisOSSPlugin {

  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    if (compiler.hooks && compiler.hooks.emit) { // webpack 5
      compiler.hooks.emit.tapAsync(pluginName, (compilation, cb) => {
        this.pluginEmitFn(compilation, cb)
      });
    } else {
      compiler.plugin('emit', (compilation, cb) => {
        this.pluginEmitFn(compilation, cb)
      })
    }
  }

  pluginEmitFn(compilation, cb) {
    const files = this.pickupAssetsFiles(compilation);
    const promises = files.map(item => this.put(item.name, Buffer.from(item.content)));
    Promise.all(promises).then(() => {
      cb();
    });
  }

  /**
   * 上传文件
   * 
   * @param {*} name
   * @param {*} content
   */
  async put(name, content) {
    const { region, accessKeyId, accessKeySecret, bucket, prefix } = this.options;
    const client = new OSS({
      region,
      accessKeyId,
      accessKeySecret,
      bucket,
    });

    try {
      let result = await client.put(prefix + name, content);
      console.log(`上存成功: ${result.name}`);
    } catch (e) {
      console.error('上存失败: %j', e);
    }
  }

  /**
   * 从 compilation 对象中提取资源文件
   * 
   * @param {*} compilation 
   */
  pickupAssetsFiles(compilation) {
    const re = /.*.?(js|css|jpg|png|gif)$/i;
    const keys = Object.keys(compilation.assets);
    return keys.reduce((acc, cur) => {
      if (re.test(cur)) {
        const asset = compilation.assets[cur];
        acc.push({
          name: cur,
          content: asset.source(),
        });
      }
      return acc;
    }, []);
  }
}

module.exports = UploadAlisOSSPlugin;