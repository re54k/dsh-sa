import { create } from 'zustand'
import mnb from '@mf2e/mnb'
import { serializeParams } from '@mf2e/base'
import { queryParams } from '@/utils/inject'

/** 页面打开参数，透传给页面组件 props，值类型开放 */
type PageParams = Record<string, unknown>

interface PageConfig {
  page: string
  params?: PageParams
}

interface PageStore {
  pageConfig: PageConfig
  openPage: (page: string, params?: PageParams, replace?: boolean) => Promise<unknown> | undefined
  closePage: (params?: { closeType?: number }) => Promise<unknown>
}

export const usePageStore = create<PageStore>((set) => ({
  pageConfig: queryParams.page ? { page: queryParams.page } : { page: 'home' },
  /**
   * 打开页面
   * @param page 页面组件
   * @param params 页面参数
   * @param replace 是否替换
   */
  openPage(page, params, replace = false) {
    if (replace) {
      queryParams.page = page
      const replaceParams = params || {}
      for (const key in replaceParams) {
        queryParams[key] = replaceParams[key]
      }
      set({ pageConfig: { page, params } })
      return
    }

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
  /**
   * 关闭页面
   * @param params 关闭参数
   */
  closePage(params) {
    const { closeType } = params || {}
    return mnb('navigator.close', { closeType })
  },
}))

// 导出独立方法
export const openPage = (page: string, params?: PageParams, replace = false) => {
  return usePageStore.getState().openPage(page, params, replace)
}
export const closePage = (params?: { closeType?: number }) => {
  return usePageStore.getState().closePage(params)
}
