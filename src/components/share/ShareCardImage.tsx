import type { ComponentProps } from 'react'
import { useEffect, useMemo } from 'react'
import { createStyles, useStyles, ThemeImage } from '@mf2e/react-native-theme-styles'
import { useImageLoadContext } from '@/uses/useImageLoad'

export interface ShareCardImageProps extends Omit<ComponentProps<typeof ThemeImage>, 'onLoadEnd'> {
  onLoadEnd?: () => void
}

export const ShareCardImage = ({ style, source, onLoadEnd, ...otherProps }: ShareCardImageProps) => {
  const styles = useStyles(themeStyles)
  const { registerImage, unregisterImage, markImageLoaded } = useImageLoadContext() || {}

  // 基于 source 序列化生成稳定的字符串标识，同一 source 只计算一次
  const sourceKey = useMemo(() => (source == null ? undefined : JSON.stringify(source)), [source])

  const onLoadEndDefault = () => {
    if (sourceKey) {
      markImageLoaded?.(sourceKey)
    }
    onLoadEnd?.()
  }

  useEffect(() => {
    if (sourceKey) {
      registerImage?.(sourceKey)
      return () => unregisterImage?.(sourceKey)
    }
  }, [sourceKey, registerImage, unregisterImage])

  return (
    <ThemeImage style={[styles.ShareCardImage, style]} source={source} onLoadEnd={onLoadEndDefault} {...otherProps} />
  )
}

const themeStyles = createStyles({
  ShareCardImage: {
    position: 'relative',
  },
})
