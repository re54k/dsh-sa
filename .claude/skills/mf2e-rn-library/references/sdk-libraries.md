# SDK 内置三方库：详细 API 与用法

> 这些库的原生层已由 SDK 集成（Android/iOS 无需再动），JS 侧 import npm 包即可。
> **可用性仍以目标项目 package.json 为准**（见 SKILL.md「核心规则」）。下面的 import 和用法来自 mf2e 实际页面项目的真实写法。
> 自定义三方库见 [custom-libraries.md](custom-libraries.md)；页面项目常用库见 [common-libraries.md](common-libraries.md)。

## 库总览

| 库                                      | JS 版本        | Android | iOS    | 用途                          |
| --------------------------------------- | -------------- | ------- | ------ | ----------------------------- |
| `react-native-reanimated`               | 3.6.4          | 2.13.0  | 2.13.0 | 动画（云音乐 fork）           |
| `react-native-gesture-handler`          | 2.14.0         | 2.8.0   | 3.0.2  | 手势                          |
| `react-native-linear-gradient`          | 2.8.3          | 2.6.2   | 3.0.5  | 渐变                          |
| `lottie-react-native`                   | 5.1.6          | 3.3.2   | 0.10.3 | Lottie 动画                   |
| `react-native-svg`                      | 11.0.1         | ✅      | ✅     | SVG 图形                      |
| `@shopify/flash-list`                   | 1.8.3          | ✅      | ✅     | 长列表/瀑布流                 |
| `react-native-pager-view`               | -              | 6.1.4   | 1.0.8  | 分页滑动                      |
| `react-native-blur`                     | -              | 3.6.1   | 3.6.3  | 模糊                          |
| `react-native-text-size`                | -              | -       | 3.0.0  | 文本测量                      |
| `@react-native-masked-view/masked-view` | -              | -       | 0.2.9  | 遮罩（自定义覆盖 0.3.2）      |
| `react-native-webview`                  | 7.4.3(11.26.1) | ✅      | -      | WebView（自定义覆盖 13.15.0） |

## 目录

