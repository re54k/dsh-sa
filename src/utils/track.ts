/*
 * 客户端埋点工具函数
 */
import type { View } from 'react-native'
import { useEffect, useRef, type RefObject } from 'react'
import { Dimensions } from 'react-native'
import { throttle } from '@mf2e/base'
import mnb from '@mf2e/mnb'

// 埋点固定参数
let columnInfo: Record<string, unknown> = {
  columnd: '',
  page: '',
}

// 桥调用失败（如客户端未注册 ntesapp 模块）会 reject，必须逐条兜底，
// 否则未捕获的 rejection 会以 "Uncaught (in promise, id: x)" 形式抛出
mnb('ntesapp.setColumnInfo', columnInfo).catch(() => {})
mnb('ntesapp.getColumnInfo')
  .then((info: Record<string, unknown>) => {
    columnInfo = Object.assign({}, info, columnInfo)
  })
  .catch(() => {})

// 发送事件
export const track = (event: string, info?: Record<string, unknown>) => {
  mnb('track.sendEvent', {
    eventId: event,
    kv: Object.assign({}, columnInfo, info),
  }).catch(() => {})
}

// 点击统计
export const onPressTrack = (fn: () => unknown, event: string, info?: Record<string, unknown>) => {
  return () => {
    track(event, info)
    return fn()
  }
}

// 展示统计
export const useEffectTrack = (event: string, info?: Record<string, unknown>) => {
  const infoRef = useRef(info)
  infoRef.current = info

  useEffect(() => {
    track(event, infoRef.current)
  }, [event, infoRef])
}

// 曝光统计
export const useExposureTrack = (ref: RefObject<View | null>, event: string, info?: Record<string, unknown>) => {
  const infoRef = useRef(info)
  infoRef.current = info

  useEffect(() => {
    const threshold = 0.2
    const { width: windowWidth, height: windowHeight } = Dimensions.get('window')

    // 是否已触发曝光统计
    let hasTracked = false

    // 封装可见性判断逻辑
    const checkExposure = throttle(() => {
      if (hasTracked) return

      try {
        // measureInWindow 返回相对于窗口的坐标 (x, y, width, height)
        ref.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
          // 计算可见区域比例，x, y 已经是相对于窗口的坐标
          const visibleHeightRatio = Math.max(0, (Math.min(y + height, windowHeight) - Math.max(y, 0)) / height)
          const visibleWidthRatio = Math.max(0, (Math.min(x + width, windowWidth) - Math.max(x, 0)) / width)

          // 综合判断可见性
          if (visibleHeightRatio >= threshold && visibleWidthRatio >= threshold) {
            track(event, infoRef.current)
            hasTracked = true
            cancelAnimationFrame(timer) // 触发后立即停止检测
          }
        })
      } catch {
        // 静默处理错误，避免影响主流程
      }
    }, 300)

    let timer = requestAnimationFrame(function frame() {
      if (hasTracked) return
      checkExposure()
      timer = requestAnimationFrame(frame)
    })

    return () => {
      cancelAnimationFrame(timer)
    }
  }, [ref, event, infoRef])
}
