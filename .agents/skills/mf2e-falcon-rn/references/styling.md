# 样式与主题规范（TypeScript）

## 目录

- [主题样式系统](#主题样式系统)
- [样式定义位置](#样式定义位置)
- [ThemeImage 组件](#themeimage-组件)
- [渐变样式](#渐变样式)
- [响应式适配](#响应式适配)
- [安全区域](#安全区域)
- [字体处理](#字体处理)
- [平台特定样式](#平台特定样式)
- [注意事项](#注意事项)

## 主题样式系统

使用 `@mf2e/react-native-theme-styles` 库实现主题感知样式。

### createStyles — 定义样式

```ts
import { createStyles } from '@mf2e/react-native-theme-styles'

const themeStyles = createStyles({
  // 根样式名与组件名一致
  ComponentName: {
    flex: 1,
    backgroundColor: '#FFF489',
  },
  // 子元素样式
  header: {
    height: 44,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
})
```

### useStyles — 使用样式

**默认写法不带 `style` 参数**：组件样式自闭管理；当存在"需要由调用方覆盖/补充样式"的合理场景时，再显式接收 `style` 并通过数组合并。`style` 是所有组件都开放的能力，只是写组件时**按需添加**，而非强制声明。

```tsx
// 默认写法 — 无需 style 参数
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'

export const MyComponent = () => {
  const styles = useStyles(themeStyles)

  return (
    <View style={styles.ComponentName}>
      <View style={styles.header}>
        <Text style={styles.title}>标题</Text>
      </View>
    </View>
  )
}

const themeStyles = createStyles({ ... })
```

```tsx
// 需要外部自定义样式时 — 显式接收 style 并合并
export interface MyComponentProps {
  style?: StyleProp<ViewStyle>
}

export const MyComponent = ({ style }: MyComponentProps) => {
  const styles = useStyles(themeStyles)

  return <View style={[styles.ComponentName, style]}>{/* ... */}</View>
}
```

### 完整组件结构示例

```tsx
import type { CustomAnimation } from 'react-native-animatable'
import { View, Text } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'

export const MyComponent = () => {
  const styles = useStyles(themeStyles)

  return (
    <View style={styles.MyComponent}>
      <Text style={styles.title}>内容</Text>
    </View>
  )
}

const themeStyles = createStyles({
  MyComponent: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#333',
  },
})
```

**关键点:**
- `createStyles` 定义在组件函数之后、文件底部；`useStyles` 在组件函数内顶部调用
- 根样式名与组件名一致（如 `MyComponent`）
- 弹窗动画使用对象形式（含 `scale`）时，`animationIn` / `animationOut` 需 `as CustomAnimation` 断言（RN 样式类型过窄）

## 样式定义位置

`createStyles` 必须定义在**组件函数之后、文件底部**：

```tsx
// 正确
export const MyComponent = () => { ... }

const themeStyles = createStyles({ ... })

// 错误 — 不要在组件内部定义
export const MyComponent = () => {
  const themeStyles = createStyles({ ... })  // ❌
}
```

## ThemeImage 组件

使用 `ThemeImage` 替代 `Image` 实现主题感知图片：

```tsx
import { createStyles, useStyles, ThemeImage } from '@mf2e/react-native-theme-styles'
import { Assets } from '@/assets'

export const MyComponent = () => {
  const styles = useStyles(themeStyles)
  return <ThemeImage style={styles.bg} source={Assets.commonBg} />
}
```

## 渐变样式

使用 `react-native-linear-gradient` 实现渐变。`colors` 写在 `createStyles` 样式中，通过 `styles.xxx.colors` 引用；`start` / `end` 写在 JSX 上。

**规则：**

- **`colors` 写在 style 里** — 渐变颜色作为样式属性统一管理，方便主题切换
- **`start` / `end` 写在 JSX 里** — 渐变方向属于布局行为，不属于主题可变值
- **不要在 JSX 中硬编码** `colors={['#FF2A0E', '#FF599C']}`

```tsx
// ✅ 正确 — style 第一位，colors 通过 styles 引用
<LinearGradient style={styles.badge} colors={styles.badge.colors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />

// ❌ 错误 — colors 硬编码在 JSX 中
<LinearGradient style={styles.badge} colors={['#FF2A0E', '#FF599C']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />
```

### 完整示例

```tsx
import { View, Text } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import LinearGradient from 'react-native-linear-gradient'

export const CardPanel = () => {
  const styles = useStyles(themeStyles)

  return (
    <LinearGradient
      style={styles.CardPanel}
      colors={styles.CardPanel.colors}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <LinearGradient style={styles.badge} colors={styles.badge.colors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}>
        <Text style={styles.badgeText}>标签</Text>
      </LinearGradient>
    </LinearGradient>
  )
}

const themeStyles = createStyles({
  CardPanel: {
    colors: ['#FFFFFF', '#FFFAD4'],
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
  },
  badge: {
    colors: ['#FF2A0E', '#FF599C'],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
})
```

## 响应式适配

以 **375px** 为设计稿基准宽度，提供两种适配方案。项目根据需要选择其一。

### 方案1：无缩放适配（默认）

不添加任何缩放处理，所有尺寸直接按 375px 设计稿的数值编写。通过 Flexbox 弹性布局 + 百分比宽度自然适配不同屏幕。

**布局原则：**

- **宽度**：优先使用 `flex: 1`、百分比（`width: '48.5%'`）或 `alignSelf: 'stretch'` 让容器自适应，避免写死固定宽度
- **铺满屏幕宽度**：需要自适应屏幕宽度的元素（如背景图、头图、全宽容器），必须设置 `width: '100%'`
- **固定宽度**：仅对图标、头像等小元素使用固定 px 值（如 `width: 24`）
- **间距**：`padding`、`margin` 直接使用设计稿数值，不做换算
- **字号**：`fontSize` 直接使用设计稿数值
- **高度**：可以使用固定 px 值或 `aspectRatio` 保持宽高比

**示例：**

```ts
const themeStyles = createStyles({
  // ✅ 容器用 flex 自适应
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  // ✅ 网格用百分比宽度
  gridItem: {
    width: '48.5%',
    marginBottom: 5,
  },
  // ✅ 图标用固定尺寸
  icon: {
    width: 24,
    height: 24,
  },
  // ✅ 卡片用 flex 撑满
  card: {
    borderRadius: 16,
    padding: 12,
  },
  // ✅ 头图/背景图 — 宽度铺满 + aspectRatio 保持比例
  headerPanel: {
    width: '100%',
    aspectRatio: 375 / 306, // 设计稿宽高比
    position: 'relative',
  },
  // ✅ 背景图 — 绝对定位铺满父容器
  headerBg: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%', // 必须显式设置，不能仅靠 left/right 撑宽
    height: '100%',
  },
})
```

**BasePage 无特殊处理：**

```tsx
// BasePage 内部
<View style={styles.main}>{main}</View>
```

### 方案2：useAdapter 等比缩放

以 **375px** 为设计稿基准宽度，通过 `transform: scale` 实现等比缩放。所有尺寸按 375px 设计稿数值编写，由外层容器统一缩放。

```tsx
import { useAdapter } from '@/uses/useAdapter'

export const MyPage = () => {
  const { adapterScale, adapterStyle, onLayout } = useAdapter()

  return (
    <View onLayout={onLayout}>
      <View style={adapterStyle}>{/* 内容按 375px 宽度设计，自动缩放 */}</View>
    </View>
  )
}
```

**适配原理：**

```ts
const designWidth = 375

// adapterStyle 计算 (类型为 ViewStyle):
{
  width: designWidth,                    // 固定 375
  height: designWidth * aspectRatio,     // 按屏幕比例
  transform: [
    { translateX: -width / 2 },          // 移到原点
    { translateY: -height / 2 },
    { scale: screenWidth / designWidth }, // 等比缩放
    { translateX: width / 2 },           // 移回位置
    { translateY: height / 2 },
  ],
}
```

> `useAdapter` 返回类型为 `UseAdapterReturn`（`adapterScale` / `adapterStyle: ViewStyle` / `onLayout`），`adapterStyle` 通过 `useMemo<ViewStyle>` 标注类型。详见 [自定义 Hooks](hooks.md#useadapter--响应式缩放)。

## 安全区域

使用 `BOTTOM_SPACE` 处理底部安全区域，`NAV_TOTAL_HEIGHT` / `STATUS_BAR_HEIGHT` / `NAV_BAR_HEIGHT` 处理顶部导航安全区域：

```ts
import { BOTTOM_SPACE } from '@/utils/const'

const themeStyles = createStyles({
  container: {
    paddingBottom: BOTTOM_SPACE,
  },
})
```

常量定义（示意）：

```ts
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

## 字体处理

### withFontScale HOC

在入口文件中使用 `withFontScale` 包裹 App 组件，处理系统字体缩放：

```tsx
// index.js
import { withFontScale } from '@/utils/font'
AppRegistry.registerComponent(__DEV__ ? app.name : app.splitName, () => withFontScale(App))
```

**内部行为:**

- 监听 `mnb.on('app.changeFontScale')` 动态响应系统字体大小变化，更新全局 `appEnv.fontScale`
- 通过 `FontScaleContext` 提供 `fontScale`，依赖字体缩放的组件（如 FlashList、memo 组件）调用 `useFontScaleChange()` 订阅并触发重渲染
- 全局劫持 `Text` / `TextInput` 的 render，统一处理 `allowFontScaling` / `maxFontSizeMultiplier` 与缩放样式

```tsx
// 依赖 fontScale 的组件（如列表 item）
import { useFontScaleChange } from '@/utils/font'

export const SomeItem = () => {
  const fontScale = useFontScaleChange()
  return <Text style={{ fontSize: 14 * fontScale }}>...</Text>
}
```

### Android 字体修正

Android 平台自动应用以下修正：

- `includeFontPadding: false` — 移除额外字体内边距
- `textAlignVertical: 'center'` — 垂直居中
- 边框 padding 修正（`borderRightWidth: 2` 透明边框解决末字符裁切）

## 平台特定样式

通过 `Platform.OS` 进行条件样式：

```ts
import { Platform } from 'react-native'

const themeStyles = createStyles({
  container: {
    // 跨平台通用样式
    flex: 1,
  },
})

// 组件内
export const Component = () => {
  const styles = useStyles(themeStyles)
  return <View style={[styles.container, Platform.OS === 'android' && { elevation: 4 }]} />
}
```

## RN 不支持的样式属性（禁止使用）

> **重要：** React Native 的样式系统基于 Yoga 引擎，**不是浏览器 CSS**。以下列出的属性和写法在 RN 中**不可用**，使用它们会导致样式失效、运行时报错或页面白屏。
>
> **编写样式前，请先确认没有使用以下禁止属性。**

以下 CSS 属性在 React Native 中 **不可使用**，必须使用对应的替代方案：

### gap

RN 不支持 `gap`，用 `margin` 替代。

```ts
// ❌ gap
container: { flexDirection: 'row', gap: 7 },

// ✅ 横向列表用 marginRight，纵向列表用 marginTop
item: { marginRight: 7 },
```

### background-image / background-gradient

RN 不支持 CSS 背景渐变，使用 `react-native-linear-gradient` 替代（参见[渐变样式](#渐变样式)）。

```ts
// ❌ RN 不支持
container: { backgroundImage: 'linear-gradient(#fff, #000)' },

// ✅ 使用 LinearGradient 组件
<LinearGradient colors={styles.container.colors} style={styles.container} />
```

### box-shadow

RN 的阴影在 iOS 和 Android 上实现不同，不支持 CSS `box-shadow` 语法。

```ts
// ❌ RN 不支持
container: { boxShadow: '0px 4px 8px rgba(0,0,0,0.1)' },

// ✅ iOS 使用 shadow 系列属性
container: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
},

// ✅ Android 使用 elevation
container: { elevation: 4 },
```

### transition / animation

RN 不支持 CSS transition 和 animation，使用 `Animated` API 或 `react-native-reanimated`。

### display

RN 只支持 `flex` 和 `none`，不支持 `block`、`inline`、`inline-block`、`grid` 等。

```ts
// ❌ RN 不支持
container: { display: 'grid' },
container: { display: 'inline-block' },

// ✅ 只能用 flex 或 none
container: { display: 'flex' },  // 默认值，可省略
container: { display: 'none' },
```

### position

RN 只支持 `relative`（默认）和 `absolute`，不支持 `fixed`、`sticky`。

### overflow

RN 中 `overflow` 只支持 `visible`、`hidden`、`scroll`，不支持 `auto`。且 Android 上 `overflow: 'visible'` 在某些场景不生效。

### 百分比限制

`margin`、`padding` 的百分比值只基于父容器**宽度**（非高度）。`transform` 不支持百分比，需用具体数值。

### 其他不支持的属性

| ❌ 禁止使用的 CSS 属性       | ✅ RN 替代方案                                                          |
| ---------------------------- | ----------------------------------------------------------------------- |
| `float`                      | 使用 `flexDirection: 'row'` 布局                                        |
| `z-index`                    | 仅在同级兄弟元素间生效，不支持跨层级                                    |
| `cursor`                     | RN 无此属性，使用 `Pressable` 处理交互                                  |
| `text-decoration`            | 使用 `textDecorationLine`、`textDecorationColor`、`textDecorationStyle` |
| `word-break` / `white-space` | 使用 `numberOfLines` 和 `ellipsizeMode` 控制文本截断                    |
| `calc()`                     | 不支持，需在 JS 中计算                                                  |

> **⚠️ 总结：生成样式代码时，请逐条对照以上列表自查。出现禁止属性的代码需替换为对应的 RN 方案。**

## 注意事项

1. **`style` prop 按需添加** — 所有组件都支持 `style`；默认写组件时不必加 `style` 参数，需要让调用方自定义样式时再显式声明，且放在 Props 第一位，类型用 `StyleProp<ViewStyle>`（图片 `ImageStyle`、文字 `TextStyle`）
2. **禁止使用 RN 不支持的样式属性** — 参见 [RN 不支持的样式属性](#rn-不支持的样式属性禁止使用)，`gap`、`box-shadow`、`display: grid`、`position: fixed`、`background-image`、`calc()` 等 CSS-only 属性在 RN 中不可用，必须替换为对应方案
3. **始终使用 createStyles/useStyles** — 不直接使用 `StyleSheet.create`
4. **样式放底部** — `createStyles` 定义在组件之后
5. **接收 `style` 时用数组合并** — `style={[styles.base, style]}` 支持外部覆盖
6. **设计稿基准 375px** — 所有尺寸按 375px 设计稿编写
7. **颜色使用十六进制** — 如 `#FFF489`，透明色用 `#FFF48980`
8. **避免内联样式** — 静态样式提取到 `createStyles` 中
