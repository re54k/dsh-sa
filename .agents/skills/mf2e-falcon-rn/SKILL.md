---
name: mf2e-falcon-rn
description: 传媒 React Native 跨端开发规范与编码指南。仅适用于接入 Falcon 的传媒 RN 跨端项目及其四端（iOS / Android / Harmony / Web）；纯 Web 项目、未接入 Falcon 的 RN 项目不适用。 在进行下述开发时使用：RN 组件/页面/弹窗开发，Zustand store 状态管理，自定义 Hooks，样式与主题，路由导航与页面注册，网络请求 API（fetch），工具函数（埋点、环境变量、分享、跳转），跨端适配（iOS/Android/Harmony/Web），响应式布局，动画与事件通信、以及性能优化等。
metadata:
  version: 1.2.5
---
# React Native 开发规范

React Native 跨端项目开发规范。涵盖项目基础、组件开发、状态管理、自定义 Hooks、样式主题、路由弹窗、网络请求和工具函数。

全部规范文档位于 [references/](references/)，均为 TypeScript 版本。

## 🎯 适用边界

- **适用** — 接入 **Falcon**，并使用本规范描述的目录结构的传媒 React Native 跨端项目（iOS / Android / Harmony / Web）。
- **不适用** — 纯 Web（React DOM）项目、未接入 Falcon 的 RN 项目。这类项目只可直接沿用通用约定（函数组件 + Hooks、命名导出、单引号无分号），其余目录结构、`createStyles`、`@/store/fetch` 等约定不成立。
- **不确定时** — 先确认 `package.json` 中是否存在 `@mf2e/mnb`、`@mf2e/react-native-theme-styles` 等 Falcon 依赖；缺失则不要按本规范落地，先与项目维护者确认技术栈。

## 🚀 快速开始

| 你的场景 | 推荐路径 |
| --- | --- |
| 全新接手项目 | [项目基础规范](references/base.md) → [快速开始与完整案例](references/quickstart.md) |
| 新增一个页面 | [快速开始与完整案例](references/quickstart.md)（照抄完整案例）→ [组件规范](references/components.md) → [样式与主题](references/styling.md) |
| 接接口 / 管数据 | [网络请求](references/networking.md) → [状态管理](references/store.md) |
| 加跳转 / 弹窗 | [路由与弹窗](references/navigation.md) |
| 遇到报错 | 下方「关键约束 · 违规症状与恢复」 |

> **最短上手路径：** [快速开始与完整案例](references/quickstart.md) 提供一份「API 端点 + Zustand store + 页面 + 列表分页」的完整代码，改模块名即可扩展；文末附提交前自检清单。

## 核心原则

1. **跨端一致性** — 一套代码，四端运行 (iOS / Android / Harmony / Web)
2. **函数组件 + Hooks** — 只使用函数组件 + Hooks，禁止 class 组件
3. **分层组件体系** — 全局通用层 (App / Base / Common) + 页面层，职责分明，单向引用
4. **Zustand 状态管理** — 按功能拆分 Store 模块，支持 hook 与独立方法双导出
5. **主题样式系统** — `createStyles` / `useStyles` 定义样式，`ThemeImage` 替代 `Image`
6. **MNB 原生桥接** — 通过 `@mf2e/mnb` 调用原生能力 (网络、导航、分享、存储)

## 关键约束

- **路径别名:** `@/` → `src/`，禁止 `../../../` 相对路径
- **平台差异:** `.web.ts` / `.web.tsx` 后缀隔离 Web 端实现，打包工具自动选择
- **禁止样式属性:** 禁止使用 `gap`、`box-shadow`、`background-image`、`calc()` 等 CSS-only 属性，必须用 RN 替代方案
- **样式约束:** 禁止行内样式 `style={{ }}`，必须用 `createStyles`；禁止 `Image`，必须用 `ThemeImage`
- **网络请求:** 禁止直接 `fetch`，必须用 `@/store/fetch` 封装；API 端点集中定义在 `store/api.ts`
- **Hooks 规则:** Hooks 只能在函数组件或自定义 Hook 内调用，禁止在组件外使用
- **依赖安全:** 使用第三方库前必须确认 `package.json` 已安装
- **代码风格:** 单引号、无分号、2 空格缩进；常量 `UPPER_SNAKE_CASE`，变量/函数 `camelCase`，组件 `PascalCase`；文件按类型加前/后缀 `Base*`/`Common*`/`*Page`/`*Dialog`

### ⚠️ 违规症状与恢复

违规不总会报错——多数是**静默失效**（样式不生效、主题不跟随）或**单端失效**（Web 正常、Native 异常），比报错更难查。命中下表症状时按「恢复」列处理：

