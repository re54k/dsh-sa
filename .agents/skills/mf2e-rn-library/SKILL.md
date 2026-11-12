---
name: mf2e-rn-library
description: 'Mf2e 网易传媒 RN 跨端项目开发时必须参考的功能库使用指南。覆盖 SDK 内置与自定义的全部 RN 三方库（reanimated、gesture-handler、linear-gradient、flash-list、lottie、svg、video、audio-recorder、skia、webview、keyboard-controller、image-crop-picker、view-shot、color-thief、stroke-text、pager-view 等）及页面项目常用内部组件库（@bee/*、@mf2e/* 等），给出每个库的用途、版本、Android/iOS 支持、真实 import 路径、典型用法、项目内封装惯例与常见坑。每当开发 mf2e 的 RN 页面需要动画、手势、图片加载/取色/裁剪/截图、视频音频、键盘处理、富文本渲染、表单、选图、WebView、列表/瀑布流、渐变、模糊、文字描边、feed 流卡片、跟贴卡片、笔记列表、下拉刷新、Tab 切换、滚轮选择器、弹窗、安全区适配等任何功能库能力，或不确定某个库是否可用、该用哪个包名/版本、怎么 import、项目内该用哪个封装时，务必使用本技能。'
metadata:
  version: 1.0.2
---
# Mf2e RN 功能库使用指南

在 mf2e 的 RN 跨端项目里开发页面时，能用的功能库是**有限且固定的**——不能随手 `npm i` 一个库就完事。它们分三类：**SDK 内置**（原生层已集成）、**`rn-third-library` 自定义**（原生已改造）、**页面项目自身依赖**（`@bee/*`、`@mf2e/*` 等内部组件库）。范围内的库若项目未装，按本技能给出的已知版本安装后即可使用；不在这些范围内的库原生层不会链接，直接 import 会报错。本技能帮你快速判断"这个需求该用哪个已就绪的库、怎么正确引用"。

## 什么时候用

- 写 RN 页面/组件/弹窗时，需要任何功能库能力（图片、视频、音频、动画、手势、键盘、富文本、表单、选图、WebView、列表、渐变、模糊、描边、截图、取色、feed 流卡片、跟贴卡片、笔记列表、下拉刷新、Tab 切换等）
- 不确定某个功能库在 mf2e 环境里可不可用、用哪个包名、怎么 import
- 看到代码里 import 了一个功能库，想确认它是否合理、有没有替代

## 核心规则：用前必查目标项目的 package.json

这是整个技能最重要的一条。**个别库有固定包名规范（reanimated 项目内用 `react-native-reanimated`，babel 别名到云音乐 fork，见下方"常见坑"），且每个页面项目实际安装的三方库各不相同**。写代码之前，必须先打开你要改的那个项目的 `package.json`（以及 `yarn.lock`/`package-lock.json`），确认三件事：

1. **这个库装了没有？** 没装的话先按本技能给出的已知版本安装（`npm i <库>@<版本>`），装完即可 import；直接 import 未装的库会因原生层没链接而报错。`rn-third-library` 里有、SDK 里有的库，不等于每个页面项目都装了。
2. **用哪个包名？** 个别库有固定包名规范（reanimated 项目内用 `react-native-reanimated`，babel 别名到云音乐 fork，见下方"常见坑"）；其余库以项目 `package.json` 里实际声明的包名为准。
3. **版本号对不对？** import 后按项目里的版本使用 API，别拿其他版本的习惯写。

## 快速决策：能力 → 候选库

遇到需求时，先按能力找候选库，再回项目 package.json 验证，最后看详细条目：SDK 内置库见 [references/sdk-libraries.md](references/sdk-libraries.md)，自定义库见 [references/custom-libraries.md](references/custom-libraries.md)，页面项目常用库见 [references/common-libraries.md](references/common-libraries.md)。

### SDK 内置三方库

| 需求能力                    | 候选库                                  | 说明                                         |
| --------------------------- | --------------------------------------- | -------------------------------------------- |
| 动画（值驱动 / 手势驱动）   | `react-native-reanimated`               | babel 别名映射到云音乐 fork（@music/ 3.6.4） |
| Lottie 动画                 | `lottie-react-native`                   |                                              |
| 手势（拖动/缩放/旋转）      | `react-native-gesture-handler`          |                                              |
| SVG 图形                    | `react-native-svg`                      |                                              |
| 长列表 / 瀑布流             | `@shopify/flash-list`                   |                                              |
| 渐变背景                    | `react-native-linear-gradient`          |                                              |
| 模糊背景                    | `react-native-blur`                     |                                              |
| 左右滑动分页（Banner/轮播） | `react-native-pager-view`               |                                              |
| 文本测量                    | `react-native-text-size`                |                                              |
| 遮罩裁剪（渐变文字等）      | `@react-native-masked-view/masked-view` | 自定义覆盖 SDK 版本                          |
| 内嵌网页 / JS 双向通信      | `react-native-webview`                  | 自定义覆盖 SDK 版本                          |

### 自定义三方库（rn-third-library）

