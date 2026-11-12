import { create } from 'zustand'
import { queryParams } from '@/utils/inject'

/** 弹窗打开参数，透传给弹窗组件 props，值类型开放 */
type DialogParams = Record<string, unknown>

/** 弹窗关闭回调 */
type DialogCallback = () => void

interface DialogConfig {
  dialog: string
  visible?: boolean
  params?: DialogParams
  callback?: DialogCallback
}

interface DialogStore {
  dialogConfigs: DialogConfig[]
  openDialog: (dialog: string, params?: DialogParams, callback?: DialogCallback) => void
  closeDialog: (dialog?: string) => void
}

export const useDialogStore = create<DialogStore>((set, get) => ({
  dialogConfigs: queryParams.dialog ? [{ dialog: queryParams.dialog, visible: true }] : [],
  /**
   * 打开弹窗
   * @param dialog 弹窗名称
   * @param params 弹窗参数
   * @param callback 弹窗关闭回调
   */
  openDialog(dialog, params, callback) {
    const dialogConfigs = [...get().dialogConfigs]
    const dialogIndex = dialogConfigs.findIndex((item) => item.dialog === dialog)

    if (dialogIndex !== -1) {
      dialogConfigs.splice(dialogIndex, 1)
      set({ dialogConfigs })
      setTimeout(() => {
        set({ dialogConfigs: dialogConfigs.concat([{ dialog, params, callback, visible: true }]) })
      }, 0)
      return
    }

    set({ dialogConfigs: dialogConfigs.concat([{ dialog, params, callback, visible: true }]) })
  },
  /**
   * 关闭弹窗
   * @param dialog 弹窗名称
   */
  closeDialog(dialog) {
    const dialogConfigs = [...get().dialogConfigs]
    const dialogIndex = dialogConfigs.findIndex((item) => item.dialog === dialog)

    let targetDialog: DialogConfig | undefined
    if (dialogIndex !== -1) {
      targetDialog = dialogConfigs.splice(dialogIndex, 1)[0]
    } else if (dialog === undefined) {
      // 未指定弹窗名称时，关闭最顶层弹窗
      targetDialog = dialogConfigs.pop()
    }

    if (targetDialog) {
      set({ dialogConfigs: [...dialogConfigs, { ...targetDialog, visible: false }] })
      targetDialog.callback?.()
      setTimeout(() => {
        set({
          dialogConfigs: get().dialogConfigs.filter((item) => item.dialog !== targetDialog.dialog || item.visible),
        })
      }, 300)
    }
  },
}))

// 导出独立方法
export const openDialog = (dialog: string, params?: DialogParams, callback?: DialogCallback) => {
  useDialogStore.getState().openDialog(dialog, params, callback)
}
export const closeDialog = (dialog?: string) => {
  useDialogStore.getState().closeDialog(dialog)
}
