# PNG 资源导出

本文件描述「将 Figma 节点（图标、图片等）导出为多倍率 PNG 文件」的完整流程。此能力既可独立使用，也可在设计稿实现的第 4 步中调用。

## 适用场景

- 用户需要从 Figma 导出图标或图片为 PNG
- 需要 React Native 多倍率资源（1x/2x/3x）
- 需要批量下载多个 Figma 节点为 PNG
- 需要将 SVG 图标导出为 PNG 格式
- 在实现设计稿时，遇到图标/矢量图等非照片类素材

## 导出步骤

### 第 1 步：确认 Figma 文件与节点

从用户的 Figma URL 中提取 file key 和 node ID。

**URL 格式：** `https://figma.com/design/:fileKey/:fileName?node-id=1-2`

- **File key：** `/design/` 后面的那一段
- **Node ID：** `node-id` 查询参数的值（使用 `:` 格式，例如 `36:4484`）

如果用户提供多个节点，收集所有节点 ID。也可以使用 Figma MCP 工具（`get_metadata`、`get_design_context`）在较大的 frame 中发现图标/图片的子节点 ID。

### 第 2 步：确定输出文件名

为每个节点 ID 确定一个有意义的文件名：

1. 如果用户指定了名称，使用它
2. 如果使用 Figma MCP，从节点 metadata 中提取名称
3. 使用 snake_case 命名规范（例如 `icon_like`、`icon_badge`、`company_logo`）

### 第 3 步：验证 FIGMA_TOKEN

检查 `FIGMA_TOKEN` 环境变量是否已设置：

```bash
echo "FIGMA_TOKEN set: $([ -n "$FIGMA_TOKEN" ] && echo 'YES' || echo 'NO')"
```

如果未设置，先请用户提供 Figma Personal Access Token。

**token 已设置但失效时（脚本返回 HTTP 403/401）**：🔴 **直接中止并提示用户提供有效 token，不要尝试降级替代方案**（如改用 MCP 截图 + 本地裁剪、SVG 渲染转 PNG 等变通路径）——由用户决定是否更换 token 后重跑。

### 第 4 步：运行导出脚本

使用相应参数执行导出脚本：

```bash
node .agents/skills/mf2e-figma-implement/scripts/figma-export-png.js \
  --file-key <fileKey> \
  --node-ids "<id1>,<id2>,<id3>" \
  --names "<id1>=<name1>,<id2>=<name2>,<id3>=<name3>" \
  --output <output-directory>
```

**参数说明：**

| 参数         | 必填 | 说明                                                     |
| ------------ | ---- | -------------------------------------------------------- |
| `--file-key` | 是   | URL 中的 Figma 文件 key                                  |
| `--node-ids` | 是   | 逗号分隔的节点 ID（冒号格式：`36:4484`）                 |
| `--names`    | 否   | 自定义命名映射，使用 `=` 分隔：`nodeId=name,nodeId=name` |
| `--output`   | 否   | 输出目录（默认：`./assets`）                             |
| `--scales`   | 否   | 逗号分隔的倍率（默认：`3`）                              |

### 第 5 步：更新资源索引

导出完成后，将新资源添加到页面的 `assets/index.ts`，采用 ES Module 导入 + `export const Assets` 对象简写的形式：

```typescript
import dialogClose from './dialog-close.png'
import navBack from './nav-back.png'
import rewardRedpacket from './reward-redpacket.png'

export const Assets = {
  navBack,
  dialogClose,
  rewardRedpacket,
}
```

- 顶部用 `import xxx from './xxx.png'` 逐个导入图片
- 文件名使用 kebab-case 命名（如 `dialog-close.png`、`nav-back.png`）
- 最后用 `export const Assets = { ... }` 以简写形式统一导出，key 为对应的 camelCase 变量名

### 第 6 步：验证文件

导出后，验证下载的文件是否为真正的 PNG 格式：

```bash
file <output-directory>/icon_*@3x.png
```

## 关键规则

### 引用规则（@3x 后缀）

导出的 `@3x` 图片在 `import` 时**必须使用不带 `@3x` 后缀的基础文件名**，React Native Metro 会自动匹配对应倍率文件：

```typescript
// ✅ 正确 — Metro 自动解析到 icon_like@3x.png
import iconLike from './icon_like.png'

// ❌ 错误 — Metro 无法识别直接引用 @3x 文件
import iconLike from './icon_like@3x.png'
```

### --names 分隔符规则

由于 Figma 节点 ID 包含 `:`（如 `36:4484`），`--names` 参数使用 **`=`** 作为节点 ID 和名称的分隔符：

```bash
# ✅ 正确
--names "36:4484=icon_like,36:4493=icon_badge"

# ❌ 错误 — 冒号会和节点 ID 中的冒号冲突
--names "36:4484:icon_like,36:4493:icon_badge"
```

## 输出

脚本默认按 3x 倍率导出。输出文件遵循 React Native 命名规范：

```
icon_like@3x.png     (3x, 默认)
```

如果指定多倍率（`--scales 1,2,3`）：

```
icon_like.png        (1x)
icon_like@2x.png     (2x)
icon_like@3x.png     (3x)
```

## 导出示例

### 从指定 Figma frame 导出图标

```bash
node .agents/skills/mf2e-figma-implement/scripts/figma-export-png.js \
  --file-key unRh8so4RyxTiHqlMkctSw \
  --node-ids "36:4484,36:4493" \
  --names "36:4484=icon_like,36:4493=icon_badge" \
  --output src/pages/employment/assets
```

### 导出导航栏图标（实例节点 ID）

```bash
node .agents/skills/mf2e-figma-implement/scripts/figma-export-png.js \
  --file-key unRh8so4RyxTiHqlMkctSw \
  --node-ids "I73:18900;17:696,I73:18900;17:801" \
  --names "I73:18900;17:696=icon_search,I73:18900;17:801=icon_share" \
  --output src/pages/employment/assets
```

### 从 Figma URL 提取 file key 和节点 ID

URL: `https://figma.com/design/unRh8so4RyxTiHqlMkctSw/MyDesign?node-id=36-4484`

- File key: `unRh8so4RyxTiHqlMkctSw`
- Node ID: `36:4484`（将 `-` 替换为 `:`）

## 常见问题与解决方案

### 问题："FIGMA_TOKEN environment variable is required"

**解决方案：**
设置 token：`export FIGMA_TOKEN="figd_xxx"`

### 问题："HTTP 403" 或 "HTTP 404"

**解决方案：**

- 确认 file key 正确
- 确认 token 有该文件的访问权限
- 检查节点 ID 是否存在于文件中

### 问题：图片为空或缺失

**解决方案：**

- 部分节点（如空 frame、布尔运算）可能无法渲染为图片
- 尝试导出父级 frame，而不是单个子节点

### 问题：Metro 打包报 "Unable to resolve module ./icon_xxx@3x.png"

**解决方案：**

- `import` 路径不能包含 `@3x` 后缀
- 使用 `import icon from './icon_xxx.png'`，Metro 会自动匹配 `@3x` 文件
