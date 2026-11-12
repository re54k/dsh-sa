# 自定义 Hooks 规范（TypeScript）

## 目录

- [概述](#概述)
- [Context-based Hook 模式](#context-based-hook-模式)
- [常用 Hooks](#常用-hooks)
- [其他内置 Hooks](#其他内置-hooks)
- [平台特定 Hooks](#平台特定-hooks)
- [注意事项](#注意事项)

## 概述

自定义 Hooks 位于 `src/uses/` 目录，命名规则为 `use{Name}.ts(x)` (camelCase)。

**核心设计原则:**

- 从组件中提取可复用的状态逻辑
- 使用 Context 实现跨组件数据共享
- 平台差异通过 `.web.ts` 文件分离
- **命名导出 + 显式返回类型**：`export const useXxx = (): UseXxxReturn => { ... }`，返回类型用 `interface` / `type` 定义并导出
- 无 JSX 的 Hook 用 `.ts`（如 `usePage.ts`），含 JSX 的 Hook 用 `.tsx`（如 `useLoadMore.tsx`）

## Context-based Hook 模式

项目中最重要的 Hook 模式：主 Hook 创建数据 + Context 传递 + consumer Hooks 消费。

### 典型示例: usePage

页面滚动状态 Hook，返回 `scrollOffset` 与 `scrollProps`（可直接透传给 ScrollView / FlashList）：

```ts
/** 滚动容器（ScrollView / FlashList）通用接口 */
interface ScrollTarget {
  scrollTo?: (options: { y: number; animated?: boolean }) => void
  scrollToOffset?: (options: { offset: number; animated?: boolean }) => void
}

/** 页面滚动交互返回的滚动 props */
type ScrollProps = Pick<ScrollViewProps, 'onScroll' | 'scrollEventThrottle' | 'bounces'> & {
  ref: RefObject<ScrollTarget | null>
}

export interface UsePageReturn {
  /** 滚动偏移量（Animated.Value），供导航透明渐变等插值动画使用 */
  scrollOffset: Animated.Value
  scrollProps: ScrollProps
}

export const usePage = (): UsePageReturn => { ... }

export const PageContext = createContext<UsePageReturn | undefined>(undefined)

// consumer：判空后 throw，避免未包裹 Provider 时静默出错
export const useScrollOffset = (): Animated.Value => { ... }
export const useScrollProps = (): ScrollProps => { ... }
```

**核心要点:**

- `scrollOffset` 在 `onScroll` 中 `setValue(contentOffset.y)`，供 `BaseNav` 等插值透明度使用
- `bounces` 仅在跨过阈值（50px）时才 `setState`，避免高频滚动触发无谓重渲染
- 需要更高性能时，`onScroll` 可切换为 `Animated.event(..., { useNativeDriver: true })`，但滚动容器须替换为 `Animated.ScrollView`
- `ScrollTarget` 接口收敛 ScrollView / FlashList 两种容器的滚动方法差异，`ScrollProps` 通过 `Pick<ScrollViewProps, ...>` 派生保持与官方同步

**Provider 在 BasePage 中注入:**

```tsx
// components/base/BasePage.tsx
import { usePage, PageContext } from '@/uses/usePage'

export const BasePage = ({ nav, main }: BasePageProps) => {
  const { scrollOffset, scrollProps } = usePage()

  return (
    <PageContext.Provider value={{ scrollOffset, scrollProps }}>
      {nav}
      <View>{main}</View>
    </PageContext.Provider>
  )
}
```

**模式要点（TS 增强）:**

1. `createContext<UsePageReturn | undefined>(undefined)` — 明确 Context 值类型
2. consumer 通过 `useContext` 取值后**判空并 throw**，避免未包裹 Provider 时静默 `undefined` 导致运行时错误
3. `ScrollTarget` 接口收敛 ScrollView / FlashList 两种滚动容器的差异，通过 `Pick<ScrollViewProps, ...>` 派生滚动 props 类型保持与官方同步

### 相同模式: useDialog

弹窗滚动逻辑的 Context 模式，仅向下游暴露 `scrollProps`：

```ts
export interface UseDialogReturn {
  /** 是否把下滑手势传给底层列表（列表在顶部时用于触发下拉关闭） */
  propagateSwipe: PropagateSwipe
  scrollProps: ScrollProps
  /** 仅 Android 需要，其余平台为 null（接管手势驱动列表滚动） */
  scrollResponder: PanResponderInstance | null
}

export const useDialog = (): UseDialogReturn => { ... }

export const DialogContext = createContext<Pick<UseDialogReturn, 'scrollProps'> | undefined>(undefined)

// consumer：判空后 throw
export const useScrollProps = (): ScrollProps => { ... }
```

**核心要点:**

- 弹窗内列表滚动到顶部后继续上滑（或顶部下拉），由弹窗手势接管，实现「下拉关闭 / 惯性滚动」
- Android 通过 `PanResponder` + `Animated.decay` 实现惯性滚动（`useNativeDriver: false`，保证 `addListener` 每帧稳定回调）
- 向下游仅暴露 `scrollProps`，屏蔽 `propagateSwipe` / `scrollResponder` 等实现细节

## 常用 Hooks

### useAdapter — 响应式缩放

基于 375px 设计稿宽度进行页面等比缩放适配：

```ts
export interface UseAdapterReturn {
  /** 缩放比例 */
  adapterScale: number
  /** 适配样式（固定 375 宽 + transform 缩放居中） */
  adapterStyle: ViewStyle
  /** 容器布局回调 */
  onLayout: (e: LayoutChangeEvent) => void
}

export const useAdapter = (): UseAdapterReturn => { ... }
```

**适配原理（adapterStyle 计算）:**

```ts
// designWidth = 375，aspectRatio = 容器高 / 宽，adapterScale = 容器宽 / 375
const adapterStyle = {
  width: 375,
  height: 375 * aspectRatio,
  transform: [
    { translateX: -375 / 2 },
    { translateY: -(375 * aspectRatio) / 2 },
    { scale: adapterScale }, // 等比缩放
    { translateX: 375 / 2 },
    { translateY: (375 * aspectRatio) / 2 },
  ],
}
```

**使用方式:**

```tsx
const { adapterStyle, onLayout } = useAdapter()
return (
  <View onLayout={onLayout}>
    <View style={adapterStyle}>{children}</View>
  </View>
)
```

> 布局数值全部按 375px 设计稿编写，由 `adapterStyle` 统一缩放；`onLayout` 读取真实容器尺寸更新缩放比例。

### useEventListener — 事件订阅

订阅 MNB 原生事件总线，监听 `app.onEventListener` 跨端事件：

```ts
export const useEventListener = <T = unknown>(
  callback: (value: T) => void | Promise<unknown>,
  keys?: string[],
  delay = 0,
): void => { ... }
```

**核心要点:**

- 通过 `useRef` 缓存最新回调与 keys，`useEffect` 只依赖 `delay`，避免 keys/callback 引用变化导致反复绑定/解绑监听
- **keys 不传或为空数组时回调不会触发**（listener 内读 keysRef 并用可选链兜底），适用于可选事件列表的容器组件
- 命中 keys 列表中的事件 key 时触发回调，`delay` 可延迟执行
- **异常统一在 hook 内捕获**：回调支持 `async`，内部 `try { await callback(...) } catch {}` 静默吞掉错误（同步抛错与 Promise rejection 都覆盖），保持界面不被刷新失败打断——调用方直接传异步函数即可，不要再自己写 `.catch(() => {})`

**使用方式:**

```tsx
useEventListener(fetchHomeInfo, [TEMPLATE_CHANGE, TEMPLATE_FINISH])
```

> 事件 key 统一定义在 `@/utils/const.ts`（`{appName}_{event_name}` 格式），见 [工具函数规范](utils.md)。

### useLoadMore — 分页加载

列表分页加载状态管理，返回可直接透传给 `FlatList` 的加载相关 props，支持正向与反向列表：

```ts
export type UseLoadMoreReturn = Pick<
  FlatListProps<unknown>,
  | 'onScrollEndDrag'
  | 'overScrollMode'
  | 'ListHeaderComponent'
  | 'onEndReached'
  | 'onEndReachedThreshold'
  | 'ListFooterComponent'
>

/** 加载回调返回：true 表示已无更多数据，false/undefined 表示还有 */
export type LoadMoreResult = boolean | undefined

export const useLoadMore = (
  onFetch?: () => Promise<LoadMoreResult> | LoadMoreResult,
  enabled?: boolean,
  inverted?: boolean,
): UseLoadMoreReturn => { ... }
```

**核心要点:**

- 内部维护 `LoadMoreState`（loading / finish / fail / null），通过 `BaseLoadMore` 渲染尾部加载条（含点击重试）
- `enabled` 为 false 时返回空对象，不启用加载更多
- 正向列表走 `onEndReached`（底部加载）；`inverted` 反向列表走 `onScrollEndDrag` + `ListHeaderComponent`（顶部加载）
- `onFetch` 返回 `true` 表示已无更多数据（进入 finish 态）

> `UseLoadMoreReturn` 用 `Pick<FlatListProps<unknown>, ...>` 从官方类型派生，保证返回对象与 `FlatList` props 严格对齐；`LoadMoreResult` 显式声明加载回调语义。

### useImageLoad — 图片加载跟踪

使用 Context 跟踪多张图片的加载状态，用于「全部图片加载完成后触发动作」等场景（如分享卡片截图）：

```ts
export interface UseImageLoadReturn {
  /** 注册图片，标记为未加载 */
  registerImage: (imageKey: string) => void
  /** 注销图片 */
  unregisterImage: (imageKey: string) => void
  /** 标记图片加载完成 */
  markImageLoaded: (imageKey: string) => void
  /** 是否全部图片加载完成 */
  areAllImagesLoaded: boolean
}

export const useImageLoad = (): UseImageLoadReturn => { ... }

export const ImageLoadContext = createContext<UseImageLoadReturn | null>(null)

export const useImageLoadContext = (): UseImageLoadReturn | null => { ... }
```

## 其他内置 Hooks

项目还内置以下 Hooks，均为命名导出：

### useEffectEvent — 稳定引用的事件回调

返回的函数引用永不变，但内部始终调用最新的 handler，适合在 `useEffect` 订阅事件时避免反复绑定/解绑：

```ts
export const useEffectEvent = <T extends (...args: never[]) => unknown>(handler: T): T => { ... }
```

**核心要点:**

- 内部用 `useRef` 保存最新 handler，返回 `useCallback(..., [])` 引用恒定
- 与 `useEventListener` 的「ref 缓存最新回调」思路一致，用于稳定订阅

### useUpdateEffect — 跳过首次渲染的 Effect

```ts
export const useUpdateEffect = (effect: EffectCallback, deps: DependencyList) => { ... }
```

**核心要点:**

- 首次渲染不执行 effect，仅在依赖变化后执行（内部用 `isFirst` ref 标记）

### useFontScaleChange — 订阅字体缩放

依赖 `fontScale` 的组件（如 FlashList、memo 组件）通过它订阅字体缩放变化触发重渲染：

```ts
import { useFontScaleChange } from '@/utils/font'

export const SomeItem = () => {
  const fontScale = useFontScaleChange()
  return <Text style={{ fontSize: 14 * fontScale }}>...</Text>
}
```

## 平台特定 Hooks

当 Hook 在 Web 和 Native 端实现不同时，创建 `.web.ts` 变体，两端**同名导出**：

```
uses/useShare.ts          # Native: MNB share API（updateShareConfig / showShareMenu / doShareCard）
uses/useShare.web.ts      # Web: @mf2e/h5-share（updateShareConfig）
```

```ts
// uses/useShare.ts (Native) — 摘要
export interface ShareConfig {
  title: string
  desc: string
  imgUrl: string
  urlParams: ShareParams | null
  cardDialog: string | null
  IMChatData: Record<string, unknown>
}

export interface UseShareReturn {
  /** 更新分享配置 */
  updateShareConfig: (config: Partial<ShareConfig>) => void
  /** 唤起系统分享菜单 */
  showShareMenu: () => void
  /** 生成分享卡片，拉起分享卡片弹窗 */
  doShareCard: (cardDialog?: string | null, urlParams?: ShareParams | null) => Promise<void>
}

export const useShare = (): UseShareReturn => {
  const [shareConfig, setShareConfig] = useState<ShareConfig | null>(null)

  const updateShareConfig = useCallback((config: Partial<ShareConfig>) => { ... }, [])
  const showShareMenu = useCallback(() => { ... }, [shareConfig])
  const doShareCard = useCallback(async (cardDialog?, urlParams?) => { ... }, [])

  return { updateShareConfig, showShareMenu, doShareCard }
}
```

```ts
// uses/useShare.web.ts (Web) — 摘要
export interface ShareConfig {
  title: string
  desc: string
  imgUrl: string
  link: string
}

export interface UseShareReturn {
  /** 更新分享配置 */
  updateShareConfig: (config: Partial<ShareConfig>) => void
}

export const useShare = (): UseShareReturn => {
  const [shareConfig, setShareConfig] = useState<ShareConfig | null>(null)

  const updateShareConfig = useCallback((config: Partial<ShareConfig>) => { ... }, [])

  useEffect(() => {
    if (!shareConfig) return
    H5Share.config({ ...shareConfig })
  }, [shareConfig])

  return { updateShareConfig }
}
```

## 注意事项

1. **统一位置** — 所有自定义 Hooks 放在 `src/uses/` 目录
2. **命名** — 必须以 `use` 开头，文件名 camelCase；返回类型 `UseXxxReturn` 定义在文件顶部并导出
3. **命名导出** — `export const useXxx`，辅助 hooks 具名导出，不使用 `export default`
4. **Context 导出** — 如需跨组件共享，同时导出 Context 和 consumer hooks；consumer 判空后 throw
5. **清理副作用** — useEffect 中的事件监听必须在 cleanup 中移除
6. **Ref 存回调** — 需要最新引用但不触发 effect 重新执行时，使用 `useRef` 存储
7. **类型安全** — 事件参数、异步返回、ref 类型显式标注；开放值用 `unknown` 收窄，避免裸 `any`
