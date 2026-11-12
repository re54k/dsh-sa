import type { ReactElement } from 'react'
import { Text } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BaseSuspense } from '@/components/base/BaseSuspense'
import { useLoadMore } from '@/uses/useLoadMore'
import { useActivityStore } from '@/store/modules/activity'
import { TaskCard } from './TaskCard'

/** 派单任务列表主体：任务卡片流 + 加载更多 */
export const TaskListMain = (): ReactElement => {
  const styles = useStyles(themeStyles)
  const listData = useActivityStore((s) => s.listData)
  const fetchActivityList = useActivityStore((s) => s.fetchActivityList)
  const fetchMoreActivity = useActivityStore((s) => s.fetchMoreActivity)
  const loadMoreProps = useLoadMore(fetchMoreActivity, !!listData?.list?.length)

  return (
    <BaseSuspense
      style={styles.suspense}
      onFetch={fetchActivityList}
      loading={<Text style={styles.tips}>加载中…</Text>}
      error={<Text style={styles.tips}>加载失败</Text>}
      empty={<Text style={styles.tips}>更多任务敬请期待～</Text>}
    >
      <FlashList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={listData?.list ?? []}
        keyExtractor={(item) => item.activityInfo?.activityId ?? ''}
        renderItem={({ item }) => <TaskCard item={item} />}
        {...loadMoreProps}
        // 视觉稿底部文案为「更多任务敬请期待～」，覆盖 useLoadMore 默认 footer（分页加载逻辑仍生效）
        ListFooterComponent={<Text style={styles.footer}>更多任务敬请期待～</Text>}
        estimatedItemSize={116}
      />
    </BaseSuspense>
  )
}

const themeStyles = createStyles({
  suspense: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  tips: {
    marginTop: 40,
    fontSize: 14,
    textAlign: 'center',
    color: '#999',
  },
  footer: {
    height: 40,
    fontSize: 14,
    lineHeight: 40,
    textAlign: 'center',
    color: '#999',
  },
})
