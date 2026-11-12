import type { NativeScrollEvent, NativeSyntheticEvent, ScrollViewProps } from 'react-native'
import { createContext, useContext, useRef, useState, type RefObject } from 'react'
import { Animated } from 'react-native'

/** 滚动容器（ScrollView / FlashList）通用接口 */
interface ScrollTarget {
  scrollTo?: (options: { y: number; animated?: boolean }) => void
  scrollToOffset?: (options: { offset: number; animated?: boolean }) => void
}

/** 页面滚动交互返回的滚动 props */
type ScrollProps = Pick<ScrollViewProps, 'onScroll' | 'scrollEventThrottle' | 'bounces'> & {
  ref: RefObject<ScrollTarget | null>
}

export interface UsePageReturn {
  scrollOffset: Animated.Value
  scrollProps: ScrollProps
}

export const usePage = (): UsePageReturn => {
  const scrollOffset = useRef(new Animated.Value(0)).current
  const scrollRef = useRef<ScrollTarget | null>(null)
  const [bounces, setBounces] = useState(false)

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent?.contentOffset?.y ?? 0
    scrollOffset.setValue(y)

    // 当滚动到页面顶部时禁用回弹效果，阈值为50
    // 仅在跨阈值时才 setState，避免高频滚动触发无谓的状态更新
    const next = y > 50
    if (bounces !== next) {
      setBounces(next)
    }
  }

  // 需要更高性能的动画时，onScroll可以使用以下版本, 滚动容器需替换为Animated.ScrollView
  // const onScroll = Animated.event(
  //   [{ nativeEvent: { contentOffset: { y: scrollOffset } } }],
  //   { useNativeDriver: true }, // 使用原生驱动以提高性能
  // )

  return {
    scrollOffset,
    scrollProps: {
      ref: scrollRef,
      onScroll,
      scrollEventThrottle: 16,
      bounces,
    },
  }
}

export const PageContext = createContext<UsePageReturn | undefined>(undefined)

export const useScrollOffset = () => {
  const context = useContext(PageContext)
  if (!context) {
    throw new Error('useScrollOffset 必须在 PageContext.Provider 内使用')
  }
  return context.scrollOffset
}

export const useScrollProps = () => {
  const context = useContext(PageContext)
  if (!context) {
    throw new Error('useScrollProps 必须在 PageContext.Provider 内使用')
  }
  return context.scrollProps
}
