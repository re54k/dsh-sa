import type { ReactElement } from 'react'
import { View } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { CommonPage } from '@/components/common/CommonPage'
import { TaskDetailNav } from './TaskDetailNav'
import { TaskDetailMain } from './TaskDetailMain'
import { Assets } from './assets'
import { ThemeImage } from '@mf2e/react-native-theme-styles'

interface TaskDetailPageProps {
  /** 任务 ID（路由参数） */
  activityId?: string
}

/** 蜂赚任务详情页（M2）：背景头图 + 滚动内容卡片 + 吸底操作栏 */
export const TaskDetailPage = ({ activityId }: TaskDetailPageProps): ReactElement => {
  const styles = useStyles(themeStyles)

  return (
    <CommonPage
      nav={<TaskDetailNav />}
      main={<TaskDetailMain activityId={activityId} />}
      bg={<ThemeImage style={styles.headerBg} source={Assets.headerBg} />}
      style={styles.page}
    />
  )
}

const themeStyles = createStyles({
  page: {
    backgroundColor: '#eef1f4',
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 148,
  },
})
