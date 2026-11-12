import { create } from 'zustand'
import { api } from '../api'
import { fetch } from '../fetch'
import type {
  PlatformAccount,
  PlatformAccountBindParams,
  PlatformAccountUnbindParams,
} from '@/types/BeeEarnCreatorType'

interface CreatorStore {
  /** 已绑定平台账号列表 */
  accounts: PlatformAccount[]
  /** 平台账号详情 */
  accountDetail: PlatformAccount | null
  /** 拉取已绑定平台账号列表（platform 可选，按平台过滤） */
  fetchCreatorAccounts: (platform?: string) => Promise<void>
  /** 拉取单个平台账号详情 */
  fetchAccountDetail: (id: number) => Promise<void>
  /** 提交平台账号绑定（异步审核） */
  bindAccount: (params: PlatformAccountBindParams) => Promise<void>
  /** 解绑平台账号（成功后从列表同步移除） */
  unbindAccount: (params: PlatformAccountUnbindParams) => Promise<void>
}

export const useCreatorStore = create<CreatorStore>((set, get) => ({
  accounts: [],
  accountDetail: null,

  async fetchCreatorAccounts(platform) {
    const data = await fetch<PlatformAccount[]>({
      url: api.beeEarn.creator.accounts,
      params: platform ? { platform } : undefined,
    })

    set({ accounts: data })
  },

  async fetchAccountDetail(id) {
    const data = await fetch<PlatformAccount>({
      url: api.beeEarn.creator.accountDetail,
      params: { id },
    })

    set({ accountDetail: data })
  },

  async bindAccount(params) {
    await fetch({
      url: api.beeEarn.creator.accountBind,
      method: 'post',
      dataJson: 'json',
      data: { ...params },
    })
  },

  async unbindAccount(params) {
    await fetch({
      url: api.beeEarn.creator.accountUnbind,
      method: 'post',
      dataJson: 'json',
      data: { ...params },
    })

    // 解绑成功后从已绑定列表移除该账号
    set({ accounts: get().accounts.filter((item) => item.accountId !== params.accountId) })
  },
}))
