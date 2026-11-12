import { serializeParams } from '@mf2e/base'
import { fetch } from '@/store/fetch'
import { appHosts, queryParams } from '@/utils/inject'
import app from '@/../app.json'

/** 分享链接拼接参数 */
export type ShareParams = Record<string, string | number | null | undefined>

/** 短链接口响应 */
interface ShortLinkData {
  url?: string
}

/** sps 参数接口响应 */
interface ShareSpsData {
  spsc?: string
  [key: string]: unknown
}

export const getShareUrl = async (params: ShareParams | null = {}): Promise<string> => {
  const dir = /api-test/.test(appHosts.api_mifengs_com || '') ? 'test' : 'page'
  const filterQueryParams = getFilterQueryParams()
  const scheme = getShareScheme(params)
  const spsInfo = await getShareSpsInfo()

  return `https://wp.mifengs.com/163/${dir}/bee/${app.name}/index.html?${serializeParams({ ...filterQueryParams, ...params, scheme, ...spsInfo })}`
}

export const getShareScheme = (params: ShareParams | null = {}): string => {
  const filterQueryParams = getFilterQueryParams()

  return `ntescommunity://nc/page?${serializeParams({ ...filterQueryParams, ...params })}`
}

export const getShareQRCodeUrl = async (params: ShareParams | null = {}): Promise<string> => {
  const url = await getShareUrl({ ...params })

  const data = await fetch<ShortLinkData>({
    url: `${appHosts.api_mifengs_com}/worklife/api/v1/ugc/share/short-link`,
    params: { url },
  }).catch(() => {
    console.warn('短链获取失败')
  })

  return data?.url || url
}

// 缓存进行中的 Promise，并发调用共享同一次请求
let spsInfoPromise: Promise<ShareSpsData> | undefined
export const getShareSpsInfo = (): Promise<ShareSpsData> => {
  if (!spsInfoPromise) {
    spsInfoPromise = (async () => {
      const data = await fetch<ShareSpsData>({
        url: `${appHosts.api_mifengs_com}/worklife/api/v1/ugc/share/getShareParam`,
      }).catch(() => {
        console.warn('sps信息获取失败')
      })

      // 将所有参数解码
      if (data) {
        for (const key in data) {
          data[key] = decodeURIComponent(String(data[key]))
        }
      }

      return { spsc: '', ...(data || {}) }
    })()
  }

  return spsInfoPromise
}

const getFilterQueryParams = (): ShareParams => {
  const params = { ...queryParams } as ShareParams
  const excludedKeys = ['rnAbTest', 'startupSession', 'finish_callback_id', 'route']

  excludedKeys.forEach((key) => {
    delete params[key]
  })

  return params
}
