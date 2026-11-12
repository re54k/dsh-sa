# 组件规范（TypeScript）

## 目录

- [组件层级体系](#组件层级体系)
- [组件结构模板](#组件结构模板)
- [Props 类型规范](#props-类型规范)
- [页面组件](#页面组件)
- [基础组件](#基础组件)
- [弹窗组件](#弹窗组件)
- [气泡组件](#气泡组件)
- [交互组件](#交互组件)
- [平台特定组件](#平台特定组件)
- [性能优化](#性能优化)
- [注意事项](#注意事项)

## 组件层级体系

组件分为**全局通用层**和**页面层**两大类。全局通用层按职责自上而下划分为 App、Base、Common 三层；页面层独立组织。

### 全局通用层 (components/)

```
App 层 (components/app/)         应用级组件，全局只渲染一次
  ├─ AppRouter     页面路由
  ├─ AppModal      弹窗渲染器
  ├─ AppToast      Toast 渲染器
  └─ AppVersion    版本信息

Base 层 (components/base/)       基础原子组件，与业务无关
  ├─ BasePage      页面布局容器
  ├─ BaseDialog    弹窗容器
  ├─ BaseNav       导航栏
  ├─ BasePopup     气泡浮层
  ├─ BaseAsyncBtn  异步按钮
  ├─ BaseSuspense  加载状态容器
  ├─ BaseLoadMore  加载更多
  └─ BaseLottie    Lottie 动画

Common 层 (components/common/)   业务通用组件，封装项目通用样式与逻辑
  ├─ CommonPage      通用页面
  ├─ CommonDialog    通用弹窗
  ├─ CommonNav       通用导航栏
  ├─ CommonSuspense  通用加载容器
  ├─ CommonTab       通用 Tab 容器
  └─ Common...       其他业务通用组件
```

### 页面层 (pages/)

```
pages/{name}/                    按页面组织，仅在当前页面内使用
  ├─ assets/           页面资源
  ├─ components/       页面子组件
  ├─ dialogs/          页面弹窗
  └─ {Name}Page.tsx    页面入口
```

页面层可以引用全局通用层中的 **Base** 或 **Common** 组件进行组合开发，但**不可反向引用**（全局通用层不应依赖具体页面的组件）。

### 命名规范

- **App 组件**: `App{Name}.tsx` — 如 `AppRouter.tsx`
- **Base 组件**: `Base{Name}.tsx` — 如 `BasePage.tsx`, `BaseDialog.tsx`
- **Common 组件**: `Common{Name}.tsx` — 如 `CommonPage.tsx`, `CommonNav.tsx`
- **页面组件**: `{Name}Page.tsx` — 如 `HomePage.tsx`
- **页面子组件**: `{Name}Panel.tsx`、`{Name}View.tsx`、`{Name}List.tsx`、`{Name}Item.tsx` 等，按功能命名

## 组件结构模板

所有组件统一使用**函数组件 + Hooks**，不使用 class 组件。TS 标准结构如下：

```tsx
import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'

export interface ComponentNameProps {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

export const ComponentName = ({ style, children }: ComponentNameProps) => {
  const styles = useStyles(themeStyles)

  return <View style={[styles.ComponentName, style]}>{children}</View>
}

const themeStyles = createStyles({
  ComponentName: {
    flex: 1,
  },
})
```

**要点:**

1. **Props 接口定义在文件顶部**，使用 `export interface XxxProps` 并导出
2. `createStyles` 定义在组件函数**外部底部**
3. `useStyles` 在组件函数**内部顶部**调用
4. 样式名与组件名一致作为根样式
5. **`style` prop 按需添加** — 所有组件都支持 `style`；默认写法**不必带** `style` 参数，需要让调用方自定义样式时再显式声明并通过 `style={[styles.Root, style]}` 合并
6. 使用 `...otherProps` 透传额外属性
7. 组件使用**命名导出** `export const Xxx`

## Props 类型规范

Props 通过解构传递，类型使用 `interface` 定义。复用基础组件类型时用 `extends Omit<BaseProps, '冲突字段'>` 剔除需要自定义的字段：

```tsx
// 默认写法 — 不带 style
export interface CommonSimpleProps {
  /** 信息 */
  info: string
}
export const CommonSimple = ({ info }: CommonSimpleProps) => { ... }

// 需要外部自定义样式时 — 显式接收 style 并合并
export interface CommonComplexProps {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}
export const CommonComplex = ({ style, children }: CommonComplexProps) => { ... }

// 容器/原子型组件 — 继承并扩展基础组件类型
import type { BasePageProps } from '@/components/base/BasePage'

export interface CommonPageProps extends Omit<BasePageProps, 'style'> {
  style?: StyleProp<ViewStyle>
}
export const CommonPage = ({ style, ...otherProps }: CommonPageProps) => { ... }

// 继承三方库类型 — 通过 Omit 精确控制
import type { PressableProps, GestureResponderEvent } from 'react-native'

export interface BaseAsyncBtnProps extends Omit<PressableProps, 'style' | 'children' | 'onPress'> {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  /** 异步点击回调 */
  onPress?: (event: GestureResponderEvent) => Promise<void> | void
  loadingStyle?: StyleProp<ViewStyle>
  loadingComponent?: ReactNode
}
```

**规范:**

- `style` 统一用 `StyleProp<ViewStyle>`（图片为 `StyleProp<ImageStyle>`，文字为 `StyleProp<TextStyle>`）
- 子元素插槽统一用 `ReactNode`，类型导入用 `import type { ReactNode } from 'react'`
- 开放值类型的参数用 `Record<string, unknown>`，不用裸 `any`
- 复杂 Props 使用 JSDoc 注释说明用途，如 `/** 异步点击回调 */`

## 页面组件

页面采用 `nav` + `main` 插槽模式。当多个页面共享相同的布局样式时，优先使用 `CommonPage`；仅在需要自定义页面布局时才直接使用 `BasePage`：

```tsx
// 优先方式 — 使用 CommonPage (统一样式的页面)
import { CommonPage } from '@/components/common/CommonPage'
import { HomeNav } from './HomeNav'
import { HomeMain } from './HomeMain'

export const HomePage = () => {
  return <CommonPage nav={<HomeNav />} main={<HomeMain />} />
}
```

```tsx
// 需要自定义布局时 — 使用 BasePage（以 HomePage 为例）
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BasePage } from '@/components/base/BasePage'
import { HomeNav } from './HomeNav'
import { HomeMain } from './HomeMain'

export const HomePage = () => {
  const styles = useStyles(themeStyles)

  return <BasePage style={styles.HomePage} nav={<HomeNav />} main={<HomeMain />} />
}

const themeStyles = createStyles({
  HomePage: {
    backgroundColor: '#fff',
  },
})
```

### 页面目录结构

```
pages/home/
├── assets/              # 页面专用资源
│   └── index.ts
├── components/          # 页面子组件
│   ├── HeadPanel.tsx
│   ├── MainPanel.tsx
│   └── ...
├── dialogs/             # 页面弹窗
│   └── SomeNameDialog.tsx
├── HomePage.tsx         # 页面入口 (组合 nav + main)
├── HomeNav.tsx          # 页面导航栏
└── HomeMain.tsx         # 页面主内容
```

### 页面注册

在 `pages/index.ts` 中注册页面（命名导出 + 类型）：

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

## 基础组件

### BasePage — 页面布局容器

```tsx
export interface BasePageProps {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  /** 背景内容 */
  bg?: ReactNode
  /** 导航 */
  nav?: ReactNode
  /** 主体内容 */
  main?: ReactNode
}
```

**职责:** 提供页面整体布局、响应式缩放、滚动上下文。内部注入 `PageContext.Provider`（`usePage`），点击空白处自动收起键盘并关闭全部气泡。

### BaseAsyncBtn — 异步按钮

**职责:** 防止重复点击，自动管理 loading 状态。Props 见上方 `BaseAsyncBtnProps`。

**行为要点:**

- 点击后置 `loading = true`，异步回调结束后复位，`loading` 期间忽略重复点击
- 传 `loadingComponent` 时展示自定义加载内容，否则应用 `loadingStyle`（默认半透明降噪）

### BaseSuspense — 异步加载界面

```tsx
import type { FetchError } from '@/store/fetch'

/** 加载状态 */
export type SuspenseState = null | 'loading' | 'done' | 'error' | 'empty'

/** 注入给 error / empty 内容组件的 props，与 @bee/page-ui 的 PageError / PageEmpty 结构一致 */
export interface SuspenseInjectProps {
  /** 状态文案 */
  tips?: string
  /** 错误态重试回调 */
  onReload?: () => void
}

export interface BaseSuspenseProps {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  /** 加载中内容 */
  loading?: ReactNode
  /** 错误内容（自动注入 tips 与 onReload） */
  error?: ReactNode
  /** 空内容（自动注入 tips） */
  empty?: ReactNode
  /** 数据获取函数；返回值仅作透传，不参与状态判断 */
  onFetch?: () => Promise<unknown> | void
}
```

**职责:** 统一处理 loading / error / empty / done 四种状态。catch 中按 `FetchError` 的标记分流——`networkError` 为真进 error 态（`message` 作为 tips），`noContent` 为真进 empty 态（`message` 作为 tips），两者皆假则把状态重置为初始值（四种内容均不显示）。

### BaseLoadMore — 加载更多

```tsx
/** 加载状态 */
export type LoadMoreState = 'loading' | 'finish' | 'fail' | null

export interface BaseLoadMoreProps {
  state: LoadMoreState
  onRetry?: () => void
  loadingText?: string
  finishText?: string
  retryText?: string
  /** 底部安全区间距，默认取 BOTTOM_SPACE */
  bottomSpace?: number
}
```

## 弹窗组件

### 弹窗注册

在 `dialogs/index.ts` 中注册弹窗（命名导出 + 类型）：

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

### 弹窗命名

弹窗标识使用 **kebab-case** 字符串: `'alert'`, `'confirm'`, `'make-card'`, `'task-list'`

### 弹窗组件编写

当多个弹窗共享相同的布局样式时，优先使用 `CommonDialog`；仅在需要自定义弹窗布局时才直接使用 `BaseDialog`（以 `AlertDialog` 为例）：

```tsx
import { Pressable, Text } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BaseDialog, type BaseDialogProps } from '@/components/base/BaseDialog'
import { closeDialog } from '@/store/modules/app/dialog'

export interface AlertDialogProps extends Omit<BaseDialogProps, 'style' | 'dialog'> {
  /** 标题 */
  title: string
  /** 描述内容 */
  desc?: string
  /** 按钮文案 */
  btnText?: string
  /** 按钮点击回调 */
  onBtnPress?: () => void
}

export const AlertDialog = ({ title, desc, btnText, onBtnPress, ...otherProps }: AlertDialogProps) => {
  const styles = useStyles(themeStyles)

  return (
    <BaseDialog style={styles.AlertDialog} dialog="alert" {...otherProps}>
      <Text style={styles.title}>{title}</Text>
      {desc && <Text style={styles.desc}>{desc}</Text>}
      <Pressable style={styles.btn} onPress={onBtnPress || (() => closeDialog())}>
        <Text style={styles.btnText}>{btnText || '我知道了'}</Text>
      </Pressable>
    </BaseDialog>
  )
}

const themeStyles = createStyles({ ... })
```

**要点:**

- 弹窗组件继承 `BaseDialogProps`，通过 `Omit<BaseDialogProps, 'style' | 'dialog'>` 剔除内置冲突字段，弹窗名 `dialog` 在组件内部固定
- `dialog` 字符串须与 `dialogs/index.ts` 注册的 key 一致，且与 `openDialog('alert', ...)` 调用一致
- 关闭回调默认走 `closeDialog()`，可在组件内覆盖（如 `ConfirmDialog` 的 `onCancelPress` / `onConfirmPress` 先 `closeDialog()` 再执行业务回调）

### BaseNav — 导航栏

```tsx
export interface BaseNavProps {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  /** 状态栏模式 */
  statusBarMode?: 'light' | 'dark'
  /** 是否透明导航 */
  navTransparent?: boolean
  navBgStyle?: StyleProp<ViewStyle>
  navTitleStyle?: StyleProp<TextStyle>
  navBackStyle?: StyleProp<ImageStyle>
  /** 导航背景内容 */
  navBg?: ReactNode
  /** 导航标题：字符串自动套用标题样式，也可传组件自定义（样式自理） */
  navTitle?: ReactNode
  /** 自定义返回按钮，默认调用 closePage() */
  navBack?: ReactNode
  /** 导航右侧内容 */
  navMore?: ReactNode
}
```

**职责:** 导航栏容器，支持滚动透明效果。当 `navTransparent={true}` 时，通过 `useScrollOffset()` 监听滚动位置，在 `[0, NAV_TOTAL_HEIGHT]` 区间内插值 opacity 从 0 到 1。同时通过 `mnb('app.setStatusBar', { mode })` 控制原生状态栏颜色（`useTheme()` 联动暗色模式）。

**标题双形态:** `navTitle` 传字符串/数字时内部用 `Text` 渲染并套用 `styles.navTitle`（可被 `navTitleStyle` 覆盖，单行截断）；传组件时原样渲染，样式与布局由组件自身负责（`navTitleStyle` 对其无效）。

```tsx
// 字符串标题：走内置标题样式
<BaseNav navTitle="我的" />

// 组件标题：自定义内容与样式
<BaseNav navTitle={<NavTitleWithAvatar />} />
```

### BaseDialog — 弹窗容器

```tsx
import type { ModalProps } from 'react-native-modal'

/** 弹窗位置 */
export type DialogPosition = 'top' | 'center' | 'bottom' | 'cover'

export interface BaseDialogProps extends Omit<Partial<ModalProps>, 'style' | 'children' | 'onBackdropPress'> {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  /** 弹窗名称，用于与弹窗配置匹配 */
  dialog: string
  /** 弹窗位置 */
  position?: DialogPosition
  /** 点击遮罩回调 */
  onBackdropPress?: () => void
}
```

**职责:** 弹窗容器，基于 react-native-modal 封装。`BaseDialogProps` 继承 `Partial<ModalProps>` 以获得所有 Modal 能力，同时剔除样式/内容/遮罩字段做自定义。

**原生手势管理:** BaseDialog 在打开时自动禁用客户端侧滑手势 (`mnb('app.disableGesture')`)，关闭时恢复。iOS 通过 `mnb('app.gestureSimultaneous')` 处理手势协同，Android 通过 `mnb('navigator.backPress')` 拦截物理返回键，`mnb('navigator.keyBackExit', { exit: false })` 禁用返回退出。

**位置变体:**

| position | 动画效果               | 适用场景           |
| -------- | ---------------------- | ------------------ |
| `center` | 缩放淡入/出            | 确认弹窗、提示     |
| `top`    | 从上滑入/出            | 顶部通知           |
| `bottom` | 从下滑入/出 + 下滑关闭 | 列表面板、操作面板 |
| `cover`  | 淡入/出                | 全屏覆盖           |

## 气泡组件

### BasePopup — 气泡浮层

```tsx
export interface BasePopupProps {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  /** 提示名称，用于与提示配置匹配 */
  popup: string
  /** 自动隐藏时长（毫秒） */
  duration?: number
}
```

**职责:** 全局轻量浮层提示。通过 `popup` 标识符管理显隐，不阻塞用户操作，无蒙层。

**工作流:**

1. 调用 `showPopup('some-popup')` 触发显示
2. `BasePopup` 检测 `popupConfigs` 中包含当前 `popup` → 淡入
3. 持续 `duration`（默认 3000ms）后自动调用 `hidePopup(popup)`
4. 淡出动画完成后卸载 DOM

**显示/隐藏方法（命名导出自 `@/store/modules/app/popup`）:**

```ts
import { showPopup, hidePopup } from '@/store/modules/app/popup'

// 显示指定 popup
showPopup('some-popup')

// 隐藏指定 popup
hidePopup('some-popup')

// 隐藏所有 popup（不传参）
hidePopup()
```

**使用示例:**

```tsx
// 1. 在页面中渲染 BasePopup
import { BasePopup } from '@/components/base/BasePopup'

export const MyPage = () => {
  return (
    <>
      {/* 其他内容 */}
      <BasePopup popup="gift-tips" duration={2000}>
        <Text>已赠送~</Text>
      </BasePopup>
    </>
  )
}

// 2. 在任意位置触发显示
import { showPopup } from '@/store/modules/app/popup'
showPopup('gift-tips')
```

**注意事项:**

- 同一 `popup` 标识重复调用 `showPopup` 不会叠加，已存在则忽略
- popup 使用全局状态管理，多个页面可共享同一标识
- 默认 `pointerEvents: 'none'`，不干扰触摸事件；`BasePage` 点击空白会调用 `hidePopup()` 自动关闭

## 交互组件

### Pressable — 点击交互

项目中点击交互优先使用 `Pressable` 组件。

```tsx
import { Pressable } from 'react-native'
;<Pressable onPress={onPress}>
  <Text>点击按钮</Text>
</Pressable>
```

## 平台特定组件

当组件在 Web 和 Native 端实现差异较大时，创建 `.web.tsx` 变体，两端导出**同名组件**：

```
components/base/BaseLottie.tsx        # Native: lottie-react-native
components/base/BaseLottie.web.tsx    # Web: lottie-react
```

```tsx
// BaseLottie.web.tsx — Web 端使用 forwardRef，内部映射到 lottie-react
export interface BaseLottieProps extends Omit<Partial<LottieOptions>, 'style' | 'autoplay'> {
  style?: StyleProp<ViewStyle>
  source?: unknown
  autoPlay?: boolean
  onAnimationFinish?: (() => void) | null
}

export const BaseLottie = forwardRef<LottieRefCurrentProps | null, BaseLottieProps>((props, ref) => { ... })
```

**两端关键映射（Native ↔ Web 差异，由 `.web` 变体内部消化）:**

| 调用方统一 prop     | Native（lottie-react-native） | Web（lottie-react） |
| ------------------- | ----------------------------- | ------------------- |
| `source`            | `source`                      | `animationData`     |
| `autoPlay`          | `autoPlay`                    | `autoplay`          |
| `onAnimationFinish` | `onAnimationFinish`           | `onComplete`        |
| `ref`               | `ref`（LottieView 实例）      | `lottieRef`         |

打包工具会自动根据平台选择对应文件，**调用方无感知**。

## 性能优化

### memo() 使用时机

仅在渲染开销大的组件上使用 `memo()`：

```tsx
import { memo, type ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

export interface CommonComplexProps {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

export const CommonComplex = memo(({ style, children }: CommonComplexProps) => {
  // 包含复杂渲染计算的组件
})
```

### Animated 原生驱动

滚动事件使用 `useNativeDriver: true`：

```tsx
const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollOffset } } }], { useNativeDriver: true })
```

> `usePage` 默认提供 JS 驱动版 `onScroll`（兼容普通 `ScrollView`）；需要更高性能时切换到 Animated 原生驱动版本，但滚动容器须替换为 `Animated.ScrollView`。详见 [自定义 Hooks](hooks.md)。

## 注意事项

1. **只用函数组件** — 不使用 class 组件
2. **Props 接口定义在文件顶部** — `export interface XxxProps`，需要时 `extends Omit<BaseProps, ...>` 复用
3. **命名导出** — 组件使用 `export const Xxx`，不使用 `export default`
4. **createStyles 放底部** — 样式定义在组件函数之后
5. **组件职责单一** — 每个组件 50-150 行，过大则拆分
6. **优先组合** — 使用组合而非继承，通过 Props 插槽传递子元素
7. **`style` prop 按需添加** — 所有组件都支持 `style`；默认写组件时不必加 `style` 参数，仅在需要让调用方自定义样式时显式声明并合并
8. **组件函数尽量只保留一个 return 语句** — 避免提前 `return null`，推荐使用 `&&` 语法 `condition && <Component />`
