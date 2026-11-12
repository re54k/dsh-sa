import { dialogs } from '@/dialogs'
import { useDialogStore } from '@/store/modules/app/dialog'

export const AppModal = () => {
  const dialogConfigs = useDialogStore((s) => s.dialogConfigs)

  const configs = dialogConfigs.map((item) => {
    const DialogComponent = dialogs.find((subItem) => subItem.dialog === item.dialog)?.component
    return { DialogComponent, ...item }
  })

  return configs.map(({ DialogComponent, dialog, params }) =>
    DialogComponent ? <DialogComponent key={dialog} {...params} /> : null,
  )
}
