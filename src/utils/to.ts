import mnb from '@mf2e/mnb'

/**
 * 跳转链接
 * @param url 目标链接，ntescommunity:// 或 newsapp:// 协议链接会被还原为页面路径
 */
export const toUrl = (url: string): void => {
  let path: string
  if (/^(ntescommunity|newsapp):\/\//.test(url)) {
    path = url.replace(/^(ntescommunity|newsapp):\/\//, '')
  } else {
    path = `nc/web?id=${encodeURIComponent(url)}`
  }

  mnb('navigator.open', { path }).catch(() => {
    console.warn('跳转失败', path)
  })
}
