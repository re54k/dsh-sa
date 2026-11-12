import type { ComponentProps, JSX, ReactNode } from 'react'
import type { LayoutChangeEvent, TextStyle, ViewStyle } from 'react-native'
import type { renderTabBarItemParams, TabBarItemFuncParams, TabRefMethods } from '@music/common-tab'
import { Children, useEffect, useState, useRef } from 'react'
import { View, Pressable, Text, useWindowDimensions } from 'react-native'
import { createStyles, useStyles, mixStyles } from '@mf2e/react-native-theme-styles'
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated'
import Tab from '@music/common-tab'

/**
 * CommonTab 可覆盖样式表。
 * 键固定，值类型放宽为标准 RN 样式类型（而非 createStyles 的字面量推断类型），
 * 使外部可以用 createStyles 创建覆盖样式并传入任意合法样式值（如 fontWeight: '600'、tabBar 阴影）。
 */
export interface CommonTabStyles {
  /** 根容器 */
  CommonTab: ViewStyle
  /** tab 栏 */
  tabBar: ViewStyle
  /** 单个 tab 项 */
  tabBarItem: ViewStyle
  /** tab 文字 */
  tabBarItemText: TextStyle
  /** 选中态文字（绝对定位覆盖在 tabBarItemText 上） */
  tabBarItemTextActive: TextStyle
  /** tab 标题后缀容器（绝对定位在 tab 右侧） */
  tabBarItemSubTitle: ViewStyle
  /** 下划线指示条 */
  tabBarIndicator: ViewStyle
  /** tab 页容器 */
  tabPage: ViewStyle
}

export interface CommonTabProps extends Omit<
  ComponentProps<typeof Tab.Container>,
  'renderTabBarItem' | 'renderIndicator' | 'onChange' | 'children' | 'activeKey' | 'defaultActiveKey'
> {
  /** 自定义样式覆盖：用 createStyles 创建，只写需要覆盖的键，未覆盖的用默认样式 */
  styles?: Partial<CommonTabStyles>
  children?: ReactNode
  /** 头部内容 */
  head?: ReactNode
  /** tab 标题列表：统一放进 Text，函数入参 selected 为层标记（常态层 false / 选中层 true） */
  titles?: (ReactNode | ((params: TabBarItemFuncParams) => ReactNode))[]
  /** tab 标题后缀（如右侧小图标），与 titles 一一对应、写法相同；绝对定位在 tab 右侧，不占宽度 */
  subTitles?: (ReactNode | ((params: TabBarItemFuncParams) => ReactNode))[]
  /** 选中 tab 索引：首屏为初始索引，之后变化即触发切换 */
  activeTabIndex?: number
  /** tab 索引变化回调，点击当前 tab 时也触发（lastIndex === nextIndex） */
  onTabChange?: (params: { lastIndex: number; nextIndex: number }) => void
}

interface TabBarItemProps extends Pick<
  renderTabBarItemParams,
  'title' | 'position' | 'index' | 'type' | 'crossClick' | 'onPress' | 'onLayout'
> {
  styles: CommonTabStyles
  /** 标题后缀内容（同 titles 的写法） */
  subTitle?: ReactNode | ((params: TabBarItemFuncParams) => ReactNode)
}

