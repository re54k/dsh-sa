import { create } from 'zustand'
import { api } from '../api'
import { fetch } from '../fetch'

/** 首页信息 */
interface HomeInfo {
  /** 昵称 */
  nickname: string
}

interface HomeStore {
  info: HomeInfo | null
  fetchInfo: () => Promise<void>
}

export const useHomeStore = create<HomeStore>((set) => ({
  info: null,
  async fetchInfo() {
    const data = await fetch<HomeInfo>({
      url: api.info,
    })

    set({ info: data })
  },
}))
