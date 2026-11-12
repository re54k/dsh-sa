import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { useRef, useEffect, useCallback } from 'react'
import { View } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { captureRef } from 'react-native-view-shot'
import { useImageLoad, ImageLoadContext } from '@/uses/useImageLoad'

export interface ShareCardShotProps {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  /** 截图完成回调，返回图片路径 */
  onShot?: (data: string) => void
  /** 截图失败回调 */
  onError?: (error: Error) => void
}

export const ShareCardShot = ({ style, children, onShot, onError }: ShareCardShotProps) => {
  const styles = useStyles(themeStyles)

  const { registerImage, unregisterImage, markImageLoaded, areAllImagesLoaded } = useImageLoad()

  const ref = useRef<View>(null)

  const doShot = useCallback(async () => {
    try {
      const data = await captureRef(ref, {
        useRenderInContext: true,
      })

      onShot?.(data)
    } catch (e) {
      console.log(e)
      onError?.(e as Error)
    }
  }, [onShot, onError])

  useEffect(() => {
    areAllImagesLoaded && doShot()
  }, [areAllImagesLoaded, doShot])

  return (
    <View style={[styles.ShareCardShot, style]} ref={ref}>
      <ImageLoadContext.Provider value={{ registerImage, unregisterImage, markImageLoaded, areAllImagesLoaded }}>
        {children}
      </ImageLoadContext.Provider>
    </View>
  )
}

const themeStyles = createStyles({
  ShareCardShot: {
    top: __DEV__ ? 0 : 10000,
    backgroundColor: 'transparent', // 防止Android截图失败
  },
})
