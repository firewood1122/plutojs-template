const { getIPAddress } = require("./build/utils");

/**
 * 获取前端微服务链接
 * @param {string} target
 */
const getMicro = (target) => {
  const name = "test";
  const version = "0.0.1";
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
  // {
  // 	name: 'demo',
  // 	remotes: {
  // 		baseMicro: getMicro(process.env.TARGET),
  // 	},
  // 	shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
  // },
];

module.exports = {
  open: true,
  openPage: "",
  moduleFederations,
};
