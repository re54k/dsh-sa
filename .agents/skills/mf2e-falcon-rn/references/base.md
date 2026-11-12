# 项目基础规范（TypeScript）

## 目录

**一、项目概览**

- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [入口文件](#入口文件)
- [配置文件](#配置文件)
- [环境变量](#环境变量)
- [全局类型声明](#全局类型声明)

**二、编码规范**

- [代码风格](#代码风格)
- [文件命名约定](#文件命名约定)
- [路径别名](#路径别名)
- [导出方式](#导出方式)
- [类型定义规范](#类型定义规范)
- [平台差异化](#平台差异化)

**三、开发规范**

- [组件规范](#组件规范)
- [样式规范](#样式规范)
- [图片资源规范](#图片资源规范)
- [状态管理 (Zustand)](#状态管理-zustand)
- [注册机制](#注册机制)
- [依赖使用规范](#依赖使用规范)

**四、禁止事项**

- [禁止事项](#禁止事项)

---

# 一、项目概览

## 技术栈

| 类别          | 技术                                                        |
| ------------- | ----------------------------------------------------------- |
| 核心框架      | React 18 + React Native 0.70 + React Native Web             |
| 开发语言      | **TypeScript**（`@react-native/typescript-config`）         |
| 状态管理      | Zustand                                                     |
| 样式主题      | @mf2e/react-native-theme-styles (ThemeImage / createStyles) |
| 原生桥接      | @mf2e/mnb (Module Native Bridge)                            |
| 动画          | react-native-reanimated + Lottie                            |
| 弹窗/覆盖层   | react-native-modal                                          |
| 高性能列表    | @shopify/flash-list                                         |
| SVG           | react-native-svg                                            |
| 渐变          | react-native-linear-gradient                                |
| 截图          | react-native-view-shot                                      |
| 构建 (Web)    | Vite (`vite.config.ts`)                                     |
| 构建 (Native) | Metro                                                       |
| 转译          | Babel + metro-react-native-babel-preset                     |
| 代码规范      | ESLint + Prettier + Husky + lint-staged                     |

## 目录结构

```
项目根目录/
├── index.js                  # Native 入口
├── index.web.js              # Web 入口
├── app.json                  # 应用元数据 (name, splitName, version)
├── babel.config.js           # Babel 转译配置、路径别名、Reanimated 插件
├── metro.config.js           # Metro 打包配置、分包序列化器
├── tsconfig.json             # TypeScript 编译配置（@/ 别名在此声明）
├── vite.config.ts            # Vite Web 打包配置
├── mock/                     # 本地 Mock 数据
├── scripts/                  # 构建/发布脚本
│   ├── dev.js                # 开发服务器 (Metro + Vite + Mock)
│   ├── build.js              # 多平台构建
│   ├── upload.js             # CDN 发布
│   └── offline.js            # 离线包发布
└── src/                      # 源代码（全部为 .ts / .tsx）
    ├── App.tsx               # 根组件（命名导出 App）
    ├── assets/               # 共享资源 (图片, Lottie 动画)
    │   └── index.ts          # 资源统一导出
    ├── components/           # 可复用组件库
    │   ├── app/              # 应用级组件 (AppRouter, AppModal, AppToast, AppVersion)
    │   ├── base/             # 基础组件 (BasePage, BaseDialog, BaseNav, BasePopup, BaseAsyncBtn, BaseSuspense, BaseLoadMore, BaseLottie)
    │   ├── common/           # 业务通用组件 (CommonPage, CommonDialog, CommonNav, CommonSuspense, CommonTab)
    │   └── share/            # 分享相关组件
    ├── dialogs/              # 全局弹窗注册
    │   ├── AlertDialog.tsx
    │   ├── ConfirmDialog.tsx
    │   └── index.ts          # 弹窗注册表
    ├── pages/                # 页面组件
    │   ├── index.ts          # 页面注册表
    │   └── {pageName}/       # 各页面目录
    │       ├── {Name}Page.tsx # 页面入口
    │       ├── components/   # 页面子组件
    │       ├── dialogs/      # 页面弹窗
    │       └── assets/       # 页面资源
    ├── store/                # 状态管理
    │   ├── api.ts            # API 端点定义（命名导出 api）
    │   ├── fetch.ts          # 请求封装（Native，泛型）
    │   ├── fetch.web.ts      # 请求封装（Web）
    │   └── modules/          # Store 模块
    │       ├── app/          # 全局 UI 状态（按能力拆分）
    │       │   ├── dialog.ts # 弹窗状态
    │       │   ├── page.ts   # 页面路由状态
    │       │   ├── popup.ts  # 气泡提示状态
    │       │   └── toast.ts  # Toast 状态
    │       └── {feature}.ts  # 功能模块
    ├── types/                # 全局类型
    │   └── global.d.ts       # 全局模块声明 (app.json / *.png / window)
    ├── uses/                 # 自定义 Hooks（命名导出）
    │   ├── use{Name}.ts      # Hook 文件
    │   ├── use{Name}.tsx     # 包含 JSX 的 Hook
    │   └── use{Name}.web.ts  # Web 平台 Hook
    └── utils/                # 工具函数
        ├── const.ts          # 全局常量
        ├── inject.ts         # 原生环境注入（含类型）
        ├── track.ts          # 埋点工具
        └── {name}.ts         # 其他工具
```

## 入口文件

### Native 入口 (`index.js`)

> 入口文件保持 JS 后缀，但通过命名导入接入 TS 代码。注册名使用 `app.splitName`（分包名）：

```javascript
import '@/utils/track'
import { withFontScale } from '@/utils/font'
import '@/utils/theme'
import { AppRegistry } from 'react-native'
import app from './app.json'
import { App } from '@/App'

AppRegistry.registerComponent(__DEV__ ? app.name : app.splitName, () => withFontScale(App))
```

### Web 入口 (`index.web.js`)

```javascript
import { withFontScale } from '@/utils/font'
import { AppRegistry } from 'react-native'
import { name as appName } from './app.json'
import { App } from '@/App'

AppRegistry.registerComponent(appName, () => withFontScale(App))
AppRegistry.runApplication(appName, { rootTag: document.getElementById('app') })
```

### 根组件 (`src/App.tsx`)

```tsx
import { AppRouter } from '@/components/app/AppRouter'
import { AppModal } from '@/components/app/AppModal'
import { AppToast } from '@/components/app/AppToast'
import { AppVersion } from '@/components/app/AppVersion'

export const App = () => {
  return (
    <>
      <AppRouter /> {/* 页面路由 */}
      <AppModal /> {/* 弹窗渲染 */}
      <AppToast /> {/* Toast 提示 */}
      <AppVersion /> {/* 版本信息 */}
    </>
  )
}
```

## 配置文件

| 文件              | 用途                                                          |
| ----------------- | ------------------------------------------------------------- |
| `app.json`        | 应用名称 (`name`)、分包名 (`splitName`)、版本号、构建时间     |
| `babel.config.js` | Babel 转译配置、路径别名、Reanimated 插件                     |
| `metro.config.js` | Metro 打包配置、分包序列化器                                  |
| `tsconfig.json`   | TypeScript 配置，`paths` 中声明 `@/*` 别名，include `**/*.ts` |
| `vite.config.ts`  | Vite Web 构建、CDN 路径、RN Web 插件（TS 语法）               |
| `mf2e-cli.json`   | MF2E CLI 插件配置                                             |
| `.eslintrc`       | ESLint 规则                                                   |
| `.prettierrc`     | Prettier 格式化规则                                           |

## 环境变量

- `__DEV__` — 布尔值，区分开发/生产环境，由 Metro/Vite 注入
- `appEnv` — 客户端环境变量，从原生注入，类型为 `AppEnv`（`src/utils/inject.ts`）
- `queryParams` — 路由参数，从原生协议链接解析，类型为 `QueryParams`
- `appHosts` — API host 列表，按环境切换，类型为 `AppHosts`

三者均为**类型化常量**，且为可变引用（如 `queryParams.page = 'x'` 可写），参见[工具函数规范](utils.md#环境注入)。

## 全局类型声明

`src/types/global.d.ts` 承担三类全局声明，**新增全局资源/运行时能力时必须同步维护**：

```ts
/**
 * app.json 的构建注入类型声明。
 */
declare module '@/../app.json' {
  const app: {
    name: string
    splitName?: string
    buildVersion?: number
    buildTime?: string
  }
  export default app
}

/**
 * 图片资源模块声明：ImageSourcePropType 联合类型，保证跨端类型一致
 */
declare module '*.png' {
  const value: import('react-native').ImageSourcePropType
  export default value
}

/**
 * Web 端 window 全局对象类型（lib 不含 DOM，需手动声明）
 */
declare namespace window {
  interface Location {
    href?: string
    pathname?: string
  }
  interface OpenNewsApp {
    open?: (params: { param?: string }) => void
  }
  var fetch: typeof fetch
  var location: Location | undefined
  var openNewsapp: OpenNewsApp | undefined
}
```

> `global.d.ts` 中声明的 `*.png` 让 `import navBack from './nav-back.png'` 具有类型；Web 端 `window.fetch` / `window.location` / `window.openNewsapp` 也依赖此声明，缺失会导致 `window` 相关类型报错。

---

# 二、编码规范

## 代码风格

### 格式规则

- 字符串使用**单引号**: `'hello'`
- 语句末尾**不加分号**
- 缩进使用 **2 个空格**
- **显式标注返回类型** — 函数 / Hooks / 组件推荐标注返回类型（如 `: ReactElement`、`: UsePageReturn`）

### 变量命名约定

| 类型     | 命名规则                            | 示例                                            |
| -------- | ----------------------------------- | ----------------------------------------------- |
| 常量     | UPPER_SNAKE_CASE                    | `PAGE_SIZE`, `BOTTOM_SPACE`, `NAV_TOTAL_HEIGHT` |
| 类型别名 | PascalCase                          | `PageParams`, `DialogPosition`, `LoadMoreState` |
| 接口     | PascalCase (`I` 前缀可选，项目不加) | `PageConfig`, `HomeInfo`, `BasePageProps`       |
| 状态变量 | camelCase                           | `loading`, `pageConfig`, `dataList`             |
| 事件处理 | on 前缀 + camelCase                 | `onPress`, `onRefresh`, `onChange`              |
| 布尔值   | 描述性形容词                        | `disabled`, `loading`, `visible`                |
| 数据对象 | camelCase 名词                      | `data`, `list`, `config`                        |

## 文件命名约定

| 类型         | 命名规则                   | 示例                                                    |
| ------------ | -------------------------- | ------------------------------------------------------- |
| 页面组件     | PascalCase + `Page` 后缀   | `HomePage.tsx`, `TemplatePage.tsx`                      |
| 弹窗组件     | PascalCase + `Dialog` 后缀 | `AlertDialog.tsx`, `ConfirmDialog.tsx`                  |
| 基础组件     | `Base` 前缀 + PascalCase   | `BasePage.tsx`, `BaseDialog.tsx`                        |
| 通用组件     | `Common` 前缀 + PascalCase | `CommonNav.tsx`, `CommonPage.tsx`                       |
| 应用组件     | `App` 前缀 + PascalCase    | `AppRouter.tsx`, `AppModal.tsx`                         |
| 自定义 Hook  | `use` 前缀 + camelCase     | `useAdapter.ts`, `usePage.ts`                           |
| Store 模块   | camelCase                  | `app/`, `home.ts`, `template.ts`                        |
| 工具函数     | camelCase                  | `track.ts`, `const.ts`, `inject.ts`                     |
| 类型声明文件 | kebab-case                 | `global.d.ts`                                           |
| 平台特定     | 原名 + `.web.ts(x)` 后缀   | `fetch.web.ts`, `useShare.web.ts`, `BaseLottie.web.tsx` |

> 约定：纯逻辑/类型文件用 `.ts`，含 JSX 的文件用 `.tsx`。Hook 文件如无 JSX 用 `.ts`（如 `usePage.ts`），有 JSX 用 `.tsx`（如 `useLoadMore.tsx`）。

## 路径别名

使用 `@/` 别名指向 `src/` 目录。在 Babel（运行时）和 **tsconfig.json（类型检查）** 中配置：

```json
// tsconfig.json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "types": ["react-native"],
    "paths": {
      "@/*": ["./src/*"],
      "react-native-reanimated": ["./node_modules/@music/react-native-reanimated"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/node_modules", "**/Pods"]
}
```

**使用方式:**

```ts
import { BasePage } from '@/components/base/BasePage'
import { useAdapter } from '@/uses/useAdapter'
import { BOTTOM_SPACE } from '@/utils/const'
```

## 导出方式

- **全面命名导出** — 组件、Hooks、工具函数、注册表、API 端点、assets 一律使用命名导出（`export const` / `export function`）
- **类型与值一并导出** — `export interface XxxProps`、`export type Xxx`、`export const Xxx`
- 不使用 `export default`（`App.tsx`、`pages/index.ts`、`dialogs/index.ts`、`store/api.ts`、`assets/index.ts` 均为命名导出）
- 类型导入使用 `import type { ... }`

```ts
// ✅ 组件命名导出
export const BasePage = ({ style }: BasePageProps) => { ... }
export interface BasePageProps { ... }

// ✅ 注册表命名导出
export const pages: PageRegistryItem[] = [...]
export interface PageRegistryItem { ... }

// ❌ 不使用 default 导出
export default BasePage
```

## 类型定义规范

- **Props** — 每个组件在文件顶部定义并导出 `export interface XxxProps`；需要复用基础组件类型时用 `extends Omit<BaseProps, 'xxx'>` 剔除冲突字段

```ts
export interface CommonPageProps extends Omit<BasePageProps, 'style'> {
  style?: StyleProp<ViewStyle>
}
```

- **状态** — store 状态用 `interface XxxStore` 描述，`create<XxxStore>` 强约束
- **工具入参/出参** — 函数参数与返回值显式标注，例如 `fetch<T>(config: FetchConfig<T>): Promise<T>`
- **禁止裸 `any`** — 值类型开放时用 `Record<string, unknown>`（如 `PageParams`、`DialogParams`），避免 `any` 污染
- **第三方未导出类型** — 需要时通过 `ComponentProps<typeof Xxx>`、`Pick`、`Omit`、`NonNullable` 从库类型派生，避免手写漂移

## 平台差异化

### `.web.ts` / `.web.tsx` 后缀约定

当某功能在 Web 和 Native 端实现不同时，创建同名 `.web.ts(x)` 文件：

```
src/store/fetch.ts          # Native 实现 (MNB bridge)
src/store/fetch.web.ts      # Web 实现 (window.fetch)
src/uses/useShare.ts        # Native 分享
src/uses/useShare.web.ts    # Web 分享
src/components/base/BaseLottie.tsx       # Native: lottie-react-native
src/components/base/BaseLottie.web.tsx   # Web: lottie-react
```

Metro/Vite 会自动根据平台选择对应文件，两端导出**同名同形**的符号。

### 行内平台判断

```ts
import { Platform } from 'react-native'

if (Platform.OS === 'web') {
  /* Web 逻辑 */
}
if (Platform.OS === 'ios') {
  /* iOS 逻辑 */
}
if (Platform.OS === 'android') {
  /* Android 逻辑 */
}
```

---

# 三、开发规范

## 组件规范

- 页面组件: `{Name}Page.tsx`，使用 `BasePage` 的 `nav` + `main` 插槽模式；样式统一时优先使用 `CommonPage`
- 弹窗组件: `{Name}Dialog.tsx`，使用 `BaseDialog` 容器；样式统一时优先使用 `CommonDialog`
- 基础组件: `Base{Name}.tsx` | 通用组件: `Common{Name}.tsx` | 平台特定组件: `{Name}.web.tsx`
- **Props 类型**定义在文件顶部，使用 `export interface XxxProps`
- `createStyles` 定义在**组件函数之后、文件底部**
- `style` prop 按需添加 — 所有组件都支持 `style`；默认写组件时不必加 `style` 参数，需要让调用方自定义样式时再显式声明并通过 `style={[styles.Root, style]}` 合并
- 组件使用**命名导出** `export const Xxx`

## 样式规范

- 使用 `createStyles` 定义样式，`useStyles` 消费样式
- 根样式名与组件名一致
- 顶部安全区/底部安全区使用 `NAV_TOTAL_HEIGHT` / `BOTTOM_SPACE` 常量
- 图片统一使用 `ThemeImage`，支持暗色模式

## 图片资源规范

### 存放位置

图片资源分两级存放，各自通过 `assets/index.ts` 统一导出:

- `src/assets/` — 共享资源 (导航图标、通用背景、Lottie 动画等)
- `src/pages/{pageName}/assets/` — 页面专属资源

### 本地图片

- 文件使用 `@3x` 后缀命名: `nav-back@3x.png`
- 文件名使用小写 + 连字符: `nav-back@3x.png`, `btn-share@3x.png`
- TS 中直接 `import` 图片（依赖 `global.d.ts` 的 `*.png` 声明），路径**不带 `@3x` 后缀**，RN 自动匹配分辨率

```ts
// src/assets/index.ts
import navBack from './nav-back.png'
import dialogClose from './dialog-close.png'
import logoLight from './react-native.png'
import logoDark from './react-native.dark.png'
import lottie from './react-native.json'

export const Assets = {
  navBack,
  dialogClose,
  logo: {
    light: logoLight,
    dark: logoDark,
  },
  lottie,
}
```

```ts
// src/pages/home/assets/index.ts
import mainTask from './main-task.png'
import headBg from './head-bg.json'

export const Assets = {
  mainTask,
  headBg,
}
```

```ts
// 使用方式
import { Assets } from '@/assets' // 共享资源
import { Assets as HomeAssets } from '@/pages/home/assets' // 页面资源
;<ThemeImage source={Assets.navBack} style={styles.icon} />
```

> 主题双图资源（明暗）放在同一键下：`logo: { light, dark }`，`ThemeImage` 根据主题自动选择。

### 主题图片

- 必须使用 `ThemeImage` 替代 `Image`，支持暗色模式自动切换，且其内部使用 `FastImage` 提高图片加载速度

```tsx
<ThemeImage style={styles.bg} source={Assets.logo.light} />
```

### 网络图片

- 使用 `source={{ uri }}` 加载

```tsx
<ThemeImage source={{ uri: 'https://example.com/image.png' }} />
```

## 状态管理 (Zustand)

- Store 文件位于 `src/store/modules/`，全局 UI 状态在 `src/store/modules/app/` 下按能力拆分为 `dialog.ts` / `page.ts` / `popup.ts` / `toast.ts`
- 每个 Store 模块**命名导出** `useXxxStore`；需要跨 store 或组件外调用时，额外命名导出独立方法
- 跨 Store 调用: 只 import 独立导出方法，不 import `useXxxStore` hook
- 数据状态初始值用 `null` 表示"未加载"
- API 端点集中定义在 `src/store/api.ts`（命名导出 `api`）
- 组件内使用 selector 精确订阅: `const data = useStore((s) => s.data)`，**禁止**无 selector 的 `useStore()` 解构写法，避免无关状态变更触发组件 rerender

## 注册机制

- 新页面必须在 `src/pages/index.ts` 中注册（命名导出 `pages`）
- 新弹窗必须在 `src/dialogs/index.ts` 中注册（命名导出 `dialogs`）
- 弹窗标识使用 kebab-case: `'make-card'`、`'task-list'`

```ts
// src/pages/index.ts
import type { ComponentType } from 'react'
import { HomePage } from './home/HomePage'

export interface PageRegistryItem {
  page: string
  component: ComponentType<any>
}

export const pages: PageRegistryItem[] = [{ page: 'home', component: HomePage }]
```

```ts
// src/dialogs/index.ts
import type { ComponentType } from 'react'
import { AlertDialog } from './AlertDialog'
import { ConfirmDialog } from './ConfirmDialog'

export interface DialogRegistryItem {
  dialog: string
  component: ComponentType<any>
}

export const dialogs: DialogRegistryItem[] = [
  { dialog: 'alert', component: AlertDialog },
  { dialog: 'confirm', component: ConfirmDialog },
]
```

## 依赖使用规范

在代码中引入任何第三方库之前，**必须先检查 `package.json` 的 `dependencies` / `devDependencies` 中是否已安装该依赖**：

1. **已安装** — 直接 `import` 使用
2. **未安装** — 先执行 `npm install <package>` 安装，确认 `package.json` 已更新后再使用
3. **不确定** — 读取 `package.json` 确认，不要凭记忆假设已安装

> **原因：** 未安装的依赖会导致 Metro/Vite 打包失败或运行时崩溃，且错误信息可能不直观。养成先检查再使用的习惯，可以避免不必要的排查时间。

**示例：使用 `react-native-linear-gradient` 前的检查流程**

```bash
# 1. 检查是否已安装
cat package.json | grep react-native-linear-gradient

# 2. 如果没有输出，先安装
npm install react-native-linear-gradient --save

# 3. 然后再在代码中使用
```

```ts
// ✅ 确认已安装后使用
import LinearGradient from 'react-native-linear-gradient'

// ❌ 未确认就直接使用 — 可能导致打包失败
import SomeLib from 'some-unknown-lib'
```

> TS 工程额外注意：若三方库无类型声明且 `@types/*` 也未安装，`import` 会报类型错误。此时先检查 `package.json` 是否已装 `@types/<pkg>`，确属无类型包时可参照 `src/types/global.d.ts` 的做法，在全局声明中 `declare module '<pkg>'` 补一个最小类型。

---

# 四、禁止事项

## 禁止事项

1. **不使用 class 组件** — 只使用函数组件 + Hooks
2. **不使用 `export default`** — 组件、工具、注册表统一命名导出
3. **不使用行内样式** — `style={{ color: 'red' }}` 禁止，必须用 `createStyles`
4. **不使用 StyleSheet.create** — 必须使用 `createStyles` / `useStyles`
5. **不直接使用 fetch** — 禁止 `window.fetch` 或全局 `fetch`，必须用 `@/store/fetch`
6. **不使用相对路径** — 禁止 `../../../`，必须用 `@/` 路径别名
7. **不在组件外使用 Hooks** — Hooks 只能在函数组件或自定义 Hook 内调用
8. **不使用 Image 组件** — 禁止直接使用 RN 的 `Image`，必须用 `ThemeImage`，其内部使用 `FastImage` 提高图片加载速度
9. **不使用未安装的依赖** — 引入第三方库前必须检查 `package.json` 确认已安装，未安装需先 `npm install`
10. **不滥用 `any`** — 开放值类型用 `Record<string, unknown>`，禁止裸 `any` 扩散
