const fs = require('fs');
const path = require('path');

/**
 * 获取页面入口
 * @param {string} pageDir
 */
const getEntry = (dir) => {
	return fs.readdirSync(dir).filter(item => fs.statSync(path.resolve(dir, item)).isDirectory());
}

/**
 * 获取页面对应关系
 * @param {string} pageDir
 */
const getEntryMap = (pageDir) => {
	const entry = {};
	getEntry(pageDir).forEach(item => {
		entry[item] = `${pageDir}/${item}/index`;
	});
	return entry;
};

module.exports = {
	getEntry,
	getEntryMap,
};