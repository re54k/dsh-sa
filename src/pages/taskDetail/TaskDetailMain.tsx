import type { ReactElement } from 'react'
import { useCallback } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BaseSuspense } from '@/components/base/BaseSuspense'
import { useActivityStore } from '@/store/modules/activity'
import { TaskSummaryCard } from './components/TaskSummaryCard'
import {
  ApplyConditionSection,
  ExtraSection,
  IncentiveSection,
  NotesSection,
  NoticeSection,
  ReferenceSection,
} from './components/DetailSections'
import { BottomActionBar } from './components/BottomActionBar'

interface TaskDetailMainProps {
  /** 任务 ID */
  activityId?: string
}

/** 任务详情页主体：滚动内容卡片列 + 吸底操作栏 */
export const TaskDetailMain = ({ activityId }: TaskDetailMainProps): ReactElement => {
  const styles = useStyles(themeStyles)
  const detailData = useActivityStore((s) => s.detailData)
  const fetchActivityDetail = useActivityStore((s) => s.fetchActivityDetail)

  const fetch = useCallback(() => fetchActivityDetail(activityId || ''), [activityId, fetchActivityDetail])

  const info = detailData?.activityInfo

  return (
    <View style={styles.main}>
      <BaseSuspense
        style={styles.suspense}
        onFetch={fetch}
        loading={<Text style={styles.tips}>加载中…</Text>}
        error={<Text style={styles.tips}>加载失败</Text>}
        empty={<Text style={styles.tips}>任务不存在或已下线</Text>}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <TaskSummaryCard info={info} user={detailData?.userInfo} />
          <NoticeSection submitNotice={detailData?.submitNotice} />
          <IncentiveSection incentives={detailData?.incentives} />
          <ExtraSection extraModules={detailData?.extraModules} />
          <ApplyConditionSection conditions={detailData?.applyConditions} />
          <NotesSection notes={detailData?.notes} />
          <ReferenceSection files={detailData?.referenceFiles} links={detailData?.referenceLinks} />
        </ScrollView>
        <BottomActionBar
          info={info}
          userStatus={detailData?.userStatus}
          hasGroupEntry={!!detailData?.groupInfo?.groupId || !!detailData?.weworkQrUrl}
          userEmail={detailData?.userEmail}
        />
      </BaseSuspense>
    </View>
  )
}

const themeStyles = createStyles({
  main: {
    flex: 1,
  },
  suspense: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  tips: {
    marginTop: 40,
    fontSize: 14,
    textAlign: 'center',
    color: '#999',
  },
})
