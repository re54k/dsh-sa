import type { ComponentProps, RefObject } from 'react'
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponderGestureState,
  PanResponderInstance,
  ScrollViewProps,
} from 'react-native'
import type Modal from 'react-native-modal'
import { createContext, useContext, useRef, useState } from 'react'
import { Platform, Animated, PanResponder } from 'react-native'

/** 滚动容器（ScrollView / FlashList）通用接口 */
interface ScrollTarget {
  scrollTo?: (options: { y: number; animated?: boolean }) => void
  scrollToOffset?: (options: { offset: number; animated?: boolean }) => void
}

/** 下拉滚动交互返回的滚动 props */
type ScrollProps = Pick<ScrollViewProps, 'onScroll' | 'scrollEventThrottle' | 'scrollEnabled'> & {
  ref: RefObject<ScrollTarget | null>
}

/** react-native-modal 的 propagateSwipe prop 类型，直接从库派生保持同步 */
type PropagateSwipe = NonNullable<ComponentProps<typeof Modal>['propagateSwipe']>

export interface UseDialogReturn {
  propagateSwipe: PropagateSwipe
  scrollProps: ScrollProps
  /** 仅 Android 需要，其余平台为 null */
  scrollResponder: PanResponderInstance | null
}

export const useDialog = (): UseDialogReturn => {
  const isScrollTop = useRef(true)
  const scrollRef = useRef<ScrollTarget | null>(null)
  const [scrollEnabled, setScrollEnabled] = useState(false)

  // decay动画相关
  const decayAnimate = useRef<Animated.CompositeAnimation | null>(null)
  const decayValue = useRef(new Animated.Value(0)).current

  const scrollResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs: PanResponderGestureState) => {
        decayAnimate.current?.stop()
        if (!isScrollTop.current) return false

        const isPullUp = gs.dy < -4 && Math.abs(gs.dy) > Math.abs(gs.dx)
        return isPullUp
      },
      onPanResponderMove: (_, gs: PanResponderGestureState) => {
        decayAnimate.current?.stop()
        scrollTo({ y: -gs.dy })
      },
      onPanResponderRelease: (_, gs: PanResponderGestureState) => {
        scrollToDecay(gs)
      },
    }),
  ).current

  const scrollTo = ({ y }: { y: number }) => {
    if (!scrollRef.current) return

    if (scrollRef.current.scrollTo) {
      scrollRef.current.scrollTo({ y, animated: false }) // scrollview
    } else if (scrollRef.current.scrollToOffset) {
      scrollRef.current.scrollToOffset({ offset: y, animated: false }) // flashlist
    }
  }

  const scrollToDecay = (gesture: PanResponderGestureState) => {
    if (!scrollRef.current) return

    decayValue.removeAllListeners()
    decayValue.setValue(-gesture.dy)
    decayValue.addListener(({ value }) => scrollTo({ y: Math.max(value, 0) }))

    decayAnimate.current?.stop()
    decayAnimate.current = Animated.decay(decayValue, {
      velocity: -gesture.vy,
      deceleration: 0.997,
      useNativeDriver: false, // 需要设为false, 确保 addListener 每帧稳定回调
    })
    decayAnimate.current.start(() => decayValue.removeAllListeners())
  }

  const propagateSwipe: PropagateSwipe = (_, gs) => {
    if (!isScrollTop.current) return true

    const isPullDown = gs.dy > 4 && Math.abs(gs.dy) > Math.abs(gs.dx)
    return !isPullDown
  }

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent?.contentOffset?.y ?? 0
    isScrollTop.current = y <= 0

    const next = y > 0
    if (scrollEnabled !== next) {
      setScrollEnabled(next)
    }
  }

  return {
    propagateSwipe,
    scrollProps: {
      ref: scrollRef,
      onScroll,
      scrollEventThrottle: 16,
      scrollEnabled: Platform.OS === 'android' ? scrollEnabled : true,
    },
    // 非 Android 平台为 null，调用方用可选链访问 panHandlers
    scrollResponder: Platform.OS === 'android' ? scrollResponder : null,
  }
}

export const DialogContext = createContext<Pick<UseDialogReturn, 'scrollProps'> | undefined>(undefined)

export const useScrollProps = () => {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useScrollProps 必须在 DialogContext.Provider 内使用')
  }
  return context.scrollProps
}
