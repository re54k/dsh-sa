/**
 * prepare 脚本：安装依赖后的兼容处理。
 *
 * - 安装 husky git 提交校验钩子
 * - 安装 utils 插件后，对 @music/mnb-core、@music/mnb-extension-rn 打兼容补丁
 * - 安装 web 插件后，对 react-native-web 打兼容补丁
 */
const exec = require('exec-sh').promise
const fs = require('fs')
const path = require('path')

async function prepare() {
  await exec('npx husky install')

  updateFile('node_modules/@music/mnb-core/dist/utils/log.js', [
    {
      search: `if (isDebug()) {`,
      replace: `if (false) {`,
    },
  ])

  updateFile('node_modules/@music/mnb-core/dist/core/postMessage.js', [
    {
      search: `    if (keepLive) console.warn`,
      replace: `    // if (keepLive) console.warn`,
    },
  ])

  updateFile('node_modules/@music/mnb-extension-rn/src/index.js', [
    {
      search: `console.warn('NMRCTNativeRPCModule.syncCallForMsgPack is not available');`,
      replace: ``,
    },
  ])
}

function updateFile(fpath, options = []) {
  try {
    fpath = path.resolve(fpath)
    let content = fs.readFileSync(fpath, { encoding: 'utf-8' })
    options.forEach((option) => {
      content = content.replace(option.search, option.replace)
    })
    fs.writeFileSync(fpath, content, { encoding: 'utf-8' })
  } catch (e) {}
}

prepare()
