# 快速开始与完整案例

> **适用边界：** 仅适用于接入 **Falcon** 的传媒 React Native 跨端项目（iOS / Android / Harmony / Web）。纯 Web 项目、未接入 Falcon 的 RN 项目不适用（原因见 [SKILL.md](../SKILL.md) 的「适用边界」）。

本文给出一条**最短上手路径**：照抄一份「列表页」的完整代码，即可跑通 项目结构 → API 端点 → Store → 页面 → 样式 → 分页加载 的全链路；后续开发改名扩展即可。

## 阅读路径

| 你要做的事 | 阅读顺序 |
| --- | --- |
| 全新接手项目 | [项目基础规范](base.md) → 本文 |
| 新增一个页面 | 本文（完整案例）→ [组件规范](components.md) → [样式与主题](styling.md) |
| 接接口 / 管数据 | [网络请求](networking.md) → [状态管理](store.md) |
| 加跳转 / 弹窗 | [路由与弹窗](navigation.md) |
| 遇到报错 | [SKILL.md](../SKILL.md) 的「违规症状与恢复」 |

## 完整案例：带分页的列表页

以虚构模块 `template` 为例，共 5 个文件。全部代码符合本规范（命名导出、`createStyles`、`@/` 别名、泛型 `fetch`、`ThemeImage`）。

```
src/
├── store/
│   ├── api.ts                      # ① 追加接口端点
│   └── modules/template.ts         # ② store：列表数据 + 分页方法
└── pages/
    ├── index.ts                    # ⑥ 注册页面
    └── template/
        ├── TemplatePage.tsx        # ③ 页面入口（nav + main 插槽）
        ├── TemplateMain.tsx        # ④ 列表主体
        └── TemplateNav.tsx         # ⑤ 导航栏
```

### ① API 端点 — `store/api.ts`

所有端点集中定义，按模块分组（详见 [网络请求](networking.md)）：

```ts
// src/store/api.ts
import { appHosts } from '@/utils/inject'

const mock = __DEV__
const host = mock ? `http://${getMockHost()}:8082` : appHosts.api_mifengs_com || 'https://api.mifengs.com'

export const api = {
  template: {
    list: `${host}/api/v1/template/list`,
  },
}
```

### ② Store — `store/modules/template.ts`

页面级 store 只需命名导出 `useXxxStore`；`fetchMore` 返回 `boolean` 供 `useLoadMore` 判断是否还有更多。分页条数用常量而非硬编码——若 `@/utils/const` 中尚未定义 `PAGE_SIZE`，先按常量规范补一行 `export const PAGE_SIZE = 20`：

```ts
// src/store/modules/template.ts
import { create } from 'zustand'
import { api } from '../api'
import { fetch } from '../fetch'
import { PAGE_SIZE } from '@/utils/const'

/** 列表项 */
export interface TemplateItemData {
  id: string
  title: string
  cover: string
}

interface TemplateListData {
  list: TemplateItemData[]
  hasMore: boolean
}

interface TemplateStore {
  listData: TemplateListData | null
  fetchList: () => Promise<void>
  /** 加载更多；返回 true 表示已无更多数据（供 useLoadMore 进入 finish 态） */
  fetchMore: () => Promise<boolean>
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  listData: null,

  async fetchList() {
    const data = await fetch<TemplateListData>({
      url: api.template.list,
      params: { limit: PAGE_SIZE },
    })

    set({ listData: data })
  },

  async fetchMore() {
    const list = get().listData?.list ?? []
    const data = await fetch<TemplateListData>({
      url: api.template.list,
      params: { cursor: list[list.length - 1]?.id, limit: PAGE_SIZE },
    })

    set({ listData: data })

    return !data.hasMore
  },
}))
```

### ③ 页面入口 — `pages/template/TemplatePage.tsx`

多页面共享布局时优先 `CommonPage`，只做 `nav` + `main` 组合：

```tsx
// src/pages/template/TemplatePage.tsx
import type { ReactElement } from 'react'
import { CommonPage } from '@/components/common/CommonPage'
import { TemplateNav } from './TemplateNav'
import { TemplateMain } from './TemplateMain'

