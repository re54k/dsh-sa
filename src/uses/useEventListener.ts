import { useEffect, useRef } from 'react'
import mnb from '@mf2e/mnb'

/**
 * 监听跨端通信事件
 * @param callback 事件回调，接收事件值；支持异步，内部统一捕获异常，失败不打断当前界面
 * @param keys 需要监听的事件 key 列表；不传或为空时不触发回调
 * @param delay 事件触发到回调执行的延迟（毫秒）
 */
export const useEventListener = <T = unknown>(
  callback: (value: T) => void | Promise<unknown>,
  keys?: string[],
  delay = 0,
) => {
  // 最新值引用，避免 effect 因 keys/callback 引用变化反复绑定/解绑
  const callbackRef = useRef(callback)
  const keysRef = useRef(keys)

  callbackRef.current = callback
  keysRef.current = keys

  useEffect(() => {
    const listener = (e: { key: string; value: T }) => {
      if (keysRef.current?.includes(e.key)) {
        setTimeout(async () => {
          try {
            await callbackRef.current?.(e.value)
          } catch {
            // 事件刷新失败静默处理，保持当前已展示内容
          }
        }, delay)
      }
    }

    mnb.on('app.onEventListener', listener)
    return () => mnb.off('app.onEventListener', listener)
  }, [delay])
}
