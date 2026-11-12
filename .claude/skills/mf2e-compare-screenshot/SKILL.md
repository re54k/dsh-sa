---
name: mf2e-compare-screenshot
description: 对比 Figma 设计稿截图与模拟器（iOS / Android / HarmonyOS）运行效果截图，定位 UI 还原差异并修正组件样式。当用户提供 Figma 链接，要求检查 UI 还原度、修正样式差异时使用此 Skill。触发关键词：设计稿对比、UI 还原、模拟器截图、Figma 截图对比、样式差异修正。
metadata:
  version: 1.0.0
---
# MF2E 截图对比

## 概述

该 Skill 提供一套结构化的工作流程，用于对比 Figma 设计稿截图与模拟器（iOS / Android / HarmonyOS）实际截图，定位两者之间的 UI 还原差异，并指导修正组件样式代码。

## 前置条件

- **Figma MCP 服务器**必须已连接（提供 `get_screenshot`、`get_design_context` 等工具）。
- **模拟器 MCP 服务器**必须已连接（提供 `screenshot_simulator`、`screenshot_simulator_region`、`compare_with_design`、`get_simulator_info` 等工具，支持 iOS、Android 和 HarmonyOS 模拟器）。
- 模拟器需要正在运行（Booted 状态），且目标页面已打开。如果模拟器未运行，应明确告知用户需要先启动模拟器，并提供启动指引（可通过 `list_simulators` 查看可用设备，再通过 `boot_simulator` 启动），不要在模拟器未运行时尝试截图或对比操作
- 用户需提供 Figma URL 或 node ID

### 平台判断

- 用户提到「iOS 模拟器」→ 传入 `platform: "ios"`
- 用户提到「Android 模拟器」→ 传入 `platform: "android"`
- 用户提到「鸿蒙模拟器」或「HarmonyOS 模拟器」→ 传入 `platform: "harmony"`
- 用户未指定平台 → 省略 `platform` 参数，MCP 服务器会自动检测；如果有多个平台的设备在运行，优先询问用户

## 使用场景

- 用户要求「对比 Figma 设计稿和模拟器截图」或「检查 UI 还原度」
- 用户要求「修正某个组件的样式问题」并提供了 Figma 链接
- 用户提到「设计稿」+「模拟器」+「对比 / 差异 / 还原」等关键词

## 必要工作流

**严格按以下步骤顺序执行，不可跳步。**

### 步骤 1：解析 Figma URL

从用户提供的 Figma URL 中提取 `fileKey` 和 `nodeId`。

**URL 格式:** `https://figma.com/design/:fileKey/:fileName?node-id=1-2`

- **fileKey:** `/design/` 之后的路径段
- **nodeId:** `node-id` 查询参数的值（URL 中用 `-` 分隔，调用 MCP 时用 `:` 分隔）
- **Branch URL:** 如果 URL 格式为 `https://figma.com/design/:fileKey/branch/:branchKey/:fileName`，则使用 `branchKey` 作为 `fileKey`

### 步骤 2：并行获取 Figma 截图与模拟器对比上下文

**同时**执行以下操作以提高效率：

#### 2a：获取 Figma 设计稿截图

```
get_screenshot(nodeId="1018:12675")
```

该截图作为「设计基准」，是视觉对比的标准参照。

#### 2b：获取模拟器截图和对比上下文

**始终优先使用 `compare_with_design`**，它一步完成截图、设备信息采集和对比上下文生成：

```
compare_with_design(
  page_name="首页",
  figma_url="https://figma.com/design/:fileKey/:fileName?node-id=1-2",
  focus_areas=["顶部导航栏", "列表间距", "按钮样式"]
)
```

`compare_with_design` 会自动：截取模拟器全屏截图、获取设备详细信息（分辨率、DPI、缩放比例）、生成结构化对比检查清单，对 Android 平台额外输出 dp/px 换算和 elevation 检查项。

> `focus_areas` 应根据用户关注的重点区域或设计稿中的主要模块来填写。

**仅截图场景**：二次复验（步骤 7）或快速查看当前状态时，直接使用 `screenshot_simulator()` 即可，无需再生成完整对比上下文。

#### 2c：局部区域截图

如果只需对比页面中某个局部区域，使用 `screenshot_simulator_region` 裁剪特定区域。

**截图区域参数确定规则：**

1. **先获取设备信息**：调用 `get_simulator_info` 获取屏幕分辨率和缩放比（scale factor）
   - 常见 iPhone：屏幕宽 1170px/1179px/1290px/1320px，缩放比 3x
   - 常见 Android：根据 DPI 和分辨率计算 dp 比例
   - HarmonyOS：根据设备分辨率和 vp（虚拟像素）单位换算，设计稿通常基于 360vp 宽度