- [动画](#动画)
  - [react-native-reanimated](#react-native-reanimated)
  - [lottie-react-native](#lottie-react-native)
- [手势](#手势)
  - [react-native-gesture-handler](#react-native-gesture-handler)
- [图片与图形](#图片与图形)
  - [react-native-svg](#react-native-svg)
- [列表](#列表)
  - [@shopify/flash-list](#shopifyflash-list)
- [布局与视觉](#布局与视觉)
  - [react-native-linear-gradient](#react-native-linear-gradient)
  - [react-native-blur](#react-native-blur)
  - [react-native-pager-view](#react-native-pager-view)
- [文字](#文字)
  - [react-native-text-size](#react-native-text-size)
- [跨清单库说明](#跨清单库说明)

---

## 动画

### react-native-reanimated

**项目内 import 用 `react-native-reanimated`**（babel 别名映射到云音乐 fork `@music/react-native-reanimated` 版本 `3.6.4`）。**不要**直接写 `@music/react-native-reanimated`。

**babel 配置（必做）：**
1. 在 `babel.config.js` 的 `plugins` **末尾**添加 `'@music/react-native-reanimated/plugin'`（reanimated 的 babel plugin 必须在插件列表最后，否则运行时报错）
2. 在 `module-resolver` 的 `alias` 中配置 `'react-native-reanimated': '@music/react-native-reanimated'`（代码写官方包名也会实际使用云音乐 fork，无需改 import 写法）

**tsconfig 配置（必做）：** 在 `tsconfig.json` 的 `compilerOptions.paths` 中配置 `"react-native-reanimated": ["./node_modules/@music/react-native-reanimated"]`，让 TypeScript 也能解析到云音乐 fork 的类型（否则 TS 报「找不到模块 react-native-reanimated」）。其它 path 按项目原有配置保留。

```tsx
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated'

const sv = useSharedValue(0)
const animStyle = useAnimatedStyle(() => ({ opacity: sv.value }))
return <Animated.View style={[styles.nav, animStyle]}>{children}</Animated.View>
```

**API 查询位置：** Reanimated 官方文档（https://docs.swmansion.com/react-native-reanimated/）；与云音乐 fork API 一致。

### lottie-react-native

```tsx
import LottieView, { type AnimatedLottieViewProps } from 'lottie-react-native'

;<LottieView source={data} onAnimationFinish={onComplete} loop={false} autoPlay />
const animation = useRef<LottieView>(null)
```

**API 查询位置：** `lottie-react-native` 官方文档；README 自带 Props 表。

## 手势

### react-native-gesture-handler

```tsx
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler'

const pan = Gesture.Pan().onUpdate((e) => {
  /* ... */
})
return (
  <GestureDetector gesture={pan}>
    <View />
  </GestureDetector>
)
```

**API 查询位置：** Gesture Handler 官方文档（https://docs.swmansion.com/react-native-gesture-handler/）。

## 图片与图形

### react-native-svg

```tsx
import Svg, { Path, Circle, Rect, Defs, G, LinearGradient as SvgGradient } from 'react-native-svg'

;<Svg width="24" height="24">
  <Circle cx="12" cy="12" r="10" fill="red" />
</Svg>
```

**API 查询位置：** `react-native-svg` 官方文档。

> 高性能图片（FastImage）、取色（color-thief）、Skia 绘图、view-shot 截图、masked-view 遮罩等图片类**自定义**库，见 [custom-libraries.md](custom-libraries.md)。

## 列表

### @shopify/flash-list

```tsx
import { FlashList, type ListRenderItem } from '@shopify/flash-list'
import { MasonryFlashList } from '@shopify/flash-list' // 瀑布流
import { AnimatedFlashList } from '@shopify/flash-list' // 带动画

;<FlashList
  data={data}
  renderItem={({ item }) => <SongItem item={item} />}
  estimatedItemSize={68} // 必须给，否则性能差/报错
/>
```

**API 查询位置：** `@shopify/flash-list` 官方文档。

## 布局与视觉

### react-native-linear-gradient

```tsx
import LinearGradient from 'react-native-linear-gradient'

;<LinearGradient colors={['#4c669f', '#3b5998']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.CommonBg}>
  {children}
</LinearGradient>
// mf2e 惯例：colors 常直接取自 theme-styles（styles.CommonBg.backgroundColors）
```

**API 查询位置：** `react-native-linear-gradient` 官方文档。

### react-native-blur

```tsx
import { BlurView } from 'react-native-blur' // 或按项目实际导出的组件名
```

**注意：** 多数页面项目**未安装** blur 相关库，用前必查 package.json。

**API 查询位置：** `react-native-blur` 官方文档 / 仓库源码。

### react-native-pager-view

```tsx
import PagerView from 'react-native-pager-view'

;<PagerView style={{ flex: 1 }} initialPage={0} onPageSelected={(e) => e.nativeEvent.position}>
  <View key="1" />
  <View key="2" />
</PagerView>
```

**API 查询位置：** `react-native-pager-view` 官方文档。

## 文字

### react-native-text-size

文本测量（原生层计算文本尺寸），仅在需要精确测量文本时用。

```tsx
import TextSize from 'react-native-text-size'
const sizes = await TextSize.measure({ text, fontSize, fontFamily })
```

**API 查询位置：** `react-native-text-size` 官方文档（iOS 3.0.0）。

## 跨清单库说明

`react-native-webview` 与 `@react-native-masked-view/masked-view` 同时由 SDK 内置（原生层）与 rn-third-library 自定义（更高 JS 版本）提供，页面项目使用自定义版本。**页面代码里的 JS 用法见 [custom-libraries.md](custom-libraries.md) 的「覆盖 SDK 内置的库」分组**。
