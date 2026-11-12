import type { ReactElement } from 'react'
import type { TextStyle } from 'react-native'
import { Pressable, View } from 'react-native'
import { createStyles, useStyles, ThemeImage } from '@mf2e/react-native-theme-styles'
import { CommonNav } from '@/components/common/CommonNav'
import { useActivityStore } from '@/store/modules/activity'
import { Assets } from './assets'

/**
 * 任务详情页导航：未滚动时透明（浮在黄色头图上），滚动后渐显白底 + 居中任务标题。
 * 左侧返回由 BaseNav 自带，右侧为分享入口。
 */
export const TaskDetailNav = (): ReactElement => {
  const styles = useStyles(themeStyles)
  const detailData = useActivityStore((s) => s.detailData)

  return (
    <CommonNav
      navTransparent
      navTitle={detailData?.activityInfo?.name ?? ''}
      navTitleStyle={styles.title}
      navBg={<View style={styles.navBg} />}
      navMore={
        <Pressable hitSlop={12} onPress={onShare}>
          <ThemeImage style={styles.share} source={Assets.iconShare} />
        </Pressable>
      }
    />
  )
}

/** 分享入口（分享卡片数据由 activity/share 接口下发，本期先占位） */
const onShare = (): void => {
  // TODO: M12 分享卡片实现后接入 useShare
}

const themeStyles = createStyles({
  title: {
    color: '#333',
    fontSize: 17,
    fontWeight: '500',
  } as TextStyle,
  navBg: {
    flex: 1,
    backgroundColor: '#fff',
  },
  share: {
    width: 24,
    height: 24,
  },
})