export const TemplatePage = (): ReactElement => {
  return <CommonPage nav={<TemplateNav />} main={<TemplateMain />} />
}
```

### ④ 列表主体 — `pages/template/TemplateMain.tsx`

`BaseSuspense` 管四种加载状态，`useLoadMore` 的分页 props 直接 spread 给 `FlashList`：

```tsx
// src/pages/template/TemplateMain.tsx
import type { ReactElement } from 'react'
import { Text, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { createStyles, useStyles, ThemeImage } from '@mf2e/react-native-theme-styles'
import { BaseSuspense } from '@/components/base/BaseSuspense'
import { useLoadMore } from '@/uses/useLoadMore'
import { useTemplateStore } from '@/store/modules/template'
import type { TemplateItemData } from '@/store/modules/template'

interface TemplateItemProps {
  item: TemplateItemData
}

const TemplateItem = ({ item }: TemplateItemProps): ReactElement => {
  const styles = useStyles(themeStyles)

  return (
    <View style={styles.item}>
      <ThemeImage style={styles.cover} source={{ uri: item.cover }} />
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
    </View>
  )
}

export const TemplateMain = (): ReactElement => {
  const styles = useStyles(themeStyles)
  const listData = useTemplateStore((s) => s.listData)
  const fetchList = useTemplateStore((s) => s.fetchList)
  const fetchMore = useTemplateStore((s) => s.fetchMore)
  const loadMoreProps = useLoadMore(fetchMore, !!listData?.list.length)

  return (
    <BaseSuspense
      onFetch={fetchList}
      loading={<Text style={styles.tips}>加载中…</Text>}
      error={<Text style={styles.tips}>加载失败</Text>}
      empty={<Text style={styles.tips}>暂无内容</Text>}
    >
      <FlashList
        data={listData?.list ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TemplateItem item={item} />}
        {...loadMoreProps}
      />
    </BaseSuspense>
  )
}

const themeStyles = createStyles({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  cover: {
    width: 48,
    height: 48,
    marginRight: 12,
    borderRadius: 4,
  },
  title: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  tips: {
    marginTop: 40,
    fontSize: 14,
    textAlign: 'center',
    color: '#999',
  },
})
```

> `error` 内容会自动收到 `onReload` prop，需要「点击重试」时传入自定义错误组件而非纯 `Text`。
> FlashList v1 需额外传 `estimatedItemSize`（v2 已移除该参数），按项目实际版本补齐。

### ⑤ 导航栏 — `pages/template/TemplateNav.tsx`

普通组件写法：`createStyles` 定义在组件函数之后、文件底部：

```tsx
// src/pages/template/TemplateNav.tsx
import type { ReactElement } from 'react'
import { Text, View } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'

export const TemplateNav = (): ReactElement => {
  const styles = useStyles(themeStyles)

  return (
    <View style={styles.TemplateNav}>
      <Text style={styles.title}>模板页</Text>
    </View>
  )
}

const themeStyles = createStyles({
  TemplateNav: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
})
```

### ⑥ 页面注册与打开

```ts
// src/pages/index.ts
import type { ComponentType } from 'react'
import { TemplatePage } from './template/TemplatePage'

export interface PageRegistryItem {
  page: string
  component: ComponentType<any>
}

export const pages: PageRegistryItem[] = [{ page: 'template', component: TemplatePage }]
```

```ts
import { openPage } from '@/store/modules/app/page'

openPage('template', { id: '123' })
```

## 提交前自检清单

- [ ] 组件 / 工具 / 注册表均为**命名导出**，无 `export default`
- [ ] 无 class 组件；Hooks 只在函数组件或自定义 Hook 内调用
- [ ] 无行内样式；`createStyles` 定义在组件函数**之后**、文件底部
- [ ] 无 `gap` / `box-shadow` / `background-image` / `calc()` 等 CSS-only 属性
- [ ] 图片使用 `ThemeImage`，不使用 `Image`
- [ ] 请求走 `@/store/fetch` 的 `fetch`；端点集中在 `store/api.ts`
- [ ] 跨目录引用走 `@/` 别名，无 `../../../` 深层回溯（同目录同级引用可用 `./`、`../`）
- [ ] 常量抽到 `@/utils/const`，不硬编码魔法数字
- [ ] 引入的三方库已在 `package.json` 中
- [ ] 新页面已在 `pages/index.ts` 注册
