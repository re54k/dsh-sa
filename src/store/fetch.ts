import mnb from '@mf2e/mnb'
import { showToast } from './modules/app/toast'

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

/** 默认网络错误提示文案（请求异常即视为网络错误） */
const defaultNetworkError = (): string => '加载失败'

/** 默认无内容提示文案 */
const defaultNoContent = <T = unknown>(res: FetchResponse<T>): string =>
  !res.data && res.code !== 0 ? res.message || '暂无内容' : ''

/** 默认错误提示文案（仅 post 请求提示，get 请求静默由调用方处理） */
const defaultErrorToast = <T = unknown>(res: FetchResponse<T>, method: FetchMethod): string =>
  method === 'post' ? res.message || '操作失败' : ''

/** 发送fetch请求，配置字段说明见 FetchConfig */
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
}: FetchConfig<T> = {}): Promise<T> => {
  let res: FetchResponse<T> = {}
  try {
    const raw = await mnb('net.request', {
      url,
      method,
      params,
      headers: {
        'Client-Runtime': 'LqIlZQC3U5y5wCrTbZaU2g==', //传给服务端的RN项目标识
        ...(dataJson ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      data:
        dataJson === 'encrypt_json'
          ? await mnb('app.encrypt', { text: JSON.stringify(data) })
          : dataJson === 'json'
            ? JSON.stringify(data)
            : data,
    })
    res = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (e: unknown) {
    const errorToastMsg = errorToast(res, method)
    errorToastMsg && showToast(errorToastMsg)

    const networkErrorMsg = networkError()
    if (networkErrorMsg) {
      const err: FetchError = new Error(networkErrorMsg)
      err.networkError = true
      throw err
    } else {
      throw e as FetchError
    }
  }

  // 处理无内容
  const noContentMsg = noContent(res)
  if (noContentMsg) {
    const errorToastMsg = errorToast(res, method)
    errorToastMsg && showToast(errorToastMsg)

    const err: FetchError = new Error(noContentMsg)
    err.code = res.code
    err.noContent = true
    throw err
  }

  return res.data ?? ({} as T) // 保证返回数据不空
}
