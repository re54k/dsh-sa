# Figma 实现设计稿

本文件描述「将 Figma 设计稿实现为生产代码」的完整工作流与实现规则。当用户要求实现必须严格匹配 Figma 设计的页面/组件时，遵循本文档。

## 必须遵循的工作流

**实现设计稿时，必须严格按顺序执行以下步骤，不要跳步，不要遗漏，所有步骤均为必须执行。**

### 第 1 步：获取 Node ID

#### 方案 A：从 Figma URL 中解析

当用户提供 Figma URL 时，需要提取 file key 和 node ID，以便传给 MCP 工具。

**URL 格式：**
`https://figma.com/design/:fileKey/:fileName?node-id=1-2`

**提取内容：**

- **File key：** `:fileKey`（即 `/design/` 后面的那一段）
- **Node ID：** `1-2`（即 `node-id` 查询参数的值）

**注意：**
如果使用本地桌面版 MCP（`figma-desktop`），调用工具时不需要传 `fileKey`。服务端会自动使用当前打开的文件，因此只需要传 `nodeId`。导出 PNG 时需要将 URL 中 `node-id` 的 `-` 替换为 `:`（例如 `36-4484` → `36:4484`）。

**示例：**

- URL：`https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15`
- File key：`kL9xQn2VwM8pYrTb4ZcHjF`
- Node ID：`42-15`（导出资源时使用 `42:15`）

#### 方案 B：使用 Figma Desktop 当前选中的节点（仅适用于 figma-desktop MCP）

当使用 `figma-desktop` MCP，且用户**没有**提供 URL 时，工具会自动使用 Figma 桌面应用当前打开文件中被选中的节点。

**注意：**
基于当前选中节点的方式只适用于 `figma-desktop` MCP。远程服务端要求必须提供某个画板或图层的链接，才能提取上下文。用户需要在 Figma 桌面应用中打开文件并选中一个节点。

### 第 2 步：获取设计上下文

使用提取出的 file key 和 node ID 调用 `get_design_context`。

```
get_design_context(fileKey=":fileKey", nodeId="1-2")
```

这个接口会返回结构化数据，包括：

- 布局属性（Auto Layout、约束、尺寸方式）
- 字体排版信息
- 颜色值和设计令牌
- 组件结构与变体
- 间距和内边距数值

**如果返回内容过大或被截断：**

1. 必须调用 `get_metadata(fileKey=":fileKey", nodeId="1-2")` 获取高层节点结构图
2. 从 metadata 中定位所需的子节点
3. 对具体子节点逐步分别调用 `get_design_context(fileKey=":fileKey", nodeId=":childNodeId")`

### 第 3 步：获取视觉参考图

使用相同的 file key 和 node ID 调用 `get_screenshot`，获取视觉参考图。

```
get_screenshot(fileKey=":fileKey", nodeId="1-2")
```

这张截图会作为视觉校验的最终依据。在整个实现过程中都应保留并随时对照。

### 第 4 步：下载所需资源

下载 Figma MCP 服务返回的所有资源，例如图片、图标、SVG 等。

**重要：请遵守以下资源使用规则：**

- **需要**使用 PNG 导出能力将图标、矢量图等素材导出为 `.png` 图片，用图片组件来显示（详见 [PNG 资源导出](./export-png.md)）
- **不要**引入新的图标库
- **不要**在已经提供 `localhost` 资源时使用或创建占位图
- 所有资源都由 Figma MCP 服务内置的 assets 接口提供

> **注意：** `dirForAssetWrites` 会让 Figma MCP 自动写入 hash 命名的临时文件（`.png`/`.svg`），需在**第 8 步**统一清理。

### 第 5 步：映射到项目规范

将 Figma 的输出结果转换成符合当前项目框架、样式体系和代码规范的实现方式。

**核心原则：**

- 把 Figma MCP 的输出视为「设计与行为的表达」，而不是最终代码风格
- 优先复用项目已有组件（按钮、输入框、排版组件、图标容器等），不要重复造轮子
- 统一使用项目已有的颜色体系、字号体系和间距 token
- 遵循项目既有的路由、状态管理和数据获取模式

### 第 6 步：实现 1:1 视觉还原

目标是尽量做到与 Figma 设计稿像素级一致。

**实现原则：**

- 优先保证与 Figma 视觉效果一致，不允许"大约"、"差不多"等估算
- 尽量避免硬编码，优先使用 Figma 中的设计 token
- 当设计系统 token 与 Figma 数值冲突时，优先使用项目 token，但可适度微调间距或尺寸以贴近视觉效果
- 遵守 WCAG 无障碍要求
- 必要时补充组件文档

### 第 7 步：对照 Figma 进行校验

在标记为完成之前，必须将最终 UI 与 Figma 截图进行比对验证。

**校准原则：**

- 先调用 `get_metadata` 获取完整节点树
- 对每个主要子节点（section/card/bar）分别调用 `get_design_context` + `get_screenshot`
- 校验中发现的任何不匹配，**必须**立即修复代码后再次校验

**校验清单：**

- [ ] 布局一致（间距、对齐、尺寸）
- [ ] 字体一致（字体、字号、字重、行高）
- [ ] 颜色完全一致（背景/边框/文字全部精确匹配）
- [ ] 尺寸（宽/高/圆角/内外边距）
- [ ] 特殊效果（阴影/透明度/渐变/旋转/缩放）
- [ ] 交互状态符合设计（hover、active、disabled）
- [ ] 响应式行为符合 Figma 约束设置
- [ ] 资源（图标/图片正确引用）
- [ ] 满足无障碍标准