2. **坐标计算**：基于设计稿绝对位置 × 缩放比，并加上系统 UI 偏移量（状态栏约 59pt = 177px @3x，导航栏约 44pt = 132px @3x）：

   ```
   像素坐标 = 设计稿 pt 值 × 缩放比（如 3x）
   ```

3. **高度紧贴目标组件**：height 基于组件实际高度精确计算，上下各加 **20~30px** 余量覆盖阴影等溢出效果。如果组件有特别大的阴影（shadowRadius > 10 或 elevation > 8），可增大余量到 50px。

   ```
   # ✅ 正确：紧贴组件（350pt × 3 = 1050px 宽，100pt × 3 = 300px + 60px 余量高）
   screenshot_simulator_region(x=120, y=850, width=1080, height=360)

   # ❌ 错误：高度远超组件范围
   screenshot_simulator_region(x=0, y=850, width=1320, height=1200)
   ```

#### 2d：长页面滑动对比

当设计稿内容超过一屏可视范围时，需要通过滑动分段截图。

**判断条件（满足任一即可）：**

- Figma 设计稿高度（通过 `get_design_context` 获取）> 设备屏幕高度
- 首屏截图底部内容明显截断或存在可滚动区域
- 用户提到「整页对比」「完整页面」「长页面」等关键词

**滑动对比流程：**

1. 首屏截图已在步骤 2a/2b 完成
2. 每次滑动 **70%~80%** 屏幕高度，保留 20%~30% 重叠区域用于上下文衔接
3. 逐段滑动并截图，直到页面底部（内容不再变化）：

   ```
   swipe_simulator(from_x=590, from_y=2000, to_x=590, to_y=200, duration=0.5)
   screenshot_simulator()
   # 重复直到页面底部...
   ```

4. 将每屏截图与设计稿对应区域逐段比较

**注意事项：**

- 使用 `duration: 0.5`（默认值），过快可能导致惯性滚动不稳定
- 滑动后如有懒加载内容，应预留短暂等待时间
- 记录滑动次数和距离，便于在差异报告中标注位置（如「第 2 屏中部」）
- **横向滚动**内容使用水平方向的 `swipe_simulator`

### 步骤 3：获取 Figma 设计上下文

调用 `get_design_context` 获取目标节点的详细设计规格数据：

```
get_design_context(nodeId="1018:12675", clientLanguages="typescript", clientFrameworks="react-native")
```

提供的数据包括：精确的尺寸、间距、内边距、颜色值和渐变、字体/字号/字重、圆角/阴影参数、组件层级和布局方式、参考代码（React + Tailwind 格式，需适配为项目实际技术栈）。

### 步骤 4：查找目标组件代码

使用 `grep_search` 在项目中定位待修正组件的源代码：

```
grep_search(path="src", regex="ComponentName")
```

找到组件文件后，读取完整代码内容。

### 步骤 5：逐项对比差异

将 Figma 设计上下文中的精确数值与组件代码中的样式属性逐一对比，重点检查以下维度：

| 对比维度         | Figma 数据来源                      | 代码属性                                                                                                |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **总尺寸**       | `w-[Xpx]` / `h-[Xpx]`               | `width` / `height`                                                                                      |
| **圆角**         | `rounded-[Xpx]`                     | `borderRadius`                                                                                          |
| **内边距**       | `px-[X]` / `py-[Y]` / `p-[X]`       | `paddingHorizontal` / `paddingVertical` / `padding`                                                     |
| **外边距**       | `gap-[X]` / `left-[X]` / `top-[Y]`  | `marginLeft` / `marginTop` / `gap`                                                                      |
| **字号 / 字重**  | `text-[Xpx]` / `font-[weight]`      | `fontSize` / `fontWeight`                                                                               |
| **行高**         | `leading-[X]`                       | `lineHeight`                                                                                            |
| **颜色**         | `text-[#xxx]` / `bg-[#xxx]`         | `color` / `backgroundColor`                                                                             |
| **透明度**       | `opacity-[X]`                       | `opacity`                                                                                               |
| **渐变**         | `from-[#xxx] to-[#xxx]`             | `colors: ['#xxx', '#xxx']`                                                                              |
| **阴影**         | `shadow-[...]`                      | `shadowColor` / `shadowOffset` / `shadowRadius` (iOS) / `elevation` (Android) / `shadowXxx` (HarmonyOS) |
| **布局方向**     | `flex` / `flex-col` / `flex-row`    | `flexDirection`                                                                                         |
| **对齐方式**     | `items-center` / `justify-center`   | `alignItems` / `justifyContent`                                                                         |
| **元素定位坐标** | `left-[X]` / `top-[Y]` / `absolute` | `position` / `left` / `top`                                                                             |
| **边框**         | `border-[Xpx]` / `border-[#xxx]`    | `borderWidth` / `borderColor`                                                                           |
| **溢出**         | `overflow-hidden`                   | `overflow`                                                                                              |

