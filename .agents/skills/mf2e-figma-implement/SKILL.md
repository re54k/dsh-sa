---
name: mf2e-figma-implement
description: '将 Figma 设计稿实现为可用于生产环境的代码，并支持导出图标/图片为多倍率 PNG 资源，尽可能做到 1:1 视觉还原。当用户提供 Figma URL 或节点 ID、要求实现必须严格匹配 Figma 设计的页面/组件，或需要从 Figma 导出图标/图片为 PNG 时触发。要求已连接可用的 Figma MCP 服务。'
metadata:
  version: 1.0.0
---
# Figma 设计实现与资源导出

## 概述

本技能提供一套结构化工作流，用于将 Figma 设计稿转换为可用于生产环境的代码，并尽可能做到 1:1 像素级视觉还原。同时内置 PNG 导出能力，可将 Figma 节点（图标、图片、插画等）按 1x/2x/3x 多倍率导出为 React Native 兼容的图片资源。

## 前置条件

- **Figma MCP 服务器**必须已连接（提供 `get_screenshot`、`get_design_context` 等工具）。
- **FIGMA_TOKEN**：导出 PNG 资源时，需要设置 Figma Personal Access Token 环境变量
- **Node.js**：导出脚本基于 Node.js 运行（无额外依赖）
- 用户需要提供一个 Figma URL，格式如下：`https://figma.com/design/:fileKey/:fileName?node-id=1-2`
  - `:fileKey` 是文件 key
  - `1-2` 是节点 ID（要实现的具体组件或画板）

## 能力与入口

本技能包含两个能力，按需选择对应文档：

### 实现 Figma 设计稿

将 Figma 设计稿实现为生产代码，做到 1:1 视觉还原。

> 详细的完整工作流（第 1-8 步）、实现规则、示例与常见问题，请参见 [references/figma-implement.md](./references/figma-implement.md)。

### 导出 PNG 资源

将 Figma 节点（图标、图片）导出为多倍率 PNG 资源。

> 详细的导出步骤、关键规则、输出规范、示例与常见问题，请参见 [references/export-png.md](./references/export-png.md)。