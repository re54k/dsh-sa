/**
 * offline 脚本：离线发布 RN 多端产物。
 *
 * - 选择发布环境（测试/预发/线上）
 * - 依次发布 ios 与 android 两端
 * - 安装 harmony 插件后，同时发布 harmony 端
 */
const chalk = require('chalk')
const inquirer = require('inquirer')
const offlineTool = require('@mf2e/offline-tool')
const app = require('../app.json')

async function offline(platform, env) {
  console.log(chalk.bold.cyan(`正在发布${platform}...`))

  await offlineTool
    .build(
      [
        {
          name: app.name,
          url: [`ntescommunity://nc/page?id=${app.name}`],
          src: `./dist/${platform}/${app.name}`,
          osType: platform,
          extraConfig: {
            isPreload: false,
            isForceUpdate: false,
          },
          apiConfig: {
            '/': [],
          },
        },
      ],
      env,
      {
        type: 'rn',
        updateToNcConfig: 'on',
        development: {
          product: 'bee-rn',
          secret: '6740250d3af663d86f5035b7',
        },
        preview: {
          product: 'bee-rn',
          secret: '68a28a5fb639d455da43f218',
        },
        production: {
          product: 'bland-rn',
          secret: '65a0a8771d7183a4ae9484e3',
        },
      },
    )
    .catch((e) => {
      console.log(e)
    })
}

async function getTargets() {
  const answer = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'targets',
      message: `请选择发布目标：`,
      choices: [
        {
          name: chalk.bold.yellow('测试环境'),
          value: { name: '测试环境', env: 'development' },
        },
        {
          name: chalk.bold.yellow('预发环境'),
          value: { name: '预发环境', env: 'preview' },
        },
        {
          name: chalk.bold.yellow('线上环境'),
          value: { name: '线上环境', env: 'production' },
        },
      ],
      validate(input) {
        if (input.length === 0) {
          return '请至少选择一项'
        }
        return true
      },
    },
  ])

  return answer.targets
}

async function execOffline() {
  const targets = await getTargets()

  for (const target of targets) {
    console.log(chalk.bold.yellow(`正在发布到${target.name}...`))

    await offline('ios', target.env)
    await offline('android', target.env)
  }

  console.log(chalk.bold.green(`发布完成！`))
}

execOffline()
