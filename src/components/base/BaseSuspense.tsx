import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { FetchError } from '@/store/fetch'
import { useState, useCallback, useEffect, cloneElement, isValidElement } from 'react'
import { View } from 'react-native'

/** 加载状态 */
export type SuspenseState = null | 'loading' | 'done' | 'error' | 'empty'

export interface BaseSuspenseProps {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  /** 加载中内容 */
  loading?: ReactNode
  /** 错误内容（自动注入 tips 与 onReload） */
  error?: ReactNode
  /** 空内容（自动注入 tips） */
  empty?: ReactNode
  /** 数据获取函数；返回值仅作透传，不参与状态判断 */
  onFetch?: () => Promise<unknown> | void
}

/** 注入给 error / empty 内容组件的 props */
export interface SuspenseInjectProps {
  /** 状态文案 */
  tips?: string
  /** 错误态重试回调 */
  onReload?: () => void
}

export const BaseSuspense = ({ style, children, loading, error, empty, onFetch }: BaseSuspenseProps) => {
  const [state, setState] = useState<SuspenseState>(null)
  const [errorTips, setErrorTips] = useState<string>()
  const [emptyTips, setEmptyTips] = useState<string>()

  const doFetch = useCallback(async () => {
    try {
      setState('loading')
      await onFetch?.()
      setState('done')
    } catch (e) {
      const err = e as FetchError
      if (err.networkError) {
        setState('error')
        setErrorTips(err.message)
      } else if (err.noContent) {
        setState('empty')
        setEmptyTips(err.message)
      } else {
        setState(null)
      }
    }
  }, [onFetch])

  useEffect(() => {
    doFetch()
  }, [doFetch])

  return (
    <View style={style}>
      {state === 'loading' && loading}
      {state === 'done' && children}
      {state === 'error' && inject(error, { tips: errorTips, onReload: doFetch })}
      {state === 'empty' && inject(empty, { tips: emptyTips })}
    </View>
  )
}

/** 把状态文案注入 error / empty 内容：仅在有效时注入以免覆盖内容自带文案，非元素内容原样展示 */
const inject = (node: ReactNode, { tips, onReload }: SuspenseInjectProps = {}): ReactNode => {
  if (!isValidElement<SuspenseInjectProps>(node)) return node

  return cloneElement(node, { ...(tips && { tips }), ...(onReload && { onReload }) })
}