| 需求能力                           | 候选库                                  | 说明                                      |
| ---------------------------------- | --------------------------------------- | ----------------------------------------- |
| 高性能图片加载                     | `react-native-fast-image`               |                                           |
| 图片取色（动态渐变背景）           | `react-native-color-thief`              | mf2e 页面项目取色惯例                     |
| 选图 / 拍照 / 裁剪                 | `react-native-image-crop-picker`        |                                           |
| 图片缩放查看 / 涂鸦画布 / 复杂图形 | `@shopify/react-native-skia`            |                                           |
| 截图 / 视图转图片                  | `react-native-view-shot`                | 分享卡片高频用法                          |
| 视频播放                           | `react-native-video`                    |                                           |
| 录音                               | `react-native-audio-recorder-player`    |                                           |
| 键盘处理（避让/粘附）              | `react-native-keyboard-controller`      |                                           |
| 文字描边                           | `@charmy.tech/react-native-stroke-text` | 注意包名，不是 `react-native-stroke-text` |

### 页面项目常用库（自身依赖）

| 需求能力             | 候选库                               | 说明                                                     |
| -------------------- | ------------------------------------ | -------------------------------------------------------- |
| 页面加载/空态/错误态 | `@bee/page-ui`                       | 内部 @bee 组件库                                         |
| 笔记卡片             | `@bee/note-card`                     | 内部 @bee 组件库                                         |
| 下拉刷新             | `@bee/pull-refresh`                  | 内部 @bee 组件库                                         |
| 富文本渲染           | `@bee/rich-text`                     | 内部 @bee 组件库                                         |
| 表单 / 通用 UI       | `@mf2e/bamboo-ui-rn`                 | 内部 @mf2e 组件库（表单体系、图片上传等）                |
| feed 流卡片          | `@mf2e/feed-card-rn`                 | 内部 @mf2e 组件库                                        |
| 跟贴卡片             | `@mf2e/tie-card-rn`                  | 内部 @mf2e 组件库                                        |
| Tab 切换             | `@music/common-tab`                  | 云音乐内部库                                             |
| 滚轮选择器           | `@quidone/react-native-wheel-picker` |                                                          |
| 弹窗（Modal 增强）   | `react-native-modal`                 |                                                          |
| 安全区适配           | `react-native-iphone-screen-helper`  | 页面项目几乎都用它做安全区，**不要**用 safe-area-context |

## 三方库全景

完整的库清单（版本 / Android / iOS 支持矩阵）在三个 reference 文件里：

- **SDK 内置三方库**（原生层已集成）：[references/sdk-libraries.md](references/sdk-libraries.md)
- **自定义三方库**（rn-third-library 仓库）：[references/custom-libraries.md](references/custom-libraries.md)
- **页面项目常用库**（页面项目自身依赖）：[references/common-libraries.md](references/common-libraries.md)

> ⚠️ 每个页面项目实际安装的三方库各不相同，**使用任何库前都必须查目标项目的 package.json**。

## 常见坑（务必注意）

1. **Reanimated 项目内用 `react-native-reanimated`**：babel 别名把它映射到云音乐 fork `@music/react-native-reanimated`（版本 3.6.4），**不要**直接写 `@music/react-native-reanimated`。API 与官方一致（`Animated` / `useSharedValue` / `useAnimatedStyle` / `withTiming` / `Easing` / `runOnJS`）。**记得 babel 与 tsconfig 两处别名都要配**（`babel.config.js` 的 plugin + module-resolver alias、`tsconfig.json` 的 `paths` 映射到 `@music/react-native-reanimated`），详见 [references/sdk-libraries.md](references/sdk-libraries.md) 的 react-native-reanimated 条目。
2. **Stroke Text 包名特殊**：是 `@charmy.tech/react-native-stroke-text`，不是 `react-native-stroke-text`。
3. **`@bee/pull-refresh` 的 `useScrollProps()` 必须在 `PullRefresh` 子组件内调用**：它通过 context 注入滚动属性，在 PullRefresh 外部调用拿不到，滚动监听会失效。
4. **笔记列表用 `@bee/note-card` 的 `NoteList`**：`NoteList` 内部自动用 `NoteCard` 渲染瀑布流（`numColumns` 等透传），不要手动逐个拼 `NoteCard`。
5. **用前检查库是否安装**：用任何三方库前先确认目标项目 package.json 里已装；**没装就按本技能给出的已知版本安装**（`npm i <库>@<版本>`）后再 import，不要直接 import 未装的库（原生层没链接会报错）。
6. **优先用项目封装，别直接裸用底层库**：实际项目中 `react-native-modal` → `BaseDialog`、`@music/common-tab` → `CommonTab`、`@quidone/react-native-wheel-picker` → `CommonDialogPicker`、`react-native-fast-image` → `ThemeImage`、安全区 → `BOTTOM_SPACE`（详见 [references/common-libraries.md](references/common-libraries.md) 各库的「项目内惯例」）。

## 详细 API 与用法

每个库的 import 语句、典型用法片段、API 查询位置见三个 reference 文件：SDK 内置库 [references/sdk-libraries.md](references/sdk-libraries.md)、自定义库 [references/custom-libraries.md](references/custom-libraries.md)、页面项目常用库 [references/common-libraries.md](references/common-libraries.md)。需要某个库的 Props/方法细节时，去翻该库的 README 或官方文档（很多库的 README 自带完整 API）。