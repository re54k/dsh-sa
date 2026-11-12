import type { ReactElement } from 'react'
import { Pressable } from 'react-native'
import { createStyles, useStyles, ThemeImage } from '@mf2e/react-native-theme-styles'
import { CommonNav } from '@/components/common/CommonNav'
import profileIcon from './assets/profile-icon.png'

/** 派单任务列表页导航：居中标题「派单任务」+ 右上角个人中心入口 */
export const TaskListNav = (): ReactElement => {
  const styles = useStyles(themeStyles)

  return (
    <CommonNav
      navTitle="派单任务"
      navTitleStyle={styles.title}
      navMore={
        <Pressable hitSlop={12} onPress={openProfile}>
          <ThemeImage style={styles.profile} source={profileIcon} />
        </Pressable>
      }
    />
  )
}

/**
 * 右上角个人中心入口（M4 蜂赚个人信息页不在本次还原范围，跳转延后）
 */
const openProfile = (): void => {
  // TODO: M4 蜂赚个人信息页实现后接入 openPage('profile')
}

const themeStyles = createStyles({
  title: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  profile: {
    width: 24,
    height: 24,
  },
})
