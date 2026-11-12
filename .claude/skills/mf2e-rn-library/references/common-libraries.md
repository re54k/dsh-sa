# 页面项目常用库：详细 API 与用法

> 这些库不属于 SDK 内置或 rn-third-library 自定义库，而是 community_rn 等页面项目**自身依赖**里普遍安装的库。
> **可用性仍以目标项目 package.json 为准**（见 SKILL.md「核心规则」）。下面的 import 和用法来自 mf2e 实际页面项目的真实写法。
> SDK 内置三方库见 [sdk-libraries.md](sdk-libraries.md)；自定义三方库见 [custom-libraries.md](custom-libraries.md)。

## 库总览

| 库                                   | 常见版本                   | 用途                                             |
| ------------------------------------ | -------------------------- | ------------------------------------------------ |
| `@bee/page-ui`                       | `^2.2.0`                   | 页面加载/空态/错误态（内部 @bee 组件库）         |
| `@bee/note-card`                     | `^2.5.0`                   | 笔记卡片（内部 @bee 组件库）                     |
| `@bee/rich-text`                     | `^0.2.5`                   | 富文本渲染（内部 @bee 组件库）                   |
| `@bee/pull-refresh`                  | `^1.0.8`                   | 下拉刷新（内部 @bee 组件库）                     |
| `@mf2e/bamboo-ui-rn`                 | `^2.1.x`                   | 通用 UI（表单体系、图片上传，内部 @mf2e 组件库） |
| `@mf2e/feed-card-rn`                 | `^2.0.x`                   | feed 流卡片（内部 @mf2e 组件库）                 |
| `@mf2e/tie-card-rn`                  | `^1.6.x`                   | 跟贴卡片（内部 @mf2e 组件库）                    |
| `@quidone/react-native-wheel-picker` | `^1.7.x`                   | 滚轮选择器                                       |
| `@music/common-tab`                  | `^0.3.8`                   | Tab 切换（云音乐内部库）                         |
| `react-native-modal`                 | `^13.0.1` / `^14.0.0-rc.1` | 弹窗                                             |
| `react-native-iphone-screen-helper`  | `2.1.2`                    | 安全区适配                                       |

## 目录

