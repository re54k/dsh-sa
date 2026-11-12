/**
 * init 脚本：清理 HelloReactNative 示例代码及资源，将项目初始化。
 *
 * - 项目创建完成后由 CLI 自动执行，也可手动执行：npm run init
 * - 清理内容：示例组件、示例图片及 lottie 资源、相关代码引用
 * - 执行后脚本自删，该操作不可恢复
 */
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const inquirer = require('inquirer')

const root = path.resolve(__dirname, '..')

// 待删除的 HelloReactNative 相关文件
const cleanFiles = [
  'src/components/HelloReactNative.tsx',
  'src/assets/react-native@3x.png',
  'src/assets/react-native.dark@3x.png',
  'src/assets/react-native.json',
]

// 待清理的 HelloReactNative 相关代码（按文件分组替换）
const updateFiles = [
  {
    // 页面模板直接引用示例组件
    file: 'src/pages/home/HomeMain.tsx',
    options: [
      {
        search: `import { HelloReactNative } from '@/components/HelloReactNative'\n`,
        replace: ``,
      },
      {
        search: `      <HelloReactNative />`,
        replace: `      <View />`,
      },
    ],
  },
  {
    // 资源入口：插件组合不同生成内容不同
    file: 'src/assets/index.ts',
    options: [
      {
        search: `import logo from './react-native.png'\n`,
        replace: ``,
      },
      {
        search: `import logoLight from './react-native.png'\nimport logoDark from './react-native.dark.png'\n`,
        replace: ``,
      },
      {
        search: `import lottie from './react-native.json'\n`,
        replace: ``,
      },
      {
        search: `  logo,\n`,
        replace: ``,
      },
      {
        search: `  lottie,\n`,
        replace: ``,
      },
      {
        search: `  logo: {\n    light: logoLight,\n    dark: logoDark,\n  },\n`,
        replace: ``,
      },
    ],
  },
  {
    // 入口文件可能引用 HelloReactNative（未引入 View，直接删除而非替换）
    file: 'src/App.tsx',
    keyword: 'HelloReactNative',
    options: [
      {
        search: /^import .*HelloReactNative.*\n/gm,
        replace: ``,
      },
      {
        search: /<HelloReactNative[\s\S]*?\/>/g,
        replace: ``,
      },
    ],
  },
]

async function init() {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: chalk.bold.red(
        '是否执行 init 脚本初始化项目？（清理 HelloReactNative 相关代码及资源，该操作不可恢复！）',
      ),
      default: false,
    },
  ])

  if (!answer.confirmed) {
    console.log(chalk.bold.yellow('已取消清理，未做任何改动，后续可手动执行：npm run init'))
    process.exit(0)
  }

  console.log(chalk.bold.cyan('\n开始清理...'))

  // 删除 HelloReactNative 相关文件
  cleanFiles.forEach((file) => {
    const fpath = path.resolve(root, file)
    if (!fs.existsSync(fpath)) {
      return
    }
    fs.rmSync(fpath)
    console.log(chalk.green(`✓ 已删除 ${file}`))
  })

  // 清理 HelloReactNative 相关代码
  updateFiles.forEach(({ file, options, keyword }) => {
    const changed = updateFile(path.resolve(root, file), { options, keyword })
    if (changed) {
      console.log(chalk.green(`✓ 已清理 ${file}`))
    }
  })

  // 从 package.json 移除 init 脚本注册
  removePackageScript()

  // 删除脚本自身
  try {
    fs.unlinkSync(path.resolve(root, 'scripts/init.js'))
    console.log(chalk.green('✓ 已删除 scripts/init.js（脚本自身）'))
  } catch (e) {
    console.log(chalk.yellow('⚠ 无法删除脚本自身，请手动执行：rm scripts/init.js'))
  }

  console.log(chalk.bold.green('\n✓ 清理完成，项目已进入初始化状态。'))
}

// 从 package.json 移除 init 脚本注册
function removePackageScript() {
  const pkgPath = path.resolve(root, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, { encoding: 'utf-8' }))
  if (!pkg.scripts || !pkg.scripts.init) {
    console.log(chalk.yellow('⚠ 未在 package.json 中找到 init 脚本注册，跳过移除。'))
    return
  }
  delete pkg.scripts.init
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, { encoding: 'utf-8' })
  console.log(chalk.green('✓ 已从 package.json 移除 init 脚本注册'))
}

function updateFile(fpath, { options = [], keyword = '' } = {}) {
  if (!fs.existsSync(fpath)) {
    return false
  }
  let content = fs.readFileSync(fpath, { encoding: 'utf-8' })
  let changed = false
  options.forEach(({ search, replace }) => {
    const matched = search instanceof RegExp ? search.test(content) : content.includes(search)
    if (!matched) {
      return
    }
    content = content.replace(search, replace)
    changed = true
  })
  if (changed) {
    fs.writeFileSync(fpath, content, { encoding: 'utf-8' })
    if (keyword && content.includes(keyword)) {
      console.log(chalk.yellow(`⚠ ${fpath} 中仍存在未识别的 ${keyword} 引用，请手动检查处理。`))
    }
  }
  return changed
}

init()
