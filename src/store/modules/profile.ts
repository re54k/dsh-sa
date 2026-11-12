import { create } from 'zustand'
import { api } from '../api'
import { fetch } from '../fetch'
import type { UserProfile } from '@/types/BeeEarnProfileType'

interface ProfileStore {
  /** 蜂赚个人信息 */
  profile: UserProfile | null
  /** 拉取蜂赚个人信息 */
  fetchProfile: () => Promise<void>
  /** 更新联系邮箱（成功后同步更新 store） */
  updateProfileEmail: (email: string) => Promise<void>
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,

  async fetchProfile() {
    const data = await fetch<UserProfile>({
      url: api.beeEarn.profile.detail,
    })

    set({ profile: data })
  },

  async updateProfileEmail(email) {
    await fetch({
      url: api.beeEarn.profile.update,
      method: 'post',
      dataJson: 'json',
      data: { email },
    })

    // 更新成功后同步 store 中的邮箱
    const profile = get().profile
    if (profile) {
      set({ profile: { ...profile, email } })
    }
  },
}))
