# 自定义三方库：详细 API 与用法

> 这些库已加入 `rn-third-library` 仓库并完成原生改造集成。
> **存在不等于页面项目已装**——可用性仍以目标项目 package.json 为准（见 SKILL.md「核心规则」）。下面的 import 和用法来自 mf2e 实际页面项目的真实写法。
> SDK 内置三方库见 [sdk-libraries.md](sdk-libraries.md)；页面项目常用库见 [common-libraries.md](common-libraries.md)。

## 库总览

### 自定义三方库

| 库                                      | 版本    | Android | iOS | 用途                                          |
| --------------------------------------- | ------- | ------- | --- | --------------------------------------------- |
| `react-native-video`                    | 5.2.1   | ✅      | ✅  | 视频播放                                      |
| `react-native-audio-recorder-player`    | 3.6.14  | ✅      | ✅  | 录音 + 播放                                   |
| `react-native-fast-image`               | 8.6.3   | ✅      | ✅  | 高性能图片                                    |
| `react-native-color-thief`              | 0.3.4   | ✅      | ✅  | 图片取主色/调色板                             |
| `react-native-image-crop-picker`        | 0.42.0  | -       | ✅  | 选图/拍照/裁剪                                |
| `react-native-view-shot`                | 3.8.0   | ✅      | ✅  | 截图                                          |
| `@shopify/react-native-skia`            | 0.1.241 | ✅      | ✅  | 高性能 2D 绘图                                |
| `react-native-keyboard-controller`      | 1.17.5  | ✅      | ✅  | 键盘处理                                      |
| `@charmy.tech/react-native-stroke-text` | 1.2.3   | ✅      | ✅  | 文字描边                                      |

### 覆盖 SDK 内置的库

| 库                                      | 自定义版本 | Android | iOS | 覆盖的 SDK 内置  |
| --------------------------------------- | ---------- | ------- | --- | ---------------- |
| `@react-native-masked-view/masked-view` | 0.3.2      | ✅      | -   | iOS 0.2.9        |
| `react-native-webview`                  | 13.15.0    | ✅      | ✅  | 7.4.3（11.26.1） |

## 目录

