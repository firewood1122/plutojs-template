const os = require('os');
const { ModuleFederationPlugin } = require('webpack').container;

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
};

const moduleFederations = [
	new ModuleFederationPlugin({
		name: 'demo',
		remotes: {
			baseMicro: getMicro(process.env.TARGET),
		},
		shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
	}),
];

module.exports = {
	moduleFederations,
}
