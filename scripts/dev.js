/**
 * dev 脚本：启动本地开发服务。
 *
 * - 启动前强制结束占用 8081、8082 端口的进程
 * - 以 --reset-cache 方式启动 react-native 开发服务
 * - 安装 mock 插件后，同时启动本地 mock 服务
 */
const chalk = require('chalk')
const { execSync } = require('child_process')
const exec = require('exec-sh').promise
const mock = require('../mock')

async function dev() {
  killPorts()
  console.log(chalk.bold.green('正在启动服务...'))
  exec('react-native start --reset-cache')
}

// 强制结束端口占用进程：8081 开发服务、8082 mock 服务
// macOS/Linux 用 lsof，Windows 用 netstat + taskkill；只取监听态进程，避免误杀连接该端口的客户端
function killPorts() {
  const ports = [8081, 8082]

  ports.forEach((port) => {
    const cmd =
      process.platform === 'win32'
        ? `for /f "tokens=5" %a in ('netstat -ano -p tcp ^| findstr LISTENING ^| findstr :${port}') do taskkill /F /PID %a`
        : `lsof -ti:${port} -sTCP:LISTEN | xargs kill -9`

    try {
      execSync(cmd, { stdio: 'ignore' })
    } catch (error) {}
  })
}

async function execDev() {
  dev()
  mock()
}

execDev()
