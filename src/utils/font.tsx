/**
 * 统一字体处理
 */

import type { ComponentType } from 'react'
import type { TextProps, TextInputProps, TextStyle } from 'react-native'
import { useEffect, useState, createContext, useContext } from 'react'
import { Text, TextInput, Platform, StyleSheet } from 'react-native'
import mnb from '@mf2e/mnb'
import { appEnv } from './inject'

/**
 * Text / TextInput 的默认属性：
 * - 全局禁止跟随系统字体缩放（allowFontScaling: false）
 * - 不使用 RN 内置的 maxFontSizeMultiplier（交给我们自己的逻辑控制）
 */
const defaultProps: Pick<TextProps, 'allowFontScaling' | 'maxFontSizeMultiplier'> = {
  allowFontScaling: false,
  maxFontSizeMultiplier: null,
}

/**
 * 针对 Android 的默认样式修正：
 * - 右侧加一条透明边框，避免最后一个字符被裁切
 * - includeFontPadding 设为 false，去除多余内边距
 * - textAlignVertical 设为 center，保证文字垂直居中
 */
const defaultStyle: TextStyle =
  Platform.OS === 'android'
    ? {
        // 解决最后一位字符被裁切
        borderRightWidth: 2,
        borderRightColor: 'transparent',
        // 解决字体垂直居中
        includeFontPadding: false,
        textAlignVertical: 'center',
      }
    : {}

/**
 * 根据全局及局部配置计算字体缩放样式：
 * - 只有当组件显式传入 allowFontScaling 为 true 时才启用
 * - 从 appEnv.fontScale 读取当前字体缩放比例，并受 maxFontSizeMultiplier 限制
 * - 对传入 style 中的 fontSize / lineHeight 做等比例缩放
 */
export const getFontScaleStyle = ({
  allowFontScaling,
  maxFontSizeMultiplier,
  style,
}: Pick<TextProps, 'allowFontScaling' | 'maxFontSizeMultiplier' | 'style'>) => {
  const fontScale = allowFontScaling ? Math.min(appEnv.fontScale || 1, maxFontSizeMultiplier || Infinity) : 1
  const { fontSize, lineHeight } = StyleSheet.flatten(style) || {}

  return {
    fontSize: fontSize !== undefined ? fontSize * fontScale : undefined,
    lineHeight: lineHeight !== undefined ? lineHeight * fontScale : undefined,
  }
}

/**
 * 整合组件 props：
 * - 使用我们自定义的字体缩放逻辑，而不是 RN 内置的 allowFontScaling / maxFontSizeMultiplier
 * - 合并默认样式、原始样式以及计算后的缩放样式
 */
const getMergedProps = (props: TextProps | TextInputProps) => {
  const { allowFontScaling, maxFontSizeMultiplier, style } = props
  const fontScaleStyle = getFontScaleStyle({ allowFontScaling, maxFontSizeMultiplier, style })

  return {
    ...props,
    allowFontScaling: false,
    maxFontSizeMultiplier: null,
    style: [defaultStyle, style, fontScaleStyle],
  }
}

/**
 * 全局劫持 Text / TextInput 的 render 函数：
 * - 在真正渲染前，对 props 做统一的字体及样式处理
 * - 并为它们设置统一的 defaultProps
 */
const TextRender = (Text as any).render
;(Text as any).render = (props: TextProps, ...rest: unknown[]) =>
  TextRender.apply(this, [getMergedProps(props), ...rest])
;(Text as any).defaultProps = { ...(Text as any).defaultProps, ...defaultProps }

const TextInputRender = (TextInput as any).render
;(TextInput as any).render = (props: TextInputProps, ...rest: unknown[]) =>
  TextInputRender.apply(this, [getMergedProps(props), ...rest])
;(TextInput as any).defaultProps = { ...(TextInput as any).defaultProps, ...defaultProps }

// 全局Context提供fontScale值，用于支持依赖fontScale的组件进行强制刷新
const FontScaleContext = createContext<number>(1)
/**
 * 高阶组件，包装根组件 App：
 * - 监听 mnb 的 app.changeFontScale 事件，更新全局 appEnv.fontScale
 * - 每次字体缩放变化时更新 fontScale，触发依赖 fontScale 的组件重新渲染
 */
export const withFontScale = <P extends object>(App: ComponentType<P>) => {
  const WrapApp = (props: P) => {
    const [fontScale, setFontScale] = useState(appEnv.fontScale || 1)

    useEffect(() => {
      const onChangeFontScale = (e: { fontScale: number }) => {
        appEnv.fontScale = e.fontScale
        setFontScale(e.fontScale)
      }
      mnb.on('app.changeFontScale', onChangeFontScale)
      return () => mnb.off('app.changeFontScale', onChangeFontScale)
    }, [])

    return (
      <FontScaleContext.Provider value={fontScale}>
        <App {...props} />
      </FontScaleContext.Provider>
    )
  }

  return WrapApp
}

/**
 * 针对类似 FlashList 以及使用了 memo 缓存的各类组件：
 * - 原理是子组件依赖的Context更新会触发子组件重渲染
 * - 在子组件中直接调用useFontScaleChange，从而在字体缩放变化时触发子组件中的Text更新
 * - 同时返回当前字体缩放比例fontScale，供子组件使用
 */
export const useFontScaleChange = (): number => {
  return useContext(FontScaleContext)
}