**输出差异报告格式（长页面需标注屏幕位置）：**

```
📐 差异分析报告

[首屏]
1. ❌ sectionTitle.width: 设计稿 62px → 代码中无 width 属性
   → 修正: 添加 width: 62

2. ❌ symbolTitle.marginLeft: 设计稿 24px → 代码 36px
   → 修正: marginLeft: 36 → 24

3. ✅ PacketSymbolCard.borderRadius: 设计稿 16px = 代码 16px（一致）

[第2屏 - 滑动1次后]
4. ❌ listItem.paddingVertical: 设计稿 12px → 代码 8px
   → 修正: paddingVertical: 8 → 12

5. ✅ listItem.height: 设计稿 56px = 代码 56px（一致）
```

### 步骤 6：修正组件样式

根据差异报告修改组件代码中的样式值。

**修正原则：**

1. **精确还原**：优先使用 Figma 设计上下文中的精确数值
2. **设计 Token 优先**：如果项目已有设计 Token / 主题变量与 Figma 值接近，优先使用 Token
3. **最小变更**：仅修改有差异的属性，不改动已正确的部分
4. **布局一致性**：如果 Figma 使用绝对定位而代码使用 Flex 布局（或反之），在视觉效果一致的前提下保留代码的布局方式
5. **平台适配**：iOS 使用 `shadowXxx` 属性，Android 使用 `elevation`，HarmonyOS 的阴影实现需根据项目实际框架（如 RN HarmonyOS）确认支持情况，按平台分别处理

### 步骤 7：验证修正效果

修改代码后，**再次截取模拟器截图**进行验证（使用 `screenshot_simulator()` 即可）。

- **长页面**：需滑动到涉及修改的区域逐一验证；若修改涉及全局样式（如主题色、字体），则需每屏都验证
- **滑回顶部**：复验完成后可通过反向滑动回到顶部

将新截图与 Figma 设计稿截图进行二次对比，确认：

- [ ] 整体布局匹配（间距、对齐、尺寸）
- [ ] 字体样式匹配（字号、字重、颜色、行高）
- [ ] 颜色、渐变、圆角、阴影匹配
- [ ] 边框、透明度、溢出效果正确
- [ ] 交互元素位置正确
- [ ] 长页面所有相关屏幕区域均已验证

如果仍有差异，回到步骤 5 继续调整。

> **注意：** 同一个文件最多修正 2 轮（步骤 5 → 步骤 6 → 步骤 7），避免无限循环。如果 2 轮后仍有细微差异，记录剩余差异告知用户。

## 进阶用法

### 多组件批量对比

如果用户要求对比多个组件，按优先级逐个执行完整的步骤 2 ~ 步骤 7 流程，避免同时修改多个文件导致混乱。

### 交互状态对比

使用 `tap_simulator` 和 `swipe_simulator` 操作模拟器，导航到不同页面或触发交互状态后再截图对比：

```
tap_simulator(x=200, y=500)     # 模拟点击
swipe_simulator(from_x=200, from_y=600, to_x=200, to_y=200)  # 模拟滑动
screenshot_simulator()           # 截图
```

## 注意事项

- **分辨率换算**：Figma 通常基于 375pt 设计稿宽度，iPhone 模拟器为 2x/3x 像素，Android 以 dp 为单位换算（常见 360dp / 392dp / 411dp），HarmonyOS 以 vp 为单位换算（设计稿通常基于 360vp）。使用 `compare_with_design` 返回的 DPI 信息来正确换算
- **Figma 返回代码格式适配**：`get_design_context` 返回的代码是 React + Tailwind 格式，需转换为项目实际使用的样式系统（如 `createStyles` + `useStyles`、StyleSheet.create 等）
- **渐变映射**：渐变方向的 Tailwind 表示（如 `from-xxx to-xxx`）与 RN LinearGradient 的 `start`/`end` 参数需要正确映射
- **系统 UI 区域**：模拟器截图包含状态栏、导航栏等系统 UI，对比时应关注页面内容区域
- **截图自动清理**：模拟器截图工具返回压缩后的 base64 图片，临时文件会自动删除，无需手动清理