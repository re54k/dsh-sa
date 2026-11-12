import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Animated } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { usePopupStore, hidePopup } from '@/store/modules/app/popup'

export interface BasePopupProps {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  /** 提示名称，用于与提示配置匹配 */
  popup: string
  /** 自动隐藏时长（毫秒） */
  duration?: number
}

export const BasePopup = ({ style, children, popup, duration = 3000 }: BasePopupProps) => {
  const styles = useStyles(themeStyles)

  const popupConfigs = usePopupStore((s) => s.popupConfigs)

  const [isMounted, setIsMounted] = useState(false)
  const opacity = useRef(new Animated.Value(0)).current
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isVisible = useMemo(() => {
    return !!popupConfigs.find((item) => item.popup === popup)
  }, [popup, popupConfigs])

  useEffect(() => {
    if (isVisible) {
      setIsMounted(true)
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()

      clearTimeout(timer.current ?? 0)
      timer.current = setTimeout(() => {
        hidePopup(popup)
      }, duration)
    } else {
      clearTimeout(timer.current ?? 0)
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        finished && setIsMounted(false)
      })
    }

    return () => clearTimeout(timer.current ?? 0)
  }, [isVisible, opacity, popup, duration])

  return isMounted && <Animated.View style={[styles.BasePopup, style, { opacity }]}>{children}</Animated.View>
}

const themeStyles = createStyles({
  BasePopup: {
    position: 'absolute',
    zIndex: 1000,
    pointerEvents: 'none',
  },
})
