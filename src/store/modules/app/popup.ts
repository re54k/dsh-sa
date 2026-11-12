import { create } from 'zustand'

interface PopupConfig {
  popup: string
}

interface PopupStore {
  popupConfigs: PopupConfig[]
  showPopup: (popup: string) => void
  hidePopup: (popup?: string) => void
}

export const usePopupStore = create<PopupStore>((set, get) => ({
  popupConfigs: [],
  /**
   * 展示popup提示
   * @param popup 提示名称
   */
  showPopup(popup) {
    if (get().popupConfigs.some((item) => item.popup === popup)) return

    set({ popupConfigs: [...get().popupConfigs, { popup }] })
  },
  /**
   * 隐藏popup提示
   * @param popup 提示名称
   */
  hidePopup(popup) {
    if (popup === undefined) {
      set({ popupConfigs: [] })
      return
    }

    set({ popupConfigs: get().popupConfigs.filter((item) => item.popup !== popup) })
  },
}))

// 导出独立方法
export const showPopup = (popup: string) => {
  usePopupStore.getState().showPopup(popup)
}
export const hidePopup = (popup?: string) => {
  usePopupStore.getState().hidePopup(popup)
}