- [@bee 内部组件库](#bee-内部组件库)
  - [@bee/page-ui](#beepage-ui)
  - [@bee/note-card](#beenote-card)
  - [@bee/rich-text](#beerich-text)
  - [@bee/pull-refresh](#beepull-refresh)
- [@mf2e 内部组件库](#mf2e-内部组件库)
  - [@mf2e/bamboo-ui-rn](#mf2ebamboo-ui-rn)
  - [@mf2e/feed-card-rn](#mf2efeed-card-rn)
  - [@mf2e/tie-card-rn](#mf2etie-card-rn)
- [@quidone/react-native-wheel-picker](#quidonereact-native-wheel-picker)
- [@music/common-tab](#musiccommon-tab)
- [react-native-modal](#react-native-modal)
- [react-native-iphone-screen-helper](#react-native-iphone-screen-helper)

---

## @bee 内部组件库

`@bee/*` 是 mf2e 内部业务组件库，页面项目各自安装使用（**不在** SDK/自定义清单里）。常见的有：

### @bee/page-ui

页面通用 UI（加载/空态/错误态），16 个页面项目使用，覆盖最广。常见版本 `^2.2.0`。

```tsx
import { PageLoading, PageError, PageEmpty } from '@bee/page-ui'

<PageLoading />
<PageEmpty onPress={handleEmptyPress} />
<PageError onRetry={handleRetry} />
```

### @bee/note-card

笔记卡片 / 笔记列表组件（内部 @bee 组件库）。常见版本 `^2.5.0`。常用 **NoteList** 展示笔记瀑布流列表（内部自动用 NoteCard 渲染，`numColumns` 等 props 透传给 MasonryFlashList）：

```tsx
import { NoteList, NoteCard } from '@bee/note-card'

// 笔记瀑布流列表
<NoteList data={notes} numColumns={2} />

// 单独渲染一张笔记卡片
<NoteCard item={note} index={0} onPress={handlePress} />
```

### @bee/rich-text

富文本渲染组件（HTML 内容渲染）。常见版本 `^0.2.5`。

```tsx
import { RichText } from '@bee/rich-text'
;<RichText text={content} />
```

### @bee/pull-refresh

下拉刷新组件。常见版本 `^1.0.8`。`PullRefresh` 包裹滚动内容；**`useScrollProps()` 必须在 `PullRefresh` 的子组件内调用**（它通过 context 拿到滚动属性），再展开到 `ScrollView` / `FlashList` 上：

```tsx
import { PullRefresh, useScrollProps } from '@bee/pull-refresh'
import { FlashList } from '@shopify/flash-list'

// useScrollProps 必须在 PullRefresh 的子组件内调用（context 注入）
const ListContent = () => {
  const scrollProps = useScrollProps()
  return <FlashList data={data} renderItem={renderItem} {...scrollProps} />
}

const MyList = () => (
  <PullRefresh onRefresh={async () => '已更新 6 条新内容'}>
    <ListContent />
  </PullRefresh>
)
```

## @mf2e 内部组件库

`@mf2e/*` 是 mf2e 内部业务组件库（npm 私有包），页面项目各自安装使用（**不在** SDK/自定义清单里）。常见的有：

### @mf2e/bamboo-ui-rn

bamboo 通用 UI 组件库（最新 2.1.50）。核心能力是**表单体系**、图片与上传、骨架屏等。

```tsx
import { Form, FormInput, FormPicker, FormButton } from '@mf2e/bamboo-ui-rn'

const MyForm = () => (
  <Form onSubmit={handleSubmit}>
    <FormInput name="nickname" label="昵称" required />
    <FormPicker name="gender" label="性别" options={genderOptions} />
    <FormButton>提交</FormButton>
  </Form>
)
```

**常用 API：** 表单 `Form` / `FormInput` / `FormPicker` / `FormDatePicker` / `FormRadio` / `FormCascader` / `FormButton`（hooks `useTextInput` / `usePicker` / `useDatePicker` / `useRadio` / `useCascader`）；弹窗表单 `FormProvider` + `FormDialogContext`；图片 `ImgBox`；上传 `useUploadMedia`；其他 `LetterIndex` / `Skeleton*` / `ModalView` / `useObserver`。

### @mf2e/feed-card-rn

feed 流卡片组件库。常见版本 `^2.0.x`。主组件 `FeedCard` 渲染整条 feed 卡片。

```tsx
import { FeedCard } from '@mf2e/feed-card-rn'
;<FeedCard data={item} onPress={onPress} />
```

### @mf2e/tie-card-rn

跟贴卡片组件库。常见版本 `^1.6.x`。主组件 `TieCard` 渲染跟贴卡片。

```tsx
import { TieCard } from '@mf2e/tie-card-rn'
```

## @quidone/react-native-wheel-picker

滚轮选择器（日期/自定义选择弹窗），4 个页面项目的 CommonDialogPicker / CommonDialogDatePicker 在用。常见版本 `^1.7.x`。

**项目内惯例：** 实际项目中通常用封装的 `CommonDialogPicker`（`@/components/common/CommonDialogPicker`，已封装滚轮弹窗 UI），少直接用它。

`WheelPicker` 是默认导出组件，常配合 `withPickerControl`（HOC）、`usePickerControl`、`useOnPickerValueChangedEffect` 使用；另有开箱即用的 `DatePicker`。

```tsx
import WheelPicker, {
  withPickerControl,
  usePickerControl,
  useOnPickerValueChangedEffect,
} from '@quidone/react-native-wheel-picker'

const HocPicker = withPickerControl(WheelPicker) // 启用 pickerControl 控制能力
const ITEM_HEIGHT = 40

const DateWheel = () => {
  const control = usePickerControl()

  // 监听选中值变化（pickers 为各滚轮当前选中项）
  useOnPickerValueChangedEffect(control, ({ pickers }) => {
    // pickers[0].value / pickers[1].value ...
  })

  return (
    <HocPicker
      control={control}
      data={yearData} // PickerItem[]，如 [{ value, label }]
      itemHeight={ITEM_HEIGHT} // 每项高度
      onValueChanged={({ item, index }) => {}}
    />
  )
}
```

**说明：** `data` 传入滚轮数据项（含 `value` / `label`），`itemHeight` 控制每项高度；`usePickerControl` 返回控制句柄，配合 `withPickerControl` HOC 可精确控制多列滚轮的联动（如年/月/日三列）。

## @music/common-tab

Tab 切换组件（云音乐内部库），常见版本 `^0.3.8`。基于 `Tab.Container` + `Tab.Item` 组合使用，支持自定义 tabBar 样式、指示条和选中态动画。

**项目内惯例：** 实际项目中通常用封装的 `CommonTab`（`@/components/common/CommonTab`，已封装 tabBar 样式、指示条和 Tab.Item 遍历），少直接拼 `Tab.Container`。

```tsx
import Tab from '@music/common-tab'

const RankingTabs = () => (
  <Tab.Container
    tabBarHeight={50} // tabBar 高度
    renderTabBarItem={renderTabBarItem} // 自定义 tab 项渲染（可选）
    renderIndicator={renderIndicator} // 自定义指示条（可选）
    pagerView={{ overdrag: false }} // 透传给分页器
  >
    <Tab.Item title="榜单A">{/* 页内容 */}</Tab.Item>
    <Tab.Item title="榜单B">{/* 页内容 */}</Tab.Item>
  </Tab.Container>
)
```

**说明：** `Tab.Container` 是主容器（可配 `tabBarStyle` / `renderTabBarItem` / `renderIndicator` / `pagerView` / `preloadCount` 等），每个 `Tab.Item` 的 `title` 作为 tab 名。`renderTabBarItem` 接收 `position` / `index` / `crossClick` 等参数，可与 reanimated 的 `useAnimatedStyle` 做选中态动画。

## react-native-modal

弹窗（Modal 增强），页面项目高频使用。常见版本 `^13.0.1` / `^14.0.0-rc.1`。

**项目内惯例：** 实际项目中通常不直接用它，而是用封装的 `BaseDialog`（`@/components/base/BaseDialog`，基于 Modal + zustand store 的统一弹窗管理）。

```tsx
import Modal, { type ModalProps } from 'react-native-modal'
;<Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss} statusBarTranslucent>
  {children}
</Modal>
```

## react-native-iphone-screen-helper

安全区适配，页面项目几乎全用（**别用** safe-area-context）。用于获取刘海屏/底部安全区数值做适配。

**项目内惯例：** 实际项目中通常用 `@/utils/const` 里的 `BOTTOM_SPACE`（`export const BOTTOM_SPACE = getBottomSpace()`）做底部安全区适配。
