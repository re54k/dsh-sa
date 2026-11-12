import { create } from 'zustand'
import { api } from '../api'
import { fetch } from '../fetch'
import type {
  ActivityDetailData,
  ActivityListData,
  ActivityProgressData,
  ShareCardData,
} from '@/types/BeeEarnActivityType'

/** 任务列表每页条数（与接口默认值一致） */
const PAGE_SIZE = 20

interface ActivityStore {
  /** 任务列表数据 */
  listData: ActivityListData | null
  /** 任务详情数据 */
  detailData: ActivityDetailData | null
  /** 任务进度详情数据 */
  progressData: ActivityProgressData | null
  /** 任务分享卡片数据 */
  shareCard: ShareCardData | null
  /** 拉取任务列表（从第一页开始） */
  fetchActivityList: () => Promise<void>
  /** 加载更多任务；返回 true 表示已无更多数据 */
  fetchMoreActivity: () => Promise<boolean>
  /** 拉取任务详情 */
  fetchActivityDetail: (activityId: string) => Promise<void>
  /** 拉取任务进度详情（订单详情页） */
  fetchActivityProgress: (activityId: string) => Promise<void>
  /** 拉取任务分享卡片信息 */
  fetchShareCard: (activityId: string) => Promise<void>
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  listData: null,
  detailData: null,
  progressData: null,
  shareCard: null,

  async fetchActivityList() {
    const data = await fetch<ActivityListData>({
      url: api.beeEarn.activity.list,
      params: { offset: 0, limit: PAGE_SIZE },
    })

    set({ listData: data })
  },

  async fetchMoreActivity() {
    const prev = get().listData
    const offset = prev?.list?.length ?? 0

    const data = await fetch<ActivityListData>({
      url: api.beeEarn.activity.list,
      params: { offset, limit: PAGE_SIZE },
    })

    set({
      listData: {
        list: [...(prev?.list ?? []), ...(data.list ?? [])],
        total: data.total ?? 0,
      },
    })

    return offset + (data.list?.length ?? 0) >= (data.total ?? 0)
  },

  async fetchActivityDetail(activityId) {
    const data = await fetch<ActivityDetailData>({
      url: api.beeEarn.activity.detail,
      params: { activityId },
    })

    set({ detailData: data })
  },

  async fetchActivityProgress(activityId) {
    const data = await fetch<ActivityProgressData>({
      url: api.beeEarn.activity.progress,
      params: { activityId },
    })

    set({ progressData: data })
  },

  async fetchShareCard(activityId) {
    const data = await fetch<ShareCardData>({
      url: api.beeEarn.activity.share,
      params: { activityId },
    })

    set({ shareCard: data })
  },
}))