| 违规写法                         | 典型症状                                                                       | 定位方式                        | 恢复                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------ | ------------------------------- | --------------------------------------------------------------------------- |
| 行内样式 `style={{ }}`           | ESLint（`react-native/no-inline-styles`）拦截；更常见是主题切换后样式不跟随     | 搜索 `style={{`                 | 抽到 `createStyles`，见 [样式与主题](references/styling.md) 的「完整组件结构示例」 |
| `gap: 8`                         | 间距不生效或两端不一致（Web 有间距、Native 没有），**不报错**                   | 搜索 `gap:`                     | 改用 `marginRight`（横向）/ `marginTop`（纵向），见 [样式与主题](references/styling.md) 的「gap」 |
| `box-shadow` / `backgroundImage` | 阴影或背景失效；CSS 语法值（如 `display: 'grid'`）可能直接白屏                  | 搜索 `box-shadow`               | iOS 用 `shadow*` 系列、Android 用 `elevation`；渐变改用 `LinearGradient`，见 [样式与主题](references/styling.md) 的「RN 不支持的样式属性」 |
| 直接 `fetch(...)` 或 `window.fetch` | Native 端无 `window` 对象直接抛错；绕过 MNB 后鉴权失败、公共参数缺失、Mock 不生效 | 搜索 `fetch(`                   | 改用 `@/store/fetch` 的 `fetch`，见 [网络请求](references/networking.md) 的「fetch 封装」 |
| `class XxxPage extends Component` | 在 class 内使用 Hooks 抛 `Invalid hook call`；与项目其他页面写法割裂            | 搜索 `extends Component`        | 改函数组件 + Hooks，见 [组件规范](references/components.md) 的「组件结构模板」 |
| 组件外调用 Hooks                 | 抛 `Invalid hook call` / `Cannot read property 'useState' of undefined`         | 报错栈指向文件顶层或普通函数    | 移入组件 / 自定义 Hook；组件外逻辑改用 store 独立方法，见 [状态管理](references/store.md) 的「双导出模式」 |
| 使用 `Image`                     | 暗色模式不切换；图片加载无 `FastImage` 优化，长列表滚动卡顿                      | 搜索 `<Image`                   | 改用 `ThemeImage`，见 [项目基础规范](references/base.md) 的「主题图片」        |
| 相对路径 `../../../`             | Metro 报 `Unable to resolve module ../../xxx`，真机启动白屏                     | 搜索 `../`                      | 改用 `@/` 别名，见 [项目基础规范](references/base.md) 的「路径别名」          |
| 未安装的三方库                   | Metro 报 `Unable to resolve module 'xxx' from ...`；iOS/Android 编译失败         | 对照 `package.json` 依赖        | 按项目包管理器安装（`npm install xxx`），或改用已装库，见 [项目基础规范](references/base.md) 的「依赖使用规范」 |
| `export default`                 | 引入处报 `Module has no default export`，或运行时拿到 `undefined`               | 搜索 `export default`           | 改命名导出，见 [项目基础规范](references/base.md) 的「导出方式」              |

**恢复模板（可直接替换）：**

```ts
// ❌ 误用 gap：Native 端间距静默失效
wrap: { flexDirection: 'row', gap: 8 },

// ✅ 容器不加间距，由子项用 margin 承担
wrap: { flexDirection: 'row' },
item: { marginRight: 8 }, // 纵向列表改用 marginTop
```

```tsx
// ❌ 行内样式：主题切换不生效
<Text style={{ color: '#333' }}>标题</Text>

// ✅ 抽到 createStyles，组件内 useStyles 引用
import type { ReactElement } from 'react'
import { Text } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'

export const Title = (): ReactElement => {
  const styles = useStyles(themeStyles)

  return <Text style={styles.title}>标题</Text>
}

const themeStyles = createStyles({
  title: { color: '#333' },
})
```

```ts
// ❌ 直接 fetch：Native 无 window，且绕过 MNB 鉴权与 Mock
await window.fetch(url)

// ✅ 走封装：平台双实现自动选择，错误提示统一
await fetch<T>({ url: api.moduleA.list, params: { id } })
```

```ts
// ❌ 未安装的库：Metro 解析失败
import { Swiper } from 'react-native-swiper'

// ✅ 先确认依赖，再使用
// 1) 查 package.json 是否有该库；2) 缺失则 npm install；3) 否则换用已装库
import { FlashList } from '@shopify/flash-list'
```

## 📝 Skill 文档维护规范

`references/` 下的规范文档描述**规范与模式**，而非**代码快照**。编写/修改文档时遵循以下自查约定，避免代码变更带来多次同步：

