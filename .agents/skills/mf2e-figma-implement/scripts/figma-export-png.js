const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

const FIGMA_API = 'https://api.figma.com/v1'
const SCALES = [3]

function parseArgs() {
  const args = process.argv.slice(2)
  const config = { fileKey: '', nodeIds: [], output: './assets', names: {} }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--file-key':
        config.fileKey = args[++i]
        break
      case '--node-ids':
        config.nodeIds = args[++i].split(',').map((id) => id.trim())
        break
      case '--output':
        config.output = args[++i]
        break
      case '--names':
        // 格式: "nodeId=name,nodeId=name"，例如 "36:4484=icon_like,36:4493=icon_badge"
        args[++i].split(',').forEach((pair) => {
          const eqIdx = pair.indexOf('=')
          if (eqIdx > 0) {
            const id = pair.slice(0, eqIdx).trim()
            const name = pair.slice(eqIdx + 1).trim()
            if (id && name) config.names[id] = name
          }
        })
        break
      case '--scales':
        config.scales = args[++i].split(',').map(Number)
        break
      case '--help':
        printHelp()
        process.exit(0)
    }
  }

  config.scales = config.scales || SCALES
  config.token = process.env.FIGMA_TOKEN

  if (!config.token) {
    console.error('错误: 必须设置 FIGMA_TOKEN 环境变量')
    console.error('设置方式: export FIGMA_TOKEN="your-token-here"')
    process.exit(1)
  }
  if (!config.fileKey) {
    console.error('错误: --file-key 为必填参数')
    process.exit(1)
  }
  if (!config.nodeIds.length) {
    console.error('错误: --node-ids 为必填参数')
    process.exit(1)
  }

  return config
}

function printHelp() {
  console.log(`
Figma 导出 PNG - 将 Figma 节点按多倍率导出为 PNG

用法:
  FIGMA_TOKEN="xxx" node scripts/figma-export-png.js [options]

选项:
  --file-key <key>        Figma 文件 key(必填)
  --node-ids <ids>        逗号分隔的节点 ID，例如 "36:4484,36:4493"(必填)
  --output <dir>          输出目录(默认: ./assets)
  --names <mapping>       自定义命名，例如 "36:4484=icon_like,36:4493=icon_badge"
  --scales <scales>       逗号分隔的倍率(默认: 3)
  --help                  显示帮助信息

环境变量:
  FIGMA_TOKEN             Figma Personal Access Token(必填)

示例:
  # 导出指定节点
  node scripts/figma-export-png.js \\
    --file-key unRh8so4RyxTiHqlMkctSw \\
    --node-ids "36:4484,36:4493" \\
    --names "36:4484=icon_like,36:4493=icon_badge" \\
    --output src/pages/employment/assets

  # 从 Figma URL 提取参数
  # URL: https://figma.com/design/unRh8so4RyxTiHqlMkctSw/file?node-id=36-4484
  # file-key = unRh8so4RyxTiHqlMkctSw, node-id = 36:4484

输出:
  按 React Native 命名规范生成文件:
    icon_like@3x.png   (3x)
  `)
}

function request(url, token) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const options = token
      ? { headers: { 'X-Figma-Token': token } }
      : {}

    mod.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(request(res.headers.location, null))
      }
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString()}`))
          return
        }
        resolve({ data: Buffer.concat(chunks), contentType: res.headers['content-type'] })
      })
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function fetchImageUrls(fileKey, nodeIds, scale, token) {
  const ids = nodeIds.join(',')
  const url = `${FIGMA_API}/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=png&scale=${scale}`

  console.log(`  正在获取 ${scale}x 倍率的图片 URL...`)
  const { data } = await request(url, token)
  const json = JSON.parse(data.toString())

  if (json.err) {
    throw new Error(`Figma API 错误: ${json.err}`)
  }

  return json.images || {}
}

async function downloadFile(url, outputPath) {
  const { data } = await request(url, null)
  fs.writeFileSync(outputPath, data)
}

function getNodeName(nodeId, names, index) {
  if (names[nodeId]) return names[nodeId]
  return `icon_${nodeId.replace(/:/g, '_')}`
}

async function main() {
  const config = parseArgs()
  const { fileKey, nodeIds, output, names, scales, token } = config

  console.log(`\nFigma 导出 PNG`)
  console.log(`  文件 key: ${fileKey}`)
  console.log(`  节点数量: ${nodeIds.length}`)
  console.log(`  倍率: ${scales.join(', ')}`)
  console.log(`  输出目录: ${output}\n`)

  // 创建输出目录
  fs.mkdirSync(output, { recursive: true })

  // 为每个倍率获取并下载图片
  for (const scale of scales) {
    const imageUrls = await fetchImageUrls(fileKey, nodeIds, scale, token)

    for (const [nodeId, url] of Object.entries(imageUrls)) {
      if (!url) {
        console.log(`  [跳过] ${nodeId} - 未返回图片 URL`)
        continue
      }

      const name = getNodeName(nodeId, names, nodeIds.indexOf(nodeId))
      const suffix = scale === 1 ? '' : `@${scale}x`
      const filename = `${name}${suffix}.png`
      const outputPath = path.join(output, filename)

      await downloadFile(url, outputPath)
      console.log(`  [成功] ${filename}`)
    }
  }

  console.log(`\n完成! 已导出 ${nodeIds.length} 个图标，共 ${scales.length} 种倍率。`)
  console.log(`文件总数: ${nodeIds.length * scales.length}\n`)

  // 生成 import 引用语句
  console.log('// 添加到你的 assets/index.ts:')
  const imports = []
  const assetKeys = []
  for (const nodeId of nodeIds) {
    const name = getNodeName(nodeId, names, nodeIds.indexOf(nodeId))
    const camelName = name.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    const reqSuffix = scales.length === 1 && scales[0] !== 1 ? `@${scales[0]}x` : ''
    imports.push(`import ${camelName} from './${name}${reqSuffix}.png'`)
    assetKeys.push(camelName)
  }
  console.log(imports.join('\n'))
  console.log(`\nexport const Assets = {\n  ${assetKeys.join(',\n  ')},\n}`)
  console.log('')
}

main().catch((err) => {
  console.error('错误:', err.message)
  process.exit(1)
})
