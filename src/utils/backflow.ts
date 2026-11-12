import { Platform } from 'react-native'
import { queryParams } from './inject'

/**
 * 包装回流点击方法
 * @param fn 原生端点击回调
 */
export const onPressBackflow = (fn?: () => void): (() => void) => {
  return () => {
    if (Platform.OS === 'web') {
      const { scheme } = queryParams
      const param = typeof scheme === 'string' ? scheme.replace('ntescommunity://', '') : undefined
      window.openNewsapp?.open?.({ param })
      return
    }

    return fn?.()
  }
}
