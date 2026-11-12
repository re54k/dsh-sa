/**
 * build 脚本：构建 RN 多端产物。
 *
 * - 构建前更新 app.json 中的构建版本号及构建时间
 * - 依次构建 ios 与 android 两端
 * - 安装 web 插件后，同时构建 web 端
 * - 安装 harmony 插件后，同时构建 harmony 端
 */
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const buildRN = require('@mf2e/build-rn')
const app = require('../app.json')

async function build(platform) {
  console.log(chalk.bold.yellow(`正在构建${platform}...`))

  await buildRN(app.name, platform)
}

// 更新构建信息
function updateBuildInfo() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  app.buildVersion = app.buildVersion ? app.buildVersion + 1 : 1
  app.buildTime = `${month}/${day} ${hours}:${minutes}`

  fs.writeFileSync(path.resolve(__dirname, '../app.json'), JSON.stringify(app, null, 2))
}

async function execBuild() {
  updateBuildInfo()

  await build('ios')
  await build('android')
  console.log(chalk.bold.green(`构建完成！`))
}

execBuild()