- **禁止粘贴完整真实实现** — 函数体/组件实现改为「签名 + 核心要点」，实现细节用 `{ ... }` 占位
- **保留稳定契约** — 类型/接口（`FetchConfig`、`UseXxxReturn`、`AppEnv` 等）与「怎么用」的调用示例可完整保留
- **教学示例使用虚构名** — 用 `MyComponent` / `moduleA` / `CommonSimple` 等示意名，不映射真实文件路径
- **禁止「真实源码 / 真实示例」字样** — 避免读者误将文档当作代码镜像
- **禁止指向 `src/` 源码的相对链接** — 如 `../../../src/utils/inject.ts`，一律改用文档内锚点（如 `utils.md#环境注入`）
- **代码变更 ≠ 文档同步** — 仅当**接口契约**或**使用方式**变化时更新文档；实现细节重构无需同步
- **示例代码必须自洽** — 新增示例需符合本 Skill 全部约束（命名导出、`createStyles`、`@/` 别名、无 CSS-only 属性）；`references/quickstart.md` 的完整案例改动后需重新走一遍「提交前自检清单」

## ⚠️ 开发核心基础

### [项目基础规范](references/base.md)

项目概览、编码规范、开发规范、禁止事项。**编写任何代码前必须先阅读。**

## 规范文档导航

根据开发任务选择对应的规范文档：

### [快速开始与完整案例](references/quickstart.md)

**何时阅读:** 首次接入本项目、需要一份可直接复制的完整代码、或想确认提交前自检项

- 最短上手路径、一份「API 端点 + Zustand store + 页面 + 列表分页」的完整可运行案例（5 个文件）、提交前自检清单

### [组件规范](references/components.md)

**何时阅读:** 创建/修改组件、页面、弹窗，或需要了解 Base/Common 组件能力与组件分层规则

- 组件层级体系（全局通用层 App / Base / Common + 独立页面层）、命名规范、函数组件结构模板、Props 规范、页面 `nav` + `main` 插槽模式、页面目录结构与注册、BasePage / BaseAsyncBtn / BaseSuspense / BaseNav / BaseDialog 详解、BaseDialog 四种位置变体、Pressable 交互、`.web.ts(x)` 平台特定组件、`memo()` 与 Animated 原生驱动性能优化

### [状态管理](references/store.md)

**何时阅读:** 创建新 store 模块、修改全局或页面状态逻辑、跨 store 调用、需要持久化数据

- Zustand `create` 创建模式、双导出模式（hook + 独立方法）、按功能拆分 Store 模块、异步方法编写、跨 Store 调用、本地持久化 Store、状态重置高级模式、数据流架构

### [自定义 Hooks](references/hooks.md)

**何时阅读:** 创建新 Hook、需要 Context 共享数据、订阅事件、使用分页加载、弹窗滚动或锚点气泡

- Hooks 调用规则、Context-based Hook 模式（usePage / useDialog）、useAdapter 响应式缩放、useEventListener 事件订阅、useLoadMore 分页加载、usePopup 锚点气泡、useImageLoad 图片加载跟踪、平台特定 Hooks

### [样式与主题](references/styling.md)

**何时阅读:** 编写组件样式、处理响应式适配、使用主题图片或渐变、安全区域、字体处理，以及确认哪些 RN 不支持的 CSS 属性

- `createStyles` / `useStyles` 用法与定义位置、ThemeImage 主题图片、渐变样式实现、两种响应式方案（无缩放 / useAdapter 等比缩放）、安全区域、字体处理（`withFontScale` / Android 字体修正）、平台特定样式、**RN 禁止使用的 CSS 属性清单**（gap、box-shadow、background-image、transition、display、position、overflow、百分比限制等）

### [路由与弹窗](references/navigation.md)

**何时阅读:** 添加新页面路由、创建新弹窗、处理页面跳转、Toast 提示、跨组件事件通信、调用原生导航能力

- 页面注册与 AppRouter 路由渲染、页面导航 API（openPage / closePage 等）、导航实现原理、弹窗注册与 AppModal 渲染器、弹窗 API（openDialog / closeDialog）、弹窗栈管理、弹窗组件编写规范、BaseDialog 位置变体、Toast 系统、MNB 事件总线（发送 / 监听 / 事件常量）、原生导航

### [网络请求](references/networking.md)

**何时阅读:** 添加新 API、处理网络错误、需要 Mock 数据、理解 fetch 跨端封装机制

- 网络架构概述、`store/api.ts` API 集中定义、平台双实现（Native fetch.ts 走 MNB / Web fetch.web.ts 走 window.fetch）、fetch 泛型与类型、错误处理、在 Store 中使用、BaseSuspense 加载状态管理、Mock 数据（目录结构 / 路由注册 / 响应定义 / 调试技巧）

### [工具函数](references/utils.md)

**何时阅读:** 使用项目常量、埋点上报、跨页面跳转、读取环境变量、调用分享能力、设置主题或字体

- const.ts 项目常量、inject.ts 环境注入、track.ts 埋点追踪（四种方法）、share.ts 分享、backflow.ts Web 回流、index.ts 通用工具、theme.ts 主题设置、font.tsx 字体处理