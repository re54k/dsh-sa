import { useCallback, useEffect, useRef } from 'react'

/**
 * 稳定引用的事件回调，类似 React 实验版 useEffectEvent。
 * 返回的函数引用永不变，但内部始终调用最新的 handler，
 * 适合在 useEffect 订阅事件时避免反复绑定/解绑。
 */
export const useEffectEvent = <T extends (...args: never[]) => unknown>(handler: T): T => {
  const ref = useRef(handler)

  useEffect(() => {
    ref.current = handler
  })

  return useCallback((...args: Parameters<T>) => ref.current?.(...args), []) as T
}
