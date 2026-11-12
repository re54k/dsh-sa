# 状态管理规范（TypeScript）

## 目录

- [概述](#概述)
- [Store 模块结构](#store-模块结构)
- [Store 创建模式](#store-创建模式)
- [双导出模式](#双导出模式)
- [Store 模块拆分](#store-模块拆分)
- [异步方法](#异步方法)
- [跨 Store 调用](#跨-store-调用)
- [本地持久化 Store](#本地持久化-store)
- [数据流架构](#数据流架构)
- [注意事项](#注意事项)

## 概述

使用 **Zustand** 进行状态管理。Store 文件位于 `src/store/modules/` 目录，按功能/页面拆分为独立模块。全局 UI 状态在 `src/store/modules/app/` 下**按能力继续拆分**，每个子模块导出独立的 `useXxxStore` hook 与独立方法。

## Store 模块结构

```
src/store/
├── api.ts                   # API 端点定义（命名导出 api）
├── fetch.ts                 # 请求封装 Native（命名导出 fetch<T>）
├── fetch.web.ts             # 请求封装 Web
└── modules/
    ├── app/                 # 全局 UI 状态（按能力拆分）
    │   ├── dialog.ts        # 弹窗状态 → useDialogStore + openDialog/closeDialog
    │   ├── page.ts          # 页面路由 → usePageStore + openPage/closePage
    │   ├── popup.ts         # 气泡提示 → usePopupStore + showPopup/hidePopup
    │   └── toast.ts         # Toast 提示 → useToastStore + showToast/hideToast
    └── home.ts              # 业务模块 → useHomeStore
```

## Store 创建模式

每个模块定义 `interface XxxStore` 描述状态与方法，用 `create<XxxStore>` 强约束：

```ts
// src/store/modules/home.ts
import { create } from 'zustand'
import { api } from '../api'
import { fetch } from '../fetch'

/** 首页信息 */
interface HomeInfo {
  /** 昵称 */
  nickname: string
}

interface HomeStore {
  info: HomeInfo | null
  fetchInfo: () => Promise<void>
}

export const useHomeStore = create<HomeStore>((set) => ({
  info: null,
  async fetchInfo() {
    const data = await fetch<HomeInfo>({
      url: api.info,
    })

    set({ info: data })
  },
}))
```

**要点:**

- `set()` 更新状态 (浅合并)
- `get()` 读取当前状态
- 状态和方法定义在同一个对象中
- **命名导出** `export const useXxxStore`，类型 `interface XxxStore` 不导出（对内约束）

## 双导出模式

独立方法导出**不是默认行为**，仅在以下场景需要：

- **跨 Store 调用** — 其他 store 模块需要调用本模块方法
- **组件外调用** — 工具函数、事件回调等非组件上下文需要触发 store 方法
- **全局 UI 操作** — 如 `dialog.ts` 中的 `openDialog`、`toast.ts` 中的 `showToast` 等高频被外部调用的方法

普通页面 store（如 `home.ts`、`detail.ts`）通常只需 `export const useXxxStore`，在组件内通过 hook 调用方法即可。

### 需要独立导出的示例 (store/modules/app/dialog.ts)

```ts
import { create } from 'zustand'
import { queryParams } from '@/utils/inject'

/** 弹窗打开参数，透传给弹窗组件 props，值类型开放 */
type DialogParams = Record<string, unknown>

interface DialogConfig {
  dialog: string
  visible?: boolean
  params?: DialogParams
  callback?: () => void
}

interface DialogStore {
  dialogConfigs: DialogConfig[]
  openDialog: (dialog: string, params?: DialogParams, callback?: () => void) => void
  closeDialog: (dialog?: string) => void
}

export const useDialogStore = create<DialogStore>((set, get) => ({
  dialogConfigs: queryParams.dialog ? [{ dialog: queryParams.dialog, visible: true }] : [],
  openDialog(dialog, params, callback) {
    // ... 栈式管理，已存在则先移除再重建
    set({ dialogConfigs: get().dialogConfigs.concat([{ dialog, params, callback, visible: true }]) })
  },
  closeDialog(dialog) {
    // ... 未指定时关闭最顶层
  },
}))

// 导出独立方法 — 供其他 store、工具函数等组件外部使用
export const openDialog = (dialog: string, params?: DialogParams, callback?: () => void) => {
  useDialogStore.getState().openDialog(dialog, params, callback)
}
export const closeDialog = (dialog?: string) => {
  useDialogStore.getState().closeDialog(dialog)
}
```

### 不需要独立导出的示例 (页面 store)

```ts
// src/store/modules/home.ts — 页面数据，只在组件内使用
import { create } from 'zustand'
import { api } from '../api'
import { fetch } from '../fetch'

interface HomeStore {
  info: HomeInfo | null
  fetchInfo: () => Promise<void>
}

export const useHomeStore = create<HomeStore>((set) => ({
  info: null,
  async fetchInfo() {
    const data = await fetch<HomeInfo>({ url: api.info })
    set({ info: data })
  },
}))
```

### 使用方式

```ts
// 组件内 — 使用 selector 精确订阅（推荐）
import { useDialogStore } from '@/store/modules/app/dialog'
const dialogConfigs = useDialogStore((s) => s.dialogConfigs)

// 组件内获取多个状态 — 每个字段使用独立 selector
import { useHomeStore } from '@/store/modules/home'
const info = useHomeStore((s) => s.info)
const fetchInfo = useHomeStore((s) => s.fetchInfo)

// 组件外 — 仅限有独立导出的 store
import { openDialog, showToast } from '@/store/modules/app/dialog'
import { showToast } from '@/store/modules/app/toast'
openDialog('confirm', { title: '确认删除？' })
showToast('操作成功')
```

> 全局 UI 四件套在各自子模块中：`openDialog` / `closeDialog`（dialog.ts）、`openPage` / `closePage`（page.ts）、`showPopup` / `hidePopup`（popup.ts）、`showToast` / `hideToast`（toast.ts）。

## Store 模块拆分

按功能/页面拆分，每个模块职责单一：

| 模块                    | 职责         | 典型状态                                       |
| ----------------------- | ------------ | ---------------------------------------------- |
| `app/dialog.ts`         | 弹窗状态     | dialogConfigs                                  |
| `app/page.ts`           | 页面路由状态 | pageConfig                                     |
| `app/popup.ts`          | 气泡状态     | popupConfigs                                   |
| `app/toast.ts`          | Toast 状态   | toastConfig                                    |
| `moduleA.ts`            | 页面 A 数据  | listData, detailData, formData                 |
| `moduleB.ts`            | 页面 B 数据  | items, filterType, cursor                      |
| `moduleC.ts`            | 功能 C 流程  | status, progress, resultData                   |
| `local.ts`              | 本地存储     | guideFlag, settingsCache                       |

## 异步方法

在 store 方法中直接调用 fetch（**泛型指定返回数据类型**），处理数据后 set 更新状态：

```ts
// src/store/modules/moduleA.ts
import { create } from 'zustand'
import { api } from '../api'
import { fetch } from '../fetch'

interface ListData {
  list: Array<{ cursor: number }>
  hasMore: boolean
}

interface ModuleAStore {
  listData: ListData | null
  detailData: unknown
  fetchList: () => Promise<void>
  /** 加载更多；返回 true 表示已无更多数据（供 useLoadMore 判断进入 finish 态） */
  fetchMore: () => Promise<boolean>
  fetchDetail: (id: string) => Promise<void>
  submitData: (payload: Record<string, unknown>) => Promise<void>
}

export const useModuleAStore = create<ModuleAStore>((set, get) => ({
  listData: null,
  detailData: null,

  async fetchList() {
    const data = await fetch<ListData>({ url: api.moduleA.list })
    set({ listData: data })
  },

  async fetchMore() {
    const data = await fetch<ListData>({
      url: api.moduleA.list,
      params: {
        cursor: get().listData?.list?.[get().listData.list.length - 1]?.cursor,
        limit: 20,
      },
    })
    set({ listData: data })
    return !data.hasMore
  },

  async fetchDetail(id) {
    const data = await fetch({
      url: api.moduleA.detail,
      params: { id },
      noContent: (res) => (res.data ? '' : '暂无数据'),
    })
    set({ detailData: data })
  },

  async submitData(payload) {
    await fetch({
      url: api.moduleA.submit,
      method: 'post',
      dataJson: 'json',
      data: payload,
    })
  },
}))
```

> POST JSON 请求：使用 `dataJson: 'json'`，`fetch` 内部自动 `JSON.stringify` 并设置 `Content-Type: application/json`，无需手动处理。

> 分页加载（加载更多）：`fetchMore` 返回 `Promise<boolean>`，`true` 表示已无更多数据（供 `useLoadMore` 进入 finish 态），`false`/`undefined` 表示还有；列表组件使用 `const loadMoreProps = useLoadMore(fetchMore, listData.list.length > 0)`，透传给 FlashList（spread），`useLoadMore` 第 2 参数 `enabled` 必传（列表有数据时才启用加载更多，否则 hook 返回空对象）。

## 跨 Store 调用

通过 import 其他 store 的**独立方法**实现跨 store 调用：

```ts
// src/store/modules/moduleA.ts
import { openDialog } from './app/dialog'
import { refreshModuleB } from './moduleB'

interface ModuleAStore {
  handleItemAction: (item: { type: string }) => void
}

export const useModuleAStore = create<ModuleAStore>((set, get) => ({
  async handleItemAction(item) {
    if (item) {
      switch (item.type) {
        case 'confirm':
          openDialog('confirm', item) // 跨 store 调用
          break
        case 'sync':
          refreshModuleB() // 跨 store 调用
          break
      }
    }
  },
}))
```

**规则:** 跨 store 只调用独立导出方法，不直接 import `useXxxStore` hook。

## 本地持久化 Store

使用 MNB KV bridge 实现本地存储：

```ts
// src/store/modules/local.ts
import { create } from 'zustand'
import mnb from '@mf2e/mnb'
import { STORAGE_PREFIX } from '@/utils/const'

interface LocalStore {
  guideFlag: string | null
  settingsCache: string | null
  getGuideFlag: () => Promise<void>
  setGuideFlag: (guideFlag: string) => void
}

export const useLocalStore = create<LocalStore>((set) => ({
  guideFlag: null,
  settingsCache: null,

  async getGuideFlag() {
    const guideFlag = await mnb('kv.get', { key: `${STORAGE_PREFIX}_guide_flag` })
    set({ guideFlag: guideFlag as string })
  },
  setGuideFlag(guideFlag) {
    set({ guideFlag })
    mnb('kv.set', { key: `${STORAGE_PREFIX}_guide_flag`, value: guideFlag })
  },
}))

// 模块加载时自动初始化
useLocalStore.getState().getGuideFlag()

// 导出独立方法
export const clearLocalGuide = () => {
  useLocalStore.getState().setGuideFlag('')
}
```

**模式要点:**

- 模块级别自动初始化 (文件加载即读取本地数据)
- `get` 方法异步读取、`set` 方法同步写入
- KV key 使用 `STORAGE_PREFIX` 前缀避免冲突
- `mnb` 返回值为 `unknown`，落地到强类型字段时按需 `as` 断言

## 高级模式

### 状态重置

通过 `create` 的第三个参数 `store` 获取 `getInitialState()` 实现完整重置：

```ts
interface ResetStore {
  data: unknown
  status: 'idle' | 'loading' | 'done'
  reset: () => void
}

export const useResetStore = create<ResetStore>((set, get, store) => ({
  data: null,
  status: 'idle',

  reset() {
    set(store.getInitialState())
  },
}))
```

## 数据流架构

```
用户交互 → 组件事件处理
    ↓
Store 方法 (sync/async)
    ↓
fetch<T>() 请求 → API 端点 (api.ts)
    ↓
set() 更新状态
    ↓
useXxxStore(selector) 订阅 → 组件重渲染
```

## 注意事项

1. **状态初始值** — 数据状态初始值用 `null` 表示"未加载"，空数组/对象表示"已加载但为空"
2. **浅合并** — `set()` 是浅合并，嵌套对象需手动展开: `set({ detailData: { ...get().detailData, ...newData } })`
3. **避免多余渲染** — 组件中使用 selector 精确订阅需要的字段: `const listData = useModuleAStore((s) => s.listData)`，**禁止**使用无 selector 的 `useStore()` 解构写法，因为这会订阅整个 store，任何字段变化都会触发组件 rerender
4. **异步错误** — fetch 错误由 fetch 封装统一处理，store 方法中可选择 catch 或向上抛出
5. **状态重置** — 使用 `store.getInitialState()` 获取初始状态进行重置 (需通过 create 第三参数 `store` 获取)
6. **命名约定** — 模块名与页面/功能对应，文件名 camelCase；全局 UI 状态按能力拆分到 `app/` 子目录
7. **类型约束** — 每个模块用 `interface XxxStore` 描述形状并用 `create<XxxStore>` 实例化；开放参数类型（如 `DialogParams`、`PageParams`）用 `Record<string, unknown>` 定义
