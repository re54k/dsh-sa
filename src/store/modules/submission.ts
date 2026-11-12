import { create } from 'zustand'
import { api } from '../api'
import { fetch } from '../fetch'
import type {
  SubmissionDetailData,
  SubmissionListData,
  SubmissionUpdateParams,
  SubmissionUploadParams,
} from '@/types/BeeEarnSubmissionType'

/** 稿件列表每页条数（与接口默认值一致） */
const PAGE_SIZE = 20

/** 稿件筛选状态（与稿件统计四种状态对应，接口 status 参数取值） */
export type SubmissionStatusFilter = 'all' | 'machine_pass' | 'manual_pass' | 'fail'

interface SubmissionStore {
  /** 稿件列表数据 */
  listData: SubmissionListData | null
  /** 当前筛选状态 */
  status: SubmissionStatusFilter
  /** 稿件详情数据 */
  detailData: SubmissionDetailData | null
  /** 拉取稿件列表（重置到第一页；不传 status 时重置为 all） */
  fetchSubmissionList: (activityId: string, status?: SubmissionStatusFilter) => Promise<void>
  /** 加载更多稿件；返回 true 表示已无更多数据 */
  fetchMoreSubmission: (activityId: string) => Promise<boolean>
  /** 拉取稿件详情 */
  fetchSubmissionDetail: (submissionId: string) => Promise<void>
  /** 上传投稿（异步审核） */
  uploadSubmission: (params: SubmissionUploadParams) => Promise<void>
  /** 更新投稿数据截图（7 天窗口期内可多次更新） */
  updateSubmission: (params: SubmissionUpdateParams) => Promise<void>
}

export const useSubmissionStore = create<SubmissionStore>((set, get) => ({
  listData: null,
  status: 'all',
  detailData: null,

  async fetchSubmissionList(activityId, status) {
    const filter = status ?? 'all'

    const data = await fetch<SubmissionListData>({
      url: api.beeEarn.submission.list,
      params: { activityId, status: filter, cursor: '', size: PAGE_SIZE },
    })

    set({ listData: data, status: filter })
  },

  async fetchMoreSubmission(activityId) {
    const prev = get().listData
    const list = prev?.list ?? []
    // 游标取最后一项的 cursor（末项 cursor 为空表示已到底）
    const cursor = list.length > 0 ? (list[list.length - 1].cursor ?? '') : ''

    const data = await fetch<SubmissionListData>({
      url: api.beeEarn.submission.list,
      params: { activityId, status: get().status, cursor, size: PAGE_SIZE },
    })

    set({ listData: { ...data, list: [...list, ...(data.list ?? [])] } })

    const lastItem = data.list?.[data.list.length - 1]
    return !lastItem?.cursor
  },

  async fetchSubmissionDetail(submissionId) {
    const data = await fetch<SubmissionDetailData>({
      url: api.beeEarn.submission.detail,
      params: { submissionId },
    })

    set({ detailData: data })
  },

  async uploadSubmission(params) {
    await fetch({
      url: api.beeEarn.submission.upload,
      method: 'post',
      dataJson: 'json',
      data: { ...params },
    })
  },

  async updateSubmission(params) {
    await fetch({
      url: api.beeEarn.submission.update,
      method: 'post',
      dataJson: 'json',
      data: { ...params },
    })
  },
}))
