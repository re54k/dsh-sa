import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import type { FlashListProps } from '@shopify/flash-list'
import { useState } from 'react'
import { BaseLoadMore, type LoadMoreState } from '@/components/base/BaseLoadMore'

/** 返回的列表加载相关 props，取自 @shopify/flash-list */
export type UseLoadMoreReturn = Pick<
  FlashListProps<unknown>,
  | 'onScrollEndDrag'
  | 'overScrollMode'
  | 'ListHeaderComponent'
  | 'onEndReached'
  | 'onEndReachedThreshold'
  | 'ListFooterComponent'
>

/** 加载回调返回：true 表示已无更多数据，false/undefined 表示还有 */
export type LoadMoreResult = boolean | undefined

export const useLoadMore = (
  onFetch?: () => Promise<LoadMoreResult> | LoadMoreResult,
  enabled?: boolean,
  inverted?: boolean,
): UseLoadMoreReturn => {
  const [state, setState] = useState<LoadMoreState>(null)

  const onLoading = async () => {
    if (state === 'loading' || state === 'finish') return

    setState('loading')
    try {
      const isFinish = await onFetch?.()
      setState(isFinish ? 'finish' : null)
    } catch (e) {
      console.log(e)
      setState('fail')
    }
  }

  if (!enabled) return {}

  if (inverted) {
    return {
      onScrollEndDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (e.nativeEvent?.contentOffset.y <= 0) {
          onLoading()
        }
      },
      overScrollMode: 'always',
      ListHeaderComponent: () => (state ? <BaseLoadMore state={state} onRetry={onLoading} bottomSpace={0} /> : null),
    }
  }

  return {
    onEndReached: onLoading,
    onEndReachedThreshold: 0.2,
    ListFooterComponent: <BaseLoadMore state={state} onRetry={onLoading} />,
  }
}
