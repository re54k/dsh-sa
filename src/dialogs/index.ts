import type { ComponentType } from 'react'
import { AlertDialog } from './AlertDialog'
import { ConfirmDialog } from './ConfirmDialog'
import { EmailDialog } from './EmailDialog'
import { AgreementDialog } from './AgreementDialog'

export interface DialogRegistryItem {
  dialog: string
  component: ComponentType<any>
}

export const dialogs: DialogRegistryItem[] = [
  { dialog: 'alert', component: AlertDialog },
  { dialog: 'confirm', component: ConfirmDialog },
  { dialog: 'email', component: EmailDialog },
  { dialog: 'agreement', component: AgreementDialog },
]
