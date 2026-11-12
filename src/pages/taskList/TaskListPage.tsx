import type { ReactElement } from 'react'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { CommonPage } from '@/components/common/CommonPage'
import { TaskListNav } from './TaskListNav'
import { TaskListMain } from './TaskListMain'

/** 蜂赚派单任务列表页 */
export const TaskListPage = (): ReactElement => {
  const styles = useStyles(themeStyles)

  return <CommonPage nav={<TaskListNav />} main={<TaskListMain />} style={styles.page} />
}

const themeStyles = createStyles({
  page: {
    backgroundColor: '#f5f5f5',
  },
})