> ⚠️ **校验通过 ≠ 流程结束！** 校验完成后，**必须继续执行第 8 步（清理临时资源）**，不可直接结束或标记任务完成。

### 第 8 步：清理临时资源

> **⚠️ 此步骤为必须执行步骤。** 只有完成清理后，整个工作流才算结束。

Figma MCP 在第 4 步通过 `dirForAssetWrites` 自动写入了一些 hash 命名的临时文件（40 位十六进制字符，如 `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0.png`）。校验完成后，需要清理其中不再被代码引用的文件。

**操作流程：**

1. 列出 `dirForAssetWrites` 目录中所有 hash 命名的资源文件
2. 用 `grep_search(path="src", regex="[0-9a-f]{40}\\.(png|svg)")` 扫描代码中对这些文件的引用
3. **保留**被代码引用的 hash 文件，**删除**未被引用的
4. 确认删除后不存在断引用（即代码中不会指向已删除的文件）

> 跳过此步骤会导致项目中残留无用临时文件，污染代码仓库。**清理完成后，方可标记任务为"已完成"。**

## 实现规则

### 组件组织方式

- UI 组件放在项目规定的设计系统目录中
- 遵循项目现有的组件命名规范
- 除非确实用于动态值，否则尽量避免内联样式

### 设计系统集成

- **始终优先**使用项目已有设计系统组件
- 将 Figma 的设计 token 映射到项目 token
- 如果已有匹配组件，优先扩展该组件，而不是新建
- 如果新增组件，需要同步补充到设计系统文档中

### 代码质量

- 避免硬编码，把常量抽离成常量或设计 token
- 保持组件可组合、可复用
- 为组件 props 添加 TypeScript 类型
- 为导出的组件补充 JSDoc 注释

## 示例

### 示例 1：实现一个按钮组件

用户说：“Implement this Figma button component: https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15”

**执行步骤：**

1. 从 URL 中解析出 `fileKey = kL9xQn2VwM8pYrTb4ZcHjF`，`nodeId = 42-15`
2. 执行 `get_design_context(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")`
3. 执行 `get_screenshot(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")` 作为视觉参考
4. 下载按钮所需的图标资源
5. 检查项目里是否已有按钮组件
6. 如果有，则扩展新 variant；如果没有，则按项目规范新建
7. 将 Figma 颜色映射到项目 token，例如 `primary-500`、`primary-hover`
8. 对照截图校验内边距、圆角、字体排版

**结果：**
得到一个与 Figma 设计一致，并且已集成进项目设计系统的按钮组件。

### 示例 2：实现一个 Dashboard 布局

用户说：“Build this dashboard: https://figma.com/design/pR8mNv5KqXzGwY2JtCfL4D/Dashboard?node-id=10-5”

**执行步骤：**

1. 从 URL 中解析出 `fileKey = pR8mNv5KqXzGwY2JtCfL4D`，`nodeId = 10-5`
2. 执行 `get_metadata(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId="10-5")` 先了解页面结构
3. 从 metadata 中识别主要区域（header、sidebar、content area、cards）及其子节点 ID
4. 针对每个主要区域分别调用 `get_design_context(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId=":childNodeId")`
5. 执行 `get_screenshot(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId="10-5")` 获取整页视觉参考
6. 下载全部资源（logo、icons、charts 等）
7. 使用项目现有布局基础设施搭建页面
8. 使用已有组件实现各个区域
9. 对照 Figma 约束校验响应式行为

**结果：**
得到一个完整的 Dashboard 页面，与 Figma 设计一致，并具备响应式能力。

## 最佳实践

### 先拿上下文，再写代码

不要基于猜测去实现。始终先获取 `get_design_context` 和 `get_screenshot`。

### 增量式校验

不要只在最后统一检查，而应在实现过程中持续对照校验，这样可以更早发现问题。

### 记录必要偏差

如果因为无障碍要求或技术限制，必须与 Figma 有偏差，应在代码注释中说明原因。

### 优先复用，不要重复造轮子

实现前总是先检查是否已有可复用组件。代码库的一致性比机械照搬 Figma 更重要。

### 设计系统优先

如果拿不准，优先遵循项目设计系统，而不是字面翻译 Figma 输出。

## 常见问题与解决方案

### 问题：Figma 输出被截断

**原因：**
设计过于复杂，或者嵌套层级太多，导致一次返回不完整。

**解决方案：**
先用 `get_metadata` 获取整体节点结构，再对具体子节点逐个调用 `get_design_context`。

### 问题：实现后与设计稿不一致

**原因：**
实现代码与原始 Figma 设计之间存在视觉差异。

**解决方案：**
将最终页面与第 3 步获取的截图并排对比，重点检查间距、颜色和字体参数是否与 design context 一致。

### 问题：资源加载失败

**原因：**
Figma MCP 服务的资源接口不可访问，或者资源 URL 被修改了。

**解决方案：**
检查 Figma MCP 服务的 assets 接口是否可访问。该服务会通过 `localhost` 提供资源，必须直接使用这些地址，不要做额外改写。

### 问题：设计 token 与 Figma 数值不同

**原因：**
项目设计系统中的 token 值与 Figma 设计稿里的值不一致。

**解决方案：**
优先使用项目 token 保持整体一致性，但可以通过微调间距或尺寸来尽量贴近设计稿视觉效果。
