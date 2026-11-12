import { View, Text, Pressable } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BOTTOM_SPACE } from '@/utils/const'

/** 加载状态 */
export type LoadMoreState = 'loading' | 'finish' | 'fail' | null

export interface BaseLoadMoreProps {
  state: LoadMoreState
  onRetry?: () => void
  loadingText?: string
  finishText?: string
  retryText?: string
  bottomSpace?: number
}

export const BaseLoadMore = ({
  state,
  onRetry,
  loadingText,
  finishText,
  retryText,
  bottomSpace,
}: BaseLoadMoreProps) => {
  const styles = useStyles(themeStyles)

  return (
    <View style={[styles.BaseLoadMore, { marginBottom: bottomSpace ?? BOTTOM_SPACE }]}>
      {state === 'loading' && <Text style={styles.text}>{loadingText || '正在载入...'}</Text>}
      {state === 'finish' && <Text style={styles.text}>{finishText || '已无更多数据'}</Text>}
      {state === 'fail' && (
        <Pressable onPress={onRetry}>
          <Text style={styles.text}>{retryText || '点击重新加载'}</Text>
        </Pressable>
      )}
    </View>
  )
}

const themeStyles = createStyles({
  BaseLoadMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
  },
  text: {
    fontSize: 14,
    color: '#777',
  },
})