export const CommonTab = ({
  styles,
  children,
  head,
  titles,
  subTitles,
  activeTabIndex,
  onTabChange,
  ...otherProps
}: CommonTabProps) => {
  const defaultStyles = useStyles(themeStyles)
  const mergedStyles = mixStyles(defaultStyles, styles)

  const { width: windowWidth } = useWindowDimensions()

  const [headHeight, setHeadHeight] = useState(-1)

  const tabRef = useRef<TabRefMethods>(null)
  // 选中索引的内部真源：初值取 activeTabIndex（首屏初始索引），之后随 pagerView 当前页同步，
  // 供「点当前 tab」补发回调、防回声与库的 defaultActiveKey 使用
  const tabIndex = useRef(activeTabIndex ?? 0)
  // tab 数量用于越界修正；取数字而非 children 数组，children 引用变化不影响 effect 依赖
  const tabCount = Children.count(children)

  const renderTabBarItem = (props: renderTabBarItemParams) => {
    // 点中的是当前 tab：组件库既不切页也不回调，这里补发一次「同一 tab」的 onTabChange；
    // 前后索引都取 props.index，不依赖 ref 与库内部 page 的同步假设
    const onPress = props.selected
      ? () => onTabChange?.({ lastIndex: props.index, nextIndex: props.index })
      : props.onPress
    return <TabBarItem styles={mergedStyles} {...props} subTitle={subTitles?.[props.index]} onPress={onPress} />
  }

  const renderIndicator = () => {
    return <View style={mergedStyles.tabBarIndicator} />
  }

  const onLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    setHeadHeight(Math.round(height))
  }

  const onChange = (index: number) => {
    const lastIndex = tabIndex.current
    tabIndex.current = index
    onTabChange?.({ lastIndex, nextIndex: index })
  }

  /** 外部请求切换：转成命令调用，与点击 tab 走同一条路径（pager 动画、crossClick、onTabChange 均正常） */
  useEffect(() => {
    if (activeTabIndex === undefined) return
    // 与内部真源相同说明是本次切换回调的回声，跳过以免重复切页
    if (activeTabIndex === tabIndex.current) return

    const nextIndex = Math.min(Math.max(activeTabIndex, 0), Math.max(tabCount - 1, 0))
    if (nextIndex === tabIndex.current) return

    tabRef.current?.scrollToActiveKey(nextIndex, 'control')
  }, [activeTabIndex, tabCount])

  return (
    <View style={mergedStyles.CommonTab}>
      <Tab.Container
        ref={tabRef}
        defaultActiveKey={tabIndex.current}
        tabBarStyle={[{ width: windowWidth }, mergedStyles.tabBar]}
        indicatorStyle={mergedStyles.tabBarIndicator} // tab内光标部偏移计算依赖此样式
        tabPageStyle={mergedStyles.tabPage}
        renderTabBarItem={renderTabBarItem}
        renderIndicator={renderIndicator}
        pagerView={{ overdrag: false }}
        onChange={onChange}
        {...otherProps}
      >
        {/* @music/common-tab 的 getSubChildren 只遍历顶层 children、不展开 Fragment，故 head 与各个 Tab.Item 需摊平在同一层数组里 */}
        {[
          ...(head
            ? [
                <Tab.Header key="tab-head" height={headHeight}>
                  <View onLayout={onLayout}>{head}</View>
                </Tab.Header>,
              ]
            : []),
          ...Children.toArray(children).map((tab, index) => (
            <Tab.Item key={`tab-item-${index}`} title={titles?.[index]}>
              <View style={mergedStyles.tabPage}>{tab as JSX.Element}</View>
            </Tab.Item>
          )),
        ]}
      </Tab.Container>
    </View>
  )
}

const TabBarItem = ({
  styles,
  title,
  subTitle,
  position,
  index,
  type,
  crossClick,
  onPress,
  onLayout,
}: TabBarItemProps) => {
  const activeStyle = useAnimatedStyle(() => {
    let opacity = interpolate(position.value, [index - 1, index, index + 1], [0, 1, 0], 'clamp')
    // native 线程，无法调用方法，故没有封装成函数
    const crossData = crossClick.value.split('-').map((v, i) => (i === 2 ? Boolean(v) : Number(v)))
    if (crossData[2] && crossData[0] !== index && crossData[1] !== index) {
      opacity = 0
    }
    return { opacity }
  })

  return (
    <Pressable style={styles.tabBarItem} onPress={onPress} onLayout={onLayout}>
      {/* 标题：常态 / 选中态两层叠加 */}
      <Text style={styles.tabBarItemText} numberOfLines={1}>
        {typeof title === 'function' ? title({ index, selected: false, type }) : title}
      </Text>
      <Animated.Text style={[styles.tabBarItemText, styles.tabBarItemTextActive, activeStyle]} numberOfLines={1}>
        {typeof title === 'function' ? title({ index, selected: true, type }) : title}
      </Animated.Text>
      {/* 标题后缀：绝对定位，不占宽度；同样两层叠加 */}
      {subTitle ? (
        <>
          <View style={styles.tabBarItemSubTitle}>
            {typeof subTitle === 'function' ? subTitle({ index, selected: false, type }) : subTitle}
          </View>
          <Animated.View style={[styles.tabBarItemSubTitle, activeStyle]}>
            {typeof subTitle === 'function' ? subTitle({ index, selected: true, type }) : subTitle}
          </Animated.View>
        </>
      ) : null}
    </Pressable>
  )
}

const themeStyles = createStyles<CommonTabStyles>({
  CommonTab: {
    flex: 1,
  },
  tabBar: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#fff',
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarItemText: {
    color: '#999',
    fontSize: 15,
  },
  tabBarItemTextActive: {
    position: 'absolute',
    color: '#333',
    fontWeight: '500',
  },
  tabBarItemSubTitle: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBarIndicator: {
    width: 24,
    height: 3,
    marginTop: -5,
    borderRadius: 20,
    backgroundColor: '#FFD917',
  },
  tabPage: {
    flex: 1,
    backgroundColor: '#fff',
  },
})
