import { create } from 'zustand'
import { api } from '../api'
import { fetch } from '../fetch'
import type { ApplySubmitParams } from '@/types/BeeEarnActivityType'

interface ApplyStore {
  /** 提交报名（报名条件校验/邮箱填写/协议同意由页面流程完成后调用） */
  submitApply: (params: ApplySubmitParams) => Promise<void>
}

export const useApplyStore = create<ApplyStore>(() => ({
  async submitApply(params) {
    await fetch({
      url: api.beeEarn.apply.submit,
      method: 'post',
      dataJson: 'json',
      data: { ...params },
    })
  },
}))
