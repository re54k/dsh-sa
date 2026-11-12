# 工具函数规范（TypeScript）

## 目录

- [概述](#概述)
- [常量定义](#常量定义)
- [环境注入](#环境注入)
- [埋点追踪](#埋点追踪)
- [导航工具](#导航工具)
- [分享工具](#分享工具)
- [其他工具](#其他工具)
- [@mf2e/base库](#mf2ebase库)
- [注意事项](#注意事项)

## 概述

工具函数位于 `src/utils/` 目录，按功能拆分为独立文件，全部使用**命名导出**（`export const` / `export function`），不使用默认导出。

| 文件                          | 用途             |
| ----------------------------- | ---------------- |
| `const.ts`                    | 全局常量         |
| `inject.ts` / `inject.web.ts` | 原生环境注入     |
| `track.ts`                    | 埋点追踪         |
| `share.ts`                    | 分享链接生成     |
| `backflow.ts`                 | Web 回流唤起     |
| `font.tsx`                    | 字体缩放         |
| `theme.ts`                    | 主题设置         |
| `index.ts`                    | 通用工具导出     |

> **优先复用 `@mf2e/base`：** 通用工具（类型判断、日期格式化、URL 解析/序列化、防抖节流、Promise 辅助等）优先直接引入 `@mf2e/base` 已提供的现成方法，禁止在 `src/utils/` 中自实现同功能函数。仅当 base 未提供时，才在对应工具文件中自实现。

## 常量定义

在 `const.ts` 中集中定义全局常量：

```ts
/*
 * 定义全局常量
 */
import { getBottomSpace } from 'react-native-iphone-screen-helper'
import { appEnv } from '@/utils/inject'

/** 状态栏高度 */
export const STATUS_BAR_HEIGHT = appEnv.statusBarHeight ?? 0
/** 导航栏高度 */
export const NAV_BAR_HEIGHT = appEnv.navBarHeight ?? 0
/** 状态栏 + 导航栏总高度 */
export const NAV_TOTAL_HEIGHT = STATUS_BAR_HEIGHT + NAV_BAR_HEIGHT

/** 底部安全区域高度 */
export const BOTTOM_SPACE = getBottomSpace()
```

**常量命名规范:**

- **安全区域/尺寸:** UPPER_SNAKE_CASE，如 `BOTTOM_SPACE`、`NAV_TOTAL_HEIGHT`
- **存储前缀 / 事件 key / 枚举:** UPPER_SNAKE_CASE，如 `STORAGE_PREFIX`、`STATUS`
- 常量集中管理，组件内不硬编码魔法数字或字符串

## 环境注入

从原生模块获取运行时环境信息。TS 版为每个导出常量声明了**类型接口**，字段按需扩展：

```ts
import { TurboModuleRegistry, NativeModules } from 'react-native'

/**
 * 客户端环境变量（原生端注入，字段按需扩展）
 */
export interface AppEnv {
  /** 状态栏高度 */
  statusBarHeight?: number
  /** 导航栏高度 */
  navBarHeight?: number
  /** 字体缩放比例 */
  fontScale?: number
  [key: string]: unknown
}

/** 客户端网络环境 host 列表 */
export interface AppHosts {
  /** 蜜蜂 API 域名 */
  api_mifengs_com?: string
  /** 网易网关域名 */
  gw_m_163_com?: string
  [key: string]: string | undefined
}

/** 客户端路由协议链接参数 */
export interface QueryParams {
  id?: string
  url?: string
  page?: string
  dialog?: string
  [key: string]: unknown
}

// 通过安全解析（parseJson<T>）得到类型化常量：
// export const appEnv: AppEnv = parseJson<AppEnv>(context.appEnv, {})
// export const appHosts: AppHosts = parseJson<AppHosts>(context.appHosts, {})
// export const queryParams: QueryParams = parseJson<QueryParams>(context.queryParams, {})
```

```ts
// src/utils/inject.web.ts (Web) — 示意
import { parseParams } from '@mf2e/base'

export const appEnv: AppEnv = { ... }
export const appHosts: AppHosts = { ... }
export const queryParams: QueryParams = parseParams() as unknown as QueryParams
```

**Web 端差异要点:**
- `appEnv` 尺寸为 0（无原生状态栏 / 导航栏）
- `appHosts.api_mifengs_com` 由 URL 推导（含 test 环境判断），`__DEV__` 时为空串
- `queryParams` 用 `@mf2e/base` 的 `parseParams()` 从 URL 解析，值可能为 `null` / 数组，不要手写正则解析 URL

**使用方式:**

```ts
import { queryParams, appHosts } from '@/utils/inject'

// 读取路由参数（QueryParams 已声明 id/page/dialog 等字段）
const templateId = queryParams.templateId

// 获取 API host
const host = appHosts.api_mifengs_com || 'https://api.mifengs.com'
```

> 注意：`appEnv` / `appHosts` / `queryParams` 是**可变引用**，如 `page.ts` 中 `queryParams.page = page` 会同步修改原生注入的参数。Web 端从 URL 解析，两端形状保持一致。

## 埋点追踪

`track.ts` 提供四种埋点方法，参数显式标注类型：

```ts
// 1. 发送事件
export const track = (event: string, info?: Record<string, unknown>): void => { ... }
// 2. 点击统计 — 包装点击事件
export const onPressTrack = (fn: () => unknown, event: string, info?: Record<string, unknown>): (() => unknown) => { ... }
// 3. 展示统计 — 组件挂载时触发（内部用 ref 缓存 info，仅依赖 event 重新埋点）
export const useEffectTrack = (event: string, info?: Record<string, unknown>): void => { ... }
// 4. 曝光统计 — 元素可见比例 >= 20% 时触发一次（measureInWindow + @mf2e/base 的 throttle）
export const useExposureTrack = (ref: RefObject<View | null>, event: string, info?: Record<string, unknown>): void => { ... }
```

**核心要点:**
- 内部会拉取并合并客户端 `columnInfo`（频道 / 页面固定参数），最终 `mnb('track.sendEvent', { eventId, kv })`
- 曝光埋点基于 `measureInWindow` 计算可见比例，`@mf2e/base` 的 `throttle` + `requestAnimationFrame` 持续检测，触发一次后停止
- 防抖 / 节流直接 `import { debounce, throttle } from '@mf2e/base'`，不要在工具文件中自实现

**使用方式:**

```tsx
import { track, onPressTrack, useEffectTrack, useExposureTrack } from '@/utils/track'

// 直接发送
track('click_button', { buttonName: '分享' })

// 包装点击
<Pressable onPress={onPressTrack(handlePress, 'click_share', { type: 'card' })} />

// 展示埋点
useEffectTrack('show_home_page')

// 曝光埋点
const ref = useRef<View | null>(null)
useExposureTrack(ref, 'exposure_banner', { bannerId: '123' })
<View ref={ref}>...</View>
```

> 规范：优先使用上述封装埋点，不要直接调用 `mnb('track.sendEvent')`。

## 导航工具

### 页面跳转统一入口

页面跳转统一走 **store 独立方法**（`@/store/modules/app/page`），不在组件中直接拼接路由路径：

```ts
import { openPage, closePage } from '@/store/modules/app/page'

export const toProfile = (userId: string) => {
  openPage('profile', { id: userId })
}

export const toLink = (link: string) => {
  openPage('web', { url: link })
}

export const toWallet = () => {
  openPage('wallet')
}
```

> 当具体业务跳转方法增多时，可在 `src/utils/` 新建 `to.ts` 统一收口（具名导出 `toXxx` 函数），新增跳转目标时在该文件中添加方法。

### Web 回流唤起（backflow.ts）

Web 端点击需唤起 App 的场景，使用 `onPressBackflow` 包装回调：

```ts
/**
 * 包装回流点击方法
 * @param fn 原生端点击回调
 */
export const onPressBackflow = (fn?: () => void): (() => void) => { ... }
```

**核心要点:**
- Web 端：取 `queryParams.scheme` 去掉 `ntescommunity://` 前缀，调 `window.openNewsapp?.open?.({ param })` 唤起 App
- 非 Web 端：直接执行原生端回调 `fn?.()`

## 分享工具

`share.ts` 提供分享链接生成，类型 `ShareParams` 定义拼接参数：

```ts
/** 分享链接拼接参数 */
export type ShareParams = Record<string, string | number | null | undefined>

// 生成分享落地页链接（queryParams 过滤项 + 业务参数 + scheme + sps 参数）
export const getShareUrl = async (params?: ShareParams | null): Promise<string> => { ... }
// 生成唤起协议 scheme（ntescommunity://nc/page?...）
export const getShareScheme = (params?: ShareParams | null): string => { ... }
// 生成分享卡片二维码（先 getShareUrl，再请求短链接口，失败回退原链接）
export const getShareQRCodeUrl = async (params?: ShareParams | null): Promise<string> => { ... }
```

**核心要点:**
- 落地页基于 `app.json` 的 `app.name` 拼接 `https://wp.mifengs.com/163/{dir}/bee/{app.name}/index.html`
- 拼接时会过滤 `queryParams` 中的路由 / 埋点噪声字段（如 `rnAbTest`、`startupSession` 等）
- 参数序列化 / 解析使用 `@mf2e/base` 的 `serializeParams` / `parseParams` / `Url`，不手写拼接与解析逻辑
- `getShareSpsInfo` 内部模块级缓存 sps 参数，首个请求成功后复用

> `getShareQRCodeUrl` 内部走 `fetch<ShortLinkData>`，通过 `app.json` 的类型声明（`global.d.ts` 中 `declare module '@/../app.json'`）拿到 `app.name`。

## 其他工具

### 通用工具 (index.ts)

`index.ts` 只收口 `@mf2e/base` **未提供**的工具；base 已有的能力直接导入使用，禁止重复实现。

```ts
/*
 * 常用工具函数
 */

// base 已提供的能力，直接从这里导入，不要在 src/utils/ 自实现：
// import { debounce, throttle, noop, settle } from '@mf2e/base'

// 异步等待函数 — base 暂无对应 API，允许自实现
export const sleep = (duration: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}
```

### 主题设置 (theme.ts)

```ts
// import { setTheme, setCustomThemes } from '@mf2e/react-native-theme-styles'

// 设置固定颜色主题
// setTheme('light', true)

// 设置自定义色板
// setCustomThemes({})
```

### 字体处理 (font.tsx)

```tsx
// 导出 withFontScale HOC — 在入口文件中包裹 App
// 全局劫持 Text/TextInput render 进行字体修正（allowFontScaling / maxFontSizeMultiplier / Android 修正）
// 通过 FontScaleContext 提供 fontScale，子组件用 useFontScaleChange() 订阅字体缩放变化

export const withFontScale = <P extends object>(App: ComponentType<P>) => { ... }

export const useFontScaleChange = (): number => {
  return useContext(FontScaleContext)
}
```

## @mf2e/base库

`@mf2e/base`（Toolkit Base）是团队维护的跨平台基础工具库，支持 Web / Node / ReactNative。**base 已提供的能力，直接导入使用，禁止自实现。**

```ts
import { parseParams, serializeParams, debounce, throttle, settle, noop } from '@mf2e/base'
```

**常用能力速查**（以 `node_modules/@mf2e/base/dist/types/index.d.ts` 的导出为准，版本升级后以实际导出为准）：

| 分类       | 方法                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 类型判断   | `isArray` `isBoolean` `isDate` `isFunction` `isNil` `isNull` `isNumber` `isPlainObject` `isString` `isUndefined` `isValuedArray` `isValuedPlainObject` `isValuedString` |
| 日期处理   | `duration` `formatDate` `fromNow` `resolveDate` `resolveDateString`                                                                                          |
| 格式化     | `escapeHTML` `fixLineBreak` `formatPhoneNumber` `shortNumber` `standardSize` `optimizeImageSrc` `setOptimizeImageSrcGlobalOptions` `clamp`                    |
| URL 处理   | `parseParams` `serializeParams` `Url`                                                                                                                         |
| 函数工具   | `debounce` `throttle` `noop`                                                                                                                                 |
| Promise 辅助 | `settle`                                                                                                                                                    |
| 环境检测   | `isStandardBrowserEnv` `supportWebp`                                                                                                                          |
| 事件总线   | `subscribe` `publish` `unsubscribe` `isSubscribed`                                                                                                            |
| 版本比较   | `moreThan` `lessThan`                                                                                                                                        |

**替换示例：**

```ts
// ❌ 在 src/utils/ 自实现防抖 / 节流
export const myDebounce = (fn: (...args: unknown[]) => void, wait: number) => { ... }

// ✅ 直接从 @mf2e/base 导入
import { debounce, throttle } from '@mf2e/base'
```

**判断流程：**

1. 需要通用能力时，先查 `@mf2e/base` 导出清单是否已有现成方法
2. 已有 → 直接 `import { xxx } from '@mf2e/base'`，不在 `src/utils/` 重复实现
3. 没有 → 才在对应工具文件中自实现，并保持具名导出

## 注意事项

1. **文件按功能拆分** — 每个工具文件职责单一，不要把无关功能混在同一个文件中
2. **常量集中管理** — 所有全局常量在 `const.ts` 中定义，组件内不要硬编码魔法数字或字符串
3. **平台差异化** — 需要区分 Native/Web 实现时，使用 `.web.ts` 后缀文件（如 `inject.ts` / `inject.web.ts`），RN 打包会自动选择对应平台文件
4. **导出方式** — 工具函数使用具名导出 (`export const`)，不使用默认导出
5. **埋点规范** — 优先使用封装好的 `track`、`onPressTrack`、`useEffectTrack`、`useExposureTrack`，不要直接调用 `mnb('track.sendEvent')`
6. **导航统一入口** — 页面跳转通过 `page.ts` 的 `openPage` / `closePage` 封装，新增跳转目标时统一收口，不要在组件中直接拼接路由路径
7. **不要在工具函数中引入 React 组件** — `utils/` 是纯逻辑层，如需 React 能力（如 Hooks），应放在 `uses/` 目录（如 `track.ts` 中的 Hooks 属于例外，通过 `uses/` 无关的 hooks 直接在工具文件内实现亦可，但禁止引入 React 组件渲染）
8. **类型标注** — 工具函数参数与返回值显式标注类型，开放对象用 `Record<string, unknown>`，避免裸 `any`
9. **优先复用 @mf2e/base** — 类型判断 / 日期 / 格式化 / URL / 防抖节流 / `settle` / `noop` 等通用能力直接从 `@mf2e/base` 导入，禁止在 `src/utils/` 自实现同功能函数；仅 base 未提供的工具才允许自实现
