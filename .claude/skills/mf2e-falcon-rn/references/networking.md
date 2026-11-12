# 网络请求规范（TypeScript）

## 目录

- [架构概述](#架构概述)
- [API 定义](#api-定义)
- [fetch 封装](#fetch-封装)
- [错误处理](#错误处理)
- [在 Store 中使用](#在-store-中使用)
- [加载状态管理](#加载状态管理)
- [Mock 数据](#mock-数据)
- [注意事项](#注意事项)

## 架构概述

网络请求采用**平台双实现**模式：

```
store/
├── api.ts          # API 端点集中定义（命名导出 api）
├── fetch.ts        # Native 实现 (MNB bridge，泛型封装)
└── fetch.web.ts    # Web 实现 (window.fetch，泛型封装)
```

打包工具根据平台自动选择 `fetch.ts` 或 `fetch.web.ts`。**组件和 store 只 import `fetch` 命名导出，不关心底层实现**。

## API 定义

所有 API 端点集中在 `store/api.ts` 中定义（**命名导出**）：

```ts
// src/store/api.ts
import { appHosts } from '@/utils/inject'

const mock = __DEV__
const host = mock ? `http://${getMockHost()}:8082` : appHosts.api_mifengs_com || 'https://api.mifengs.com'

// 定义接口
export const api = {
  moduleA: {
    list: `${host}/api/v1/moduleA/list`,
    detail: `${host}/api/v1/moduleA/detail`,
    submit: `${host}/api/v1/moduleA/submit`,
  },
  moduleB: {
    list: `${host}/api/v1/moduleB/list`,
    update: `${host}/api/v1/moduleB/update`,
    delete: `${host}/api/v1/moduleB/delete`,
  },
}
```

**规范:**

- 按功能模块分组 (moduleA, moduleB 等)
- 开发环境使用本地 Mock 地址
- 生产环境从 `appHosts` 动态获取或使用默认 host
- **命名导出** `export const api`，消费方 `import { api } from '@/store/api'`

## fetch 封装

`fetch` 是**泛型函数**，类型定义集中在 `src/store/fetch.ts` 并导出，供两端与消费方复用：

```ts
// src/store/fetch.ts — 核心类型
/** 请求方法 */
export type FetchMethod = 'get' | 'post'

/** fetch 配置 */
export interface FetchConfig<T = unknown> {
  /** 请求地址 */
  url?: string
  /** 请求方法（默认 get） */
  method?: FetchMethod
  /** get 请求参数 */
  params?: Record<string, unknown>
  /** post 请求数据 */
  data?: Record<string, unknown>
  /** 请求头 */
  headers?: Record<string, string>
  /** post data 数据格式 */
  dataJson?: 'json' | 'encrypt_json'
  /** 显示网络错误函数 */
  networkError?: () => string
  /** 显示无内容函数 */
  noContent?: (res: FetchResponse<T>) => string
  /** 显示错误提示函数，入参为响应结构与请求方法 */
  errorToast?: (res: FetchResponse<T>, method: FetchMethod) => string
}

/** fetch 响应结构 */
export interface FetchResponse<T = unknown> {
  code?: number
  message?: string
  data?: T
}

/** fetch 请求错误 */
export interface FetchError extends Error {
  code?: number
  networkError?: boolean
  noContent?: boolean
}
```

### Native 实现 (fetch.ts)

通过 MNB bridge 发起请求，`data` 按 `dataJson` 处理（`encrypt_json` 走客户端加密）：

```ts
export const fetch = async <T = unknown>({
  url = '',
  method = 'get',
  params,
  data,
  headers,
  dataJson,
  networkError = defaultNetworkError,
  noContent = defaultNoContent,
  errorToast = defaultErrorToast,
}: FetchConfig<T> = {}): Promise<T> => { ... }
```

**核心要点:**

- 参数直接解构（配置字段说明见 `FetchConfig`），`url` 缺省兜底空串、`method` 缺省兜底 `get`
- 默认提示函数为模块级 `defaultNetworkError` / `defaultErrorToast` / `defaultNoContent`（两端各自本地定义，Web 端不从 `./fetch` 导入运行时值，只 `import type`）
- `defaultErrorToast(res, method)` 仅在 `method === 'post'` 时返回 `res.message || '操作失败'`，其余方法返回空串（不提示），get 请求的失败交由调用方或页面自行处理
- 请求头组装：注入 `Client-Runtime` 项目标识；`dataJson` 非空时加 `Content-Type: application/json`；调用方 `headers` 展开在后可覆盖
- `dataJson === 'encrypt_json'` 时调用 `mnb('app.encrypt', { text: JSON.stringify(data) })` 加密 body，加密失败直接抛出并走请求错误处理；`'json'` 时 `JSON.stringify`；缺省为原生透传
- 请求异常：先按 `errorToast(res, method)` 决定是否 `showToast`（默认仅 POST 提示，不受 `networkError` 影响）；再按 `networkError()` —— 返回非空串时抛 `FetchError`（`message` 即该串、带 `networkError = true`），返回空串时原样抛出原始异常
- `noContent(res)` 返回非空串时抛 `FetchError`（带 `code` / `noContent` 标记），同样以 `errorToast(res, method)` 决定是否提示
- 返回 `res.data ?? {}`，保证不为空

### Web 实现 (fetch.web.ts)

使用 `window.fetch` 替代 MNB，与 Native 端**同一签名、同一类型**：

```ts
export const fetch = async <T = unknown>({
  url = '',
  method = 'get',
  params,
  data,
  headers,
  dataJson,
  networkError = defaultNetworkError,
  noContent = defaultNoContent,
  errorToast = defaultErrorToast,
}: FetchConfig<T> = {}): Promise<T> => { ... }
```

**核心要点:**

- GET：`params` 通过 `serializeParams` 拼接到 url；POST body：`dataJson` 非空时 `JSON.stringify`，缺省时 `serializeParams` 表单序列化（要求扁平键值数据）
- 请求头组装与 Native 端一致：`dataJson` 非空时加 `Content-Type: application/json`，调用方 `headers` 展开在后可覆盖
- 错误 / 无内容处理与 Native 端保持一致（POST 默认错误 Toast、`networkError` 标记、`noContent` 抛错、`?? {}` 兜底）
- 注意：`encrypt_json` 为 Native 专属能力，Web 端按普通 JSON 处理

## 错误处理

### fetch 参数说明

| 参数           | 类型                       | 说明                                                                              |
| -------------- | -------------------------- | --------------------------------------------------------------------------------- |
| `url`          | `string`                   | 请求地址（可选，缺省空串）                                                        |
| `method`       | `'get' \| 'post'`          | 请求方法，默认 `'get'`                                                            |
| `params`       | `Record<string, unknown>`  | GET 请求参数                                                                      |
| `data`         | `Record<string, unknown>`  | POST 请求体                                                                       |
| `dataJson`     | `'json' \| 'encrypt_json'` | POST 数据处理：JSON 序列化或加密                                                  |
| `headers`      | `Record<string, string>`   | 自定义请求头                                                                      |
| `networkError` | `() => string`             | 网络错误判定函数，返回非空串即抛出携带该文案的 FetchError，空串则原样抛出原始异常 |
| `noContent`    | `(res) => string`          | 自定义无内容判断函数，返回空状态文本或空串禁用                                    |
| `errorToast`   | `(res, method) => string`  | 自定义错误提示函数，返回提示文本（`method` 为当前请求方法）                       |

> 类型提示：`errorToast` 的入参为 `FetchResponse<T>` 与 `FetchMethod`，`noContent` 的入参为 `FetchResponse<T>`，二者返回 `string`（空串表示不提示 / 不判定为空内容）；`networkError` 无入参、返回 `string`（空串表示不标记网络错误），默认 `'加载失败'`。泛型 `T` 决定 `res.data` 的类型。

### 错误类型

```ts
import type { FetchError } from '@/store/fetch'

try {
  const data = await fetch({ url: api.moduleA.list })
} catch (e) {
  const err = e as FetchError
  if (err.networkError) {
    // 网络错误 (请求失败)
  }
  if (err.noContent) {
    // 无数据 (请求成功但无有效内容)
    // err.code 包含服务端返回的错误码
  }
}
```

### 自定义错误处理

```ts
// 自定义无内容判断
await fetch({
  url: api.moduleA.list,
  noContent: (res) => (res.data?.list?.length ? '' : '暂无数据'),
})

// 禁用错误提示（返回空串）
await fetch({
  url: api.moduleA.submit,
  method: 'post',
  errorToast: () => '',
})

// 按请求方法自定义提示（method 由 fetch 透传给 errorToast）
await fetch({
  url: api.moduleB.submit,
  method: 'post',
  errorToast: (res, method) => (method === 'post' ? res.message || '提交失败' : ''),
})

// 关闭网络错误标记（返回空串即不标记；POST 请求仍按 errorToast 提示）
await fetch({
  url: api.moduleB.detail,
  networkError: () => '',
})

// 默认行为: POST 请求自动显示错误 Toast；GET 请求静默不提示
await fetch({
  url: api.moduleB.update,
  method: 'post', // 出错时自动 showToast('操作失败')
})
```

## 在 Store 中使用

fetch 主要在 Zustand store 方法中调用，**通过泛型指定返回数据类型**：

```ts
// src/store/modules/moduleA.ts
import { create } from 'zustand'
import { api } from '../api'
import { fetch } from '../fetch'

interface ListData {
  list: Item[]
}

interface ModuleAStore {
  listData: ListData | null
  detailData: Item | null
  fetchList: () => Promise<void>
  fetchDetail: (id: string) => Promise<void>
  submitData: (payload: Record<string, unknown>) => Promise<void>
}

export const useModuleAStore = create<ModuleAStore>((set) => ({
  listData: null,

  // GET 请求
  async fetchList() {
    const data = await fetch<ListData>({ url: api.moduleA.list })
    set({ listData: data })
  },

  // 带参数的 GET 请求
  async fetchDetail(id) {
    const data = await fetch<Item>({
      url: api.moduleA.detail,
      params: { id },
      noContent: (res) => (res.data ? '' : '暂无数据'),
    })
    set({ detailData: data })
  },

  // POST 请求 (JSON body，自动序列化)
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

> 返回值保证非空（`res.data ?? {}`），泛型类型与真实接口结构对齐；不确定时先定义最小 `interface` 再逐步补全字段。

## 加载状态管理

使用 `BaseSuspense` 组件管理数据加载的四种状态：

```tsx
import { BaseSuspense } from '@/components/base/BaseSuspense'

export const MyPage = () => {
  return (
    <BaseSuspense
      onFetch={fetchData}
      loading={<LoadingView />}
      error={<ErrorView />} // 自动注入 tips 与 onReload prop
      empty={<EmptyView />} // 自动注入 tips prop
    >
      <ContentView />
    </BaseSuspense>
  )
}
```

**状态流转:**

```
onFetch 开始
    ↓
'loading' → 显示 loading 组件
    ↓
成功 → 'done' → 显示 children
失败 (e.networkError) → 'error' → 显示 error 组件（自动注入 onReload，可重试）
失败 (e.noContent) → 'empty' → 显示 empty 组件（自动注入 tips）
失败 (两个标记均为假) → 状态重置为初始值 → 四种内容均不显示
```

## Mock 数据

项目使用 [`connect-api-mocker`](https://www.npmjs.com/package/connect-api-mocker) 搭配 `connect` + `cors` 启动一个本地 Mock 服务器（默认监听 `8082` 端口），与 RN / Vite 开发服务一起启动，开发环境下 `fetch` 会自动指向本机 IP。

### 目录结构

Mock 文件放在项目根目录的 `mock/` 下，按「真实接口路径」建立同名目录，在末级目录使用 HTTP 方法作为文件名（`GET.js` / `POST.js` ...）：

```
mock/
├── index.js                     # Mock 服务入口 (启动 8082 端口)
├── moduleA/
│   └── api/v1/resource/list/
│       ├── GET.js               # GET 接口响应定义
│       └── res.json             # 响应数据
└── moduleB/
    └── api/v1/resource/pending/list/
        ├── GET.js
        ├── list.json            # 首屏数据
        └── more.json            # 翻页数据
```

目录结构与 `api.ts` 中的 URL 路径一一对应，例如请求 `/moduleA/api/v1/resource/list` 会命中 `mock/moduleA/api/v1/resource/list/GET.js`。

### 注册 Mock 路由

所有 Mock 前缀在 `mock/index.js` 中通过 `apiMocker(prefix, localDir)` 注册：

```javascript
// mock/index.js
const apiMocker = require('connect-api-mocker')

function mock() {
  const app = connect()
  app.use(cors())
  app.use(apiMocker('/moduleA/api', './mock/moduleA/api'))
  app.use(apiMocker('/moduleB/api', './mock/moduleB/api'))
  http.createServer(app).listen(8082)
}
```

**新增模块时**：在 `mock/index.js` 追加一行 `app.use(apiMocker(prefix, dir))` 即可。

### 响应定义方式

`connect-api-mocker` 提供 `helpers`，常用两种写法：

**1. 静态 JSON 文件 — `file()`**

适合响应固定、不需要参数判断的场景：

```javascript
// mock/moduleA/api/v1/resource/list/GET.js
const path = require('path')
const { delay, file } = require('connect-api-mocker/helpers')

module.exports = [delay(300), file(path.join(__dirname, 'res.json'))]
```

**2. 动态响应 — `json()`**

根据请求参数返回不同数据（分页、搜索、条件分支等）：

```javascript
// mock/moduleB/api/v1/resource/pending/list/GET.js
const fs = require('fs-extra')
const path = require('path')
const { delay, json } = require('connect-api-mocker/helpers')

module.exports = [
  delay(300),
  json((req) => {
    const list = fs.readJsonSync(path.join(__dirname, 'list.json'))
    const more = fs.readJsonSync(path.join(__dirname, 'more.json'))
    // 根据 query 区分首屏 / 翻页
    return /offset=0/.test(req._parsedUrl.query) ? list : more
  }),
]
```

**约定：**

- **统一加 `delay(300)`** — 模拟真实网络延迟，便于调试 loading / 防抖逻辑
- **JSON 数据与 GET.js 放同级目录** — 用 `__dirname` 拼接路径，避免写死相对路径
- **数据拆分多个 JSON** — 分页、边界数据用独立 JSON (`list.json` / `more.json` / `empty.json`)，便于复用和切换
- POST 接口对应 `POST.js`，其他方法类推

### 与 `api.ts` 的协作

`src/store/api.ts` 中用 `__DEV__` 切换 Mock / 线上 host。Mock host 在**运行时**从 `queryParams.url` 解析——调试页面通过 scheme 打开时（见 `scripts/open.js`），bundle 地址 `http://<开发机IP>:8081/index.bundle?...` 携带在 url 参数中，其 host 即开发机地址，无需将 IP 写入任何文件，多人开发互不冲突：

```ts
const mock = __DEV__
const host = mock ? `http://${getMockHost()}:8082` : appHosts.api_mifengs_com || 'https://api.mifengs.com'
```

> `getMockHost()` 用正则 `/^https?:\/\/([^/:]+)/` 从 `queryParams.url` 中匹配出开发机 host，无 url 参数或未匹配到时兜底 `localhost`；`queryParams` 取自原生注入的上下文（`utils/inject.ts`），取值后不再做额外解码。

### 常用调试技巧

- **临时禁用 Mock**：注释 `scripts/dev.js` 中的 `mock()` 调用，或将 `api.ts` 的 `mock` 改为 `false` 直连测试环境
- **模拟错误响应**：在 `GET.js` / `POST.js` 中通过 `status()` helper 返回非 200 状态码，或返回 `{ code: -1, message: '错误' }` 触发 `noContent` 逻辑
- **模拟慢网络**：加大 `delay(3000)` 观察 loading 状态
- **模拟空数据**：新建 `empty.json` 在 `json()` 中按需切换，用于验证 `BaseSuspense` 的 empty 分支。注意默认判定为 `!res.data && res.code !== 0`——`{ code: 0, data: { list: [] } }` 命不中，需用 `{ code: 0, data: null }` 这类数据；列表接口若用自定义 `noContent` 判空数组（`res.data?.list?.length ? '' : '暂无数据'`），则 `{ code: 0, data: { list: [] } }` 同样有效
- **区分分页**：通过 `req._parsedUrl.query`（字符串）或 `req.query`（对象，需启用 query parser）读取参数做分支

## 注意事项

1. **API 集中管理** — 所有端点在 `api.ts` 中定义，不在组件中硬编码
2. **平台透明** — 组件和 store 只 import `fetch`，不关心底层实现
3. **返回值保证** — fetch 返回 `res.data ?? {}`，保证不为 null
4. **错误自动处理** — POST 请求默认显示错误 Toast
5. **JSON POST** — 使用 `dataJson: 'json'` 自动序列化并设置请求头；`encrypt_json` 走客户端加密
6. **无内容判断** — 默认判断 `!res.data && res.code !== 0`，可通过 `noContent` 回调自定义
7. **类型同步** — `FetchConfig<T>` / `FetchResponse<T>` / `FetchError` 由 `fetch.ts` 导出，Native 与 Web 端、消费方共用，新增配置项时同步维护
