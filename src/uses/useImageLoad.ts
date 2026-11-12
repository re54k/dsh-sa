import { createContext, useState, useCallback, useMemo, useContext, useEffect } from 'react'

export interface UseImageLoadReturn {
  /** 注册图片，标记为未加载 */
  registerImage: (imageKey: string) => void
  /** 注销图片 */
  unregisterImage: (imageKey: string) => void
  /** 标记图片加载完成 */
  markImageLoaded: (imageKey: string) => void
  /** 是否全部图片加载完成 */
  areAllImagesLoaded: boolean
}

export const useImageLoad = (): UseImageLoadReturn => {
  const [loadingImages, setLoadingImages] = useState<Map<string, boolean>>(new Map().set('_', false))

  const registerImage = useCallback((imageKey: string) => {
    setLoadingImages((prev) => {
      const newMap = new Map(prev)
      newMap.set(imageKey, false)
      return newMap
    })
  }, [])

  const unregisterImage = useCallback((imageKey: string) => {
    setLoadingImages((prev) => {
      const newMap = new Map(prev)
      newMap.delete(imageKey)
      return newMap
    })
  }, [])

  const markImageLoaded = useCallback((imageKey: string) => {
    setLoadingImages((prev) => {
      const newMap = new Map(prev)
      newMap.set(imageKey, true)
      return newMap
    })
  }, [])

  const areAllImagesLoaded = useMemo(() => {
    const images = Array.from(loadingImages.values())
    return images.length > 0 && images.every((loaded) => loaded)
  }, [loadingImages])

  useEffect(() => {
    markImageLoaded('_')
  }, [markImageLoaded])

  return {
    registerImage,
    unregisterImage,
    markImageLoaded,
    areAllImagesLoaded,
  }
}

export const ImageLoadContext = createContext<UseImageLoadReturn | null>(null)

export const useImageLoadContext = (): UseImageLoadReturn | null => {
  return useContext(ImageLoadContext)
}
