# 路由与弹窗系统规范（TypeScript）

## 目录

- [路由系统](#路由系统)
- [弹窗系统](#弹窗系统)
- [Toast 系统](#toast-系统)
- [事件通信](#事件通信)
- [原生导航](#原生导航)
- [注意事项](#注意事项)

## 路由系统

项目使用**自定义路由**，不依赖 React Navigation。路由由 Zustand store 驱动（`src/store/modules/app/page.ts`）。

### 页面注册

在 `pages/index.ts` 中注册所有页面（命名导出 + `PageRegistryItem` 类型）：

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

### AppRouter — 路由渲染

根据 `pageConfig.page` 查找并渲染对应的页面组件：

```tsx
export const AppRouter = () => {
  const pageConfig = usePageStore((s) => s.pageConfig)
  const PageComponent = pages.find((item) => item.page === pageConfig.page)?.component

  // 未匹配到页面时，引导客户端打开「更新」页
  useEffect(() => {
    if (!PageComponent) {
      mnb('navigator.close')
      mnb('navigator.open', { path: 'nc/update' })
    }
  }, [PageComponent])

  return PageComponent && <PageComponent {...pageConfig.params} />
}
```

### 页面导航 API

```ts
import { openPage, closePage } from '@/store/modules/app/page'

// 打开新页面 (通过原生导航栈)
openPage('detail', { id: '123' })

// 替换当前页面 (不创建新的原生页面)
openPage('list', { type: 'hot' }, true) // replace = true

// 关闭当前页面（可携带关闭类型）
closePage({ closeType: 'refresh' })
```

`PageParams` 类型（`Record<string, unknown>`）在 `page.ts` 中定义，透传给页面组件 props：

```ts
/** 页面打开参数，透传给页面组件 props，值类型开放 */
type PageParams = Record<string, unknown>
```

### 导航实现原理

```ts
// src/store/modules/app/page.ts（摘要）
openPage(page, params, replace = false) {
  if (replace) {
    // 替换模式: 同步更新 queryParams 与 pageConfig，不新开原生页
    queryParams.page = page
    const replaceParams = params || {}
    for (const key in replaceParams) {
      queryParams[key] = replaceParams[key]
    }
    set({ pageConfig: { page, params } })
    return
  }
  // 新开模式: 通过 MNB 打开新的原生页面
  const mergedParams = Object.assign(
    { id: queryParams.id },
    __DEV__ ? { url: queryParams.url } : {},
    { page },
    params,
  ) as Parameters<typeof serializeParams>[0]

  return mnb('navigator.open', {
    path: `nc/page?${serializeParams(mergedParams)}`,
  })
},
closePage(params) {
  const { closeType } = params || {}
  return mnb('navigator.close', { closeType })
},
```

> 类型细节：`mergedParams` 通过 `as Parameters<typeof serializeParams>[0]` 与 `@mf2e/base` 的 `serializeParams` 入参对齐。

## 弹窗系统

弹窗使用**栈式管理**，支持多层弹窗叠加。状态由 `src/store/modules/app/dialog.ts` 管理。

### 弹窗注册

在 `dialogs/index.ts` 中注册所有弹窗（命名导出 + `DialogRegistryItem` 类型）：

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

### AppModal — 弹窗渲染器

遍历 `dialogConfigs` 渲染所有活跃弹窗，按注册表匹配组件：

```tsx
export const AppModal = () => {
  const dialogConfigs = useDialogStore((s) => s.dialogConfigs)

  return dialogConfigs.map(({ dialog, params }) => {
    const DialogComponent = dialogs.find((item) => item.dialog === dialog)?.component
    return DialogComponent ? <DialogComponent key={dialog} {...params} /> : null
  })
}
```

### 弹窗 API

```ts
import { openDialog, closeDialog } from '@/store/modules/app/dialog'

// 打开弹窗（第二个参数为弹窗 props）
openDialog('alert', { title: '提示', content: '操作成功' })

// 打开确认弹窗 — 通过 params 传入业务回调实现 Promise 化
const isConfirm = await new Promise((resolve) => {
  openDialog('confirm', {
    title: '确认删除？',
    desc: '此操作不可恢复',
    onCancel: () => resolve(false),
    onConfirm: () => resolve(true),
  })
})

// 关闭指定弹窗
closeDialog('alert')

// 关闭最顶层弹窗
closeDialog()
```

> `openDialog` 的第三个参数为**关闭回调**（弹窗关闭时触发），由 `dialog.ts` 的 `closeDialog` 内部调用；业务回调（如 `onConfirm`）走第二个参数 `params` 透传给弹窗组件 props。

### 弹窗栈管理

```ts
// dialogConfigs 数据结构
interface DialogConfig {
  dialog: string
  visible?: boolean
  params?: Record<string, unknown>
  callback?: () => void
}

// dialogConfigs: [
//   { dialog: 'some-name', params: {}, visible: true },
//   { dialog: 'confirm', params: { title: '...' }, visible: true },
// ]
```

**关闭流程要点:**
1. 将目标弹窗的 `visible` 设为 `false`（触发退出动画），同时触发其关闭回调
2. 300ms 后从数组中移除（等待动画完成），期间同一 name 的弹窗不可重复打开
3. 未指定弹窗名称时，关闭栈顶弹窗

### 弹窗组件编写

当多个弹窗共享相同的布局样式时，优先使用 `CommonDialog`；仅在需要自定义弹窗布局时才直接使用 `BaseDialog`：

```tsx
// 优先方式 — 使用 CommonDialog (统一样式的弹窗)
import { CommonDialog } from '@/components/common/CommonDialog'

export interface MyDialogProps {
  /** 标题 */
  title: string
}

export const MyDialog = ({ title }: MyDialogProps) => {
  return (
    <CommonDialog dialog="my-dialog" position="center">
      <View>
        <Text>{title}</Text>
      </View>
    </CommonDialog>
  )
}
```

```tsx
// 需要自定义布局时 — 使用 BaseDialog
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BaseDialog } from '@/components/base/BaseDialog'

export const MyDialog = ({ title }: MyDialogProps) => {
  const styles = useStyles(themeStyles)

  return (
    <BaseDialog style={styles.MyDialog} dialog="my-dialog" position="center">
      <View>
        <Text>{title}</Text>
      </View>
    </BaseDialog>
  )
}

const themeStyles = createStyles({
  MyDialog: {
    position: 'relative',
  },
})
```

### BaseDialog 位置变体

| position | 进入动画 | 退出动画 | 特殊行为         |
| -------- | -------- | -------- | ---------------- |
| `center` | 缩放淡入 | 缩放淡出 | —                |
| `top`    | 从上滑入 | 向上滑出 | —                |
| `bottom` | 从下滑入 | 向下滑出 | 支持下滑手势关闭 |
| `cover`  | 淡入     | 淡出     | 全屏覆盖         |

## Toast 系统

轻量级提示，2 秒后自动消失：

```ts
import { showToast, hideToast } from '@/store/modules/app/toast'

// 显示 Toast (2秒后自动消失)
showToast('操作成功')

// 手动隐藏
hideToast()
```

Toast 渲染由 `AppToast` 组件负责，使用 Modal 实现覆盖层，基于 `useToastStore` 订阅 `toastConfig`：

```tsx
// src/components/app/AppToast.tsx（摘要）
import { useToastStore } from '@/store/modules/app/toast'

export const AppToast = () => {
  const styles = useStyles(themeStyles)
  const toastConfig = useToastStore((s) => s.toastConfig)

  return (
    toastConfig.toast && (
      <Modal style={styles.AppToast} isVisible={toastConfig.visible ?? false} ...>
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastConfig.toast}</Text>
        </View>
      </Modal>
    )
  )
}
```

## 事件通信

使用 MNB 事件总线进行跨组件/跨页面通信。

### 发送事件

```ts
import mnb from '@mf2e/mnb'
import { TEMPLATE_FINISH } from '@/utils/const'

mnb('app.eventPost', { key: TEMPLATE_FINISH, value: templateId })
```

### 监听事件

```ts
import { useEventListener } from '@/uses/useEventListener'
import { TEMPLATE_CHANGE, TEMPLATE_FINISH } from '@/utils/const'

// 在组件中监听事件
useEventListener(fetchHomeInfo, [TEMPLATE_CHANGE, TEMPLATE_FINISH])
```

### 事件常量

事件 key 统一在 `src/utils/const.ts` 中定义，使用 `{appName}_{event_name}` 格式防止冲突：

```ts
// src/utils/const.ts（按需追加）
import { appEnv } from '@/utils/inject'

export const TEMPLATE_CHANGE = 'test_template_change'
export const TEMPLATE_FINISH = 'test_template_finish'
```

## 原生导航

通过 MNB bridge 调用客户端导航：

```ts
import mnb from '@mf2e/mnb'

// 打开原生页面
mnb('navigator.open', { path: 'nc/page?id=xxx' })

// 打开 Web 页面
mnb('navigator.open', { path: `nc/web?id=${encodeURIComponent(url)}` })

// 打开用户主页
mnb('navigator.open', { path: `nc/profile?id=${userId}` })

// 关闭当前页面
mnb('navigator.close', { closeType })
```

### 导航统一入口

页面跳转统一走 **store 独立方法**（`@/store/modules/app/page`），不在组件中直接拼接路由路径：

```ts
import { openPage, closePage } from '@/store/modules/app/page'

export const toProfile = (userId: string) => {
  openPage('profile', { id: userId })
}

export const toLink = (link: string) => {
  openPage('web', { url: link })
}
```

> 当具体业务跳转方法增多时，可在 `src/utils/` 新建 `to.ts` 统一收口（具名导出 `toXxx` 函数）。

### Web 回流唤起（backflow）

Web 端点击需唤起 App 的场景，使用 `@/utils/backflow` 的 `onPressBackflow` 包装回调：

```ts
export const onPressBackflow = (fn?: () => void): (() => void) => { ... }
```

> Web 端唤起 App、Native 端透传回调，详见 [工具函数规范](utils.md#web-回流唤起backflowts)。

**使用方式:**

```tsx
import { onPressBackflow } from '@/utils/backflow'

<Pressable onPress={onPressBackflow(() => openDialog('share-menu'))}>
  <Text>打开分享</Text>
</Pressable>
```

## 注意事项

1. **页面注册** — 新页面必须在 `pages/index.ts` 中注册（命名导出 `pages`）
2. **弹窗注册** — 新弹窗必须在 `dialogs/index.ts` 中注册（命名导出 `dialogs`）
3. **弹窗标识** — dialog 名称使用 kebab-case: `'make-card'`, `'task-list'`
4. **关闭动画** — 弹窗关闭有 300ms 过渡，不要立即移除
5. **手势冲突** — BaseDialog 自动处理 iOS 手势协同和 Android 物理返回键
6. **弹窗嵌套** — 支持多层弹窗叠加，按栈顺序管理
7. **导航统一入口** — 页面跳转通过 `page.ts` 的 `openPage` / `closePage` 封装，避免组件直接拼接路由路径
