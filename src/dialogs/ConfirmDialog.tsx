import { View, Pressable, Text } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BaseDialog, type BaseDialogProps } from '@/components/base/BaseDialog'
import { closeDialog } from '@/store/modules/app/dialog'

export interface ConfirmDialogProps extends Omit<BaseDialogProps, 'style' | 'dialog' | 'onBackdropPress'> {
  /** 标题 */
  title: string
  /** 描述内容 */
  desc?: string
  /** 取消按钮文案 */
  cancelText?: string
  /** 确认按钮文案 */
  confirmText?: string
  /** 取消回调 */
  onCancel?: () => void
  /** 确认回调 */
  onConfirm?: () => void
}

export const ConfirmDialog = ({
  title,
  desc,
  cancelText,
  confirmText,
  onCancel,
  onConfirm,
  ...otherProps
}: ConfirmDialogProps) => {
  const styles = useStyles(themeStyles)

  const onCancelPress = () => {
    closeDialog()
    onCancel?.()
  }

  const onConfirmPress = () => {
    closeDialog()
    onConfirm?.()
  }

  return (
    <BaseDialog style={styles.ConfirmDialog} dialog="confirm" onBackdropPress={onCancelPress} {...otherProps}>
      <Text style={styles.title}>{title}</Text>
      {desc && <Text style={styles.desc}>{desc}</Text>}
      <View style={styles.btns}>
        <Pressable style={[styles.btn, styles.cancel]} onPress={onCancelPress}>
          <Text style={styles.cancelText}>{cancelText || '取消'}</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.confirm]} onPress={onConfirmPress}>
          <Text style={styles.confirmText}>{confirmText || '确定'}</Text>
        </Pressable>
      </View>
    </BaseDialog>
  )
}

const themeStyles = createStyles({
  ConfirmDialog: {
    alignItems: 'center',
    maxWidth: 300,
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  title: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
  },
  desc: {
    marginTop: 10,
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  btns: {
    flexDirection: 'row',
    marginTop: 18,
  },
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 94,
    height: 32,
    borderRadius: 16,
  },
  cancel: {
    borderWidth: 1,
    borderColor: '#979797',
  },
  cancelText: {
    color: '#333',
    fontSize: 16,
  },
  confirm: {
    marginLeft: 10,
    backgroundColor: '#FFD70A',
  },
  confirmText: {
    color: '#333332',
    fontSize: 16,
  },
})
