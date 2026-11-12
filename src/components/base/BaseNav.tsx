import type { ReactNode } from 'react'
import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from 'react-native'
import { useEffect } from 'react'
import { View, Animated, Pressable, Text } from 'react-native'
import { createStyles, useStyles, useTheme, ThemeImage } from '@mf2e/react-native-theme-styles'
import mnb from '@mf2e/mnb'
import { Assets } from '@/assets'
import { closePage } from '@/store/modules/app/page'
import { useScrollOffset } from '@/uses/usePage'
import { STATUS_BAR_HEIGHT, NAV_BAR_HEIGHT, NAV_TOTAL_HEIGHT } from '@/utils/const'

export interface BaseNavProps {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  /** 状态栏模式 */
  statusBarMode?: 'light' | 'dark'
  /** 是否透明导航 */
  navTransparent?: boolean
  navBgStyle?: StyleProp<ViewStyle>
  navBarStyle?: StyleProp<ViewStyle>
  navTitleStyle?: StyleProp<TextStyle>
  navBackStyle?: StyleProp<ImageStyle>
  /** 导航背景内容 */
  navBg?: ReactNode
  /** 导航标题：字符串/数字套用标题样式（可被 navTitleStyle 覆盖），组件原样渲染 */
  navTitle?: ReactNode
  /** 自定义返回按钮 */
  navBack?: ReactNode
  /** 导航右侧内容 */
  navMore?: ReactNode
}

export const BaseNav = ({
  style,
  children,
  statusBarMode,
  navTransparent,
  navBgStyle,
  navBarStyle,
  navTitleStyle,
  navBackStyle,
  navBg,
  navTitle,
  navBack,
  navMore,
}: BaseNavProps) => {
  const styles = useStyles(themeStyles)

  const theme = useTheme()

  const scrollOffset = useScrollOffset()

  const opacity = scrollOffset.interpolate({
    inputRange: [0, NAV_TOTAL_HEIGHT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  useEffect(() => {
    mnb('app.setStatusBar', { mode: statusBarMode || (theme !== 'light' ? 'light' : 'dark') })
  }, [statusBarMode, theme])

  return (
    <View style={[styles.BaseNav, navTransparent && styles.navTransparent, style]}>
      <Animated.View style={[styles.navBg, navTransparent && { opacity }, navBgStyle]}>{navBg}</Animated.View>
      <Animated.View style={[styles.navBar, navTransparent && { opacity }, navBarStyle]}>
        {typeof navTitle === 'string' || typeof navTitle === 'number' ? (
          <Text style={[styles.navTitle, navTitleStyle]} numberOfLines={1}>
            {navTitle}
          </Text>
        ) : (
          navTitle
        )}
      </Animated.View>
      {children}
      <View style={styles.back}>
        {navBack || (
          <Pressable onPress={() => closePage()}>
            <ThemeImage style={[styles.navBack, navBackStyle]} source={Assets.navBack} />
          </Pressable>
        )}
      </View>
      <View style={styles.more}>{navMore}</View>
    </View>
  )
}

const themeStyles = createStyles({
  BaseNav: {
    position: 'relative',
    height: NAV_TOTAL_HEIGHT,
  },
  navTransparent: {
    zIndex: 9999,
    marginBottom: -NAV_TOTAL_HEIGHT,
  },
  navBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
  navBar: {
    justifyContent: 'center',
    alignItems: 'center',
    height: NAV_BAR_HEIGHT,
    marginTop: STATUS_BAR_HEIGHT,
    marginHorizontal: 50,
  },
  navTitle: {
    color: '#333',
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: NAV_BAR_HEIGHT,
  },
  back: {
    justifyContent: 'center',
    position: 'absolute',
    top: STATUS_BAR_HEIGHT,
    left: 12,
    height: NAV_BAR_HEIGHT,
  },
  navBack: {
    width: 20,
    height: 20,
    tintColor: '#333',
  },
  more: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: STATUS_BAR_HEIGHT,
    right: 12,
    height: NAV_BAR_HEIGHT,
  },
})
