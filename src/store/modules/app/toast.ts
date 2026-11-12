import { create } from 'zustand'

interface ToastConfig {
  toast?: string
  visible?: boolean
  timer?: ReturnType<typeof setTimeout>
}

interface ToastStore {
  toastConfig: ToastConfig
  showToast: (toast: string) => void
  hideToast: () => void
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toastConfig: {},
  /**
   * 展示toast提示
   * @param toast 文本内容
   */
  showToast(toast) {
    const prevTimer = get().toastConfig.timer
    prevTimer && clearTimeout(prevTimer)

    const timer = setTimeout(() => {
      get().hideToast()
    }, 2000)

    set({ toastConfig: {} })
    setTimeout(() => {
      set({ toastConfig: { toast, visible: true, timer } })
    }, 0)
  },
  /**
   * 隐藏toast提示
   */
  hideToast() {
    const prevTimer = get().toastConfig.timer
    prevTimer && clearTimeout(prevTimer)

    const timer = setTimeout(() => {
      set({ toastConfig: {} })
    }, 300)

    set({ toastConfig: { ...get().toastConfig, visible: false, timer } })
  },
}))

// 导出独立方法
export const showToast = (toast: string) => {
  useToastStore.getState().showToast(toast)
}
export const hideToast = () => {
  useToastStore.getState().hideToast()
}
