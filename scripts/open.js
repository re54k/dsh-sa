/**
 * open 脚本：在模拟器中打开页面。
 *
 * - 选择打开平台（ios/android/harmony）
 * - 通过 scheme 在对应模拟器中打开当前页面
 */
const chalk = require('chalk')
const os = require('os')
const inquirer = require('inquirer')
const openScheme = require('@mf2e/open-scheme')
const app = require('../app.json')

async function open(platform) {
  const url = encodeURIComponent(`http://${getIP()}:8081/index.bundle?platform=${platform}&dev=true`)
  const schemeUrl = `ntescommunity://nc/page?id=${app.name}&url=${url}`

  console.log(chalk.yellow(`正在打开：${schemeUrl}`))
  await openScheme(schemeUrl, platform)
}

function getIP() {
  const interfaces = os.networkInterfaces()
  for (const key in interfaces) {
    const iface = interfaces[key].find((item) => item.family === 'IPv4' && !item.internal)
    if (iface) {
      return iface.address
    }
  }
}

async function getTarget() {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'target',
      message: `请选择打开目标：`,
      choices: [
        {
          name: chalk.bold.yellow('ios'),
          value: { platform: 'ios' },
        },
        {
          name: chalk.bold.yellow('android'),
          value: { platform: 'android' },
        },
        {
          name: chalk.bold.yellow('harmony'),
          value: { platform: 'harmony' },
        },
      ],
    },
  ])

  return answer.target
}

async function execOpen() {
  const target = await getTarget()

  await open(target.platform)

  console.log(chalk.bold.green('打开成功！'))
}

execOpen()
