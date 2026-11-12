import type { ReactNode } from 'react'
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native'
import { View, Keyboard } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { usePage, PageContext } from '@/uses/usePage'
import { usePopupStore, hidePopup } from '@/store/modules/app/popup'

export interface BasePageProps {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  /** 背景内容 */
  bg?: ReactNode
  /** 导航 */
  nav?: ReactNode
  /** 主体内容 */
  main?: ReactNode
}

export const BasePage = ({ style, children, bg, nav, main }: BasePageProps) => {
  const styles = useStyles(themeStyles)

  const popupConfigs = usePopupStore((s) => s.popupConfigs)
  const { scrollOffset, scrollProps } = usePage()

  const onTouchEnd = (e: GestureResponderEvent) => {
    // 点击空白隐藏键盘（RN 类型中 target 为 number，运行时为组件实例，仅关心其 isFocused 能力）
    const target = e.target as unknown as { isFocused?: () => boolean }
    if (!target.isFocused?.()) {
      Keyboard.dismiss()
    }

    // 点击空白关闭气泡
    if (popupConfigs.length > 0) {
      hidePopup()
    }
  }

  return (
    <View style={[styles.BasePage, style]} onTouchEnd={onTouchEnd}>
      <PageContext.Provider value={{ scrollOffset, scrollProps }}>
        {bg}
        {nav}
        {main && <View style={styles.main}>{main}</View>}
        {children}
      </PageContext.Provider>
    </View>
  )
}

const themeStyles = createStyles({
  BasePage: {
    flex: 1,
    zIndex: 0,
  },
  main: {
    flex: 1,
  },
})