- [图片与图形](#图片与图形)
  - [react-native-fast-image](#react-native-fast-image)
  - [react-native-color-thief](#react-native-color-thief)
  - [react-native-image-crop-picker](#react-native-image-crop-picker)
  - [@shopify/react-native-skia](#shopifyreact-native-skia)
  - [react-native-view-shot](#react-native-view-shot)
- [视频与音频](#视频与音频)
  - [react-native-video](#react-native-video)
  - [react-native-audio-recorder-player](#react-native-audio-recorder-player)
- [键盘](#键盘)
  - [react-native-keyboard-controller](#react-native-keyboard-controller)
- [文字](#文字)
  - [@charmy.tech/react-native-stroke-text](#charmytechreact-native-stroke-text)
- [覆盖 SDK 内置的库](#覆盖-sdk-内置的库)
  - [@react-native-masked-view/masked-view](#react-native-masked-viewmasked-view)
  - [react-native-webview](#react-native-webview)

---

## 图片与图形

### react-native-fast-image

高性能图片加载（Glide/SDWebImage 底层）。**多数页面项目未安装**，用前必查 package.json。

**项目内惯例：** 实际项目中通常不直接用它，而是用 `@mf2e/react-native-theme-styles` 封装的 `ThemeImage`（基于 FastImage，支持主题切换与图片尺寸优化）。

```tsx
import FastImage from 'react-native-fast-image'
;<FastImage source={{ uri, headers, priority: FastImage.priority.normal }} resizeMode={FastImage.resizeMode.contain} />
FastImage.preload([{ uri }])
```

**API 查询位置：** `react-native-fast-image/README.md` 的 Properties 段。

### react-native-color-thief

取图片主色/调色板，**mf2e 页面项目取色惯例**（动态渐变背景常用）。

```tsx
import RNColorThief from 'react-native-color-thief'

const color = await RNColorThief.getColor(url, 5, false) // {r,g,b} 主色
const palette = await RNColorThief.getPalette(url, 5, 10, true) // [{r,g,b}] 调色板
```

**API 查询位置：** `react-native-color-thief/README.md`（仓库无 JS 源码，只有原生代码）。

### react-native-image-crop-picker

```tsx
import ImagePicker from 'react-native-image-crop-picker'

ImagePicker.openPicker({ width: 300, height: 300, cropping: true, multiple: false }).then((image) => {
  // image.path / image.width / image.height / image.mime
})
ImagePicker.openCamera({ cropping: true })
```

注意文档标注：Android 未标 ✅（-），使用前确认目标项目支持。

**API 查询位置：** `react-native-image-crop-picker/README.md` 的 Request/Response Object 段。

### @shopify/react-native-skia

高性能 2D 绘图。**多数页面项目未安装** `@shopify/react-native-skia`，用前必查 package.json。

```tsx
import { Canvas, Circle, Fill, Group, useImage, useClock } from '@shopify/react-native-skia'
;<Canvas style={{ flex: 1 }}>
  <Circle cx={128} cy={128} r={64} color="red" />
</Canvas>
```

**API 查询位置：** 官方文档 https://shopify.github.io/react-native-skia（仓库只有原生代码 + README）。

### react-native-view-shot

截图/视图转图片，社区分享卡片高频用法。

```tsx
import ViewShot, { captureRef, captureScreen } from 'react-native-view-shot'

// 组件方式
;<ViewShot ref={rootRef} options={{ result: 'tmpfile', useRenderInContext: true }}>
  {/* 需要截图的内容 */}
</ViewShot>
rootRef.current.capture().then((uri) => share(uri))

// 命令式
const uri = await captureRef(viewRef, { format: 'jpg', quality: 0.9 })
```

**API 查询位置：** `react-native-view-shot/README.md`（含全部 options）。

## 视频与音频

### react-native-video

```tsx
import Video from 'react-native-video'
;<Video source={{ uri: videoUrl }} ref={playerRef} onBuffer={onBuffer} onError={onError} style={styles.video} />
```

**API 查询位置：** `react-native-video/Video.js` 与 README.md（Configurable props / methods 非常详尽）。

### react-native-audio-recorder-player

```tsx
import AudioRecorderPlayer from 'react-native-audio-recorder-player'

const recorder = new AudioRecorderPlayer()
await recorder.startRecorder(uri, audioSet) // 录音
recorder.addRecordBackListener((e) => e.currentPosition)
await recorder.stopRecorder()
await recorder.startPlayer(uri) // 播放
recorder.addPlayBackListener((e) => e.currentPosition)
await recorder.stopPlayer()
```

**API 查询位置：** `react-native-audio-recorder-player/index.ts`（含全部枚举）与 README.md。

## 键盘

### react-native-keyboard-controller

```tsx
import {
  KeyboardProvider,
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
  KeyboardStickyView,
  KeyboardToolbar,
} from 'react-native-keyboard-controller'

// App 根节点包裹
;<KeyboardProvider>
  <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={85}>
    <KeyboardAwareScrollView>{/* 输入内容 */}</KeyboardAwareScrollView>
  </KeyboardAvoidingView>
</KeyboardProvider>
```

**API 查询位置：** 官方文档 https://kirillzyusko.github.io/react-native-keyboard-controller/（README 明确指向此站）。

## 文字

### @charmy.tech/react-native-stroke-text

```tsx
import { StrokeText } from '@charmy.tech/react-native-stroke-text'
;<StrokeText text="标题" fontSize={20} color="#fff" strokeColor="#000" strokeWidth={2} fontFamily="..." />
// width + ellipsis + numberOfLines 支持省略号
```

**API 查询位置：** `react-native-stroke-text/README.md`（Props 表格完整）。

## 覆盖 SDK 内置的库

以下两个库同时由 SDK 内置（原生层）与 rn-third-library 自定义（更高 JS 版本）提供，页面项目实际使用**自定义版本**。

### @react-native-masked-view/masked-view

```tsx
import MaskedView from '@react-native-masked-view/masked-view'
;<MaskedView maskElement={<View style={{ backgroundColor: 'black' }} />}>
  {/* 子内容按遮罩 alpha 裁剪，常用于渐变文字 */}
</MaskedView>
```

**API 查询位置：** `react-native-masked-view/js/MaskedView.js` 与 `js/MaskedViewTypes.js`。

### react-native-webview

```tsx
import { WebView } from 'react-native-webview'
;<WebView
  source={{ uri }}
  onMessage={(e) => handleMessage(e.nativeEvent.data)}
  injectedJavaScript={script}
  ref={webviewRef}
/>
```

页面项目 JS 依赖一般装新版（`^13.15.0`）；SDK 内置另有 7.4.3(11.26.1) 原生覆盖版本，JS 用法一致。

**API 查询位置：** 官方文档 https://github.com/react-native-webview/react-native-webview/tree/master/docs。
