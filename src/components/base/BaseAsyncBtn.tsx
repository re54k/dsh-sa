import type { ReactNode } from 'react'
import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from 'react-native'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'

export interface BaseAsyncBtnProps extends Omit<PressableProps, 'style' | 'children' | 'onPress'> {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  /** 异步点击回调 */
  onPress?: (event: GestureResponderEvent) => Promise<void> | void
  loadingStyle?: StyleProp<ViewStyle>
  /** 自定义加载中内容 */
  loadingComponent?: ReactNode
}

export const BaseAsyncBtn = ({
  style,
  children,
  onPress,
  loadingStyle,
  loadingComponent,
  ...otherProps
}: BaseAsyncBtnProps) => {
  const styles = useStyles(themeStyles)

  const [loading, setLoading] = useState(false)

  const onAsyncPress = async (e: GestureResponderEvent) => {
    if (loading) return

    setLoading(true)
    try {
      await onPress?.(e)
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }

  return (
    <Pressable
      style={[style, loading && !loadingComponent && (loadingStyle || styles.loading)]}
      onPress={onAsyncPress}
      disabled={loading}
      {...otherProps}
    >
      {loading && loadingComponent ? loadingComponent : children}
    </Pressable>
  )
}

const themeStyles = createStyles({
  loading: {
    opacity: 0.3,
  },
})
