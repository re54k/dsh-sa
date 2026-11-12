import { Pressable, Text } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BaseDialog, type BaseDialogProps } from '@/components/base/BaseDialog'
import { closeDialog } from '@/store/modules/app/dialog'

export interface AlertDialogProps extends Omit<BaseDialogProps, 'style' | 'dialog'> {
  /** 标题 */
  title: string
  /** 描述内容 */
  desc?: string
  /** 按钮文案 */
  btnText?: string
  /** 按钮点击回调 */
  onBtnPress?: () => void
}

export const AlertDialog = ({ title, desc, btnText, onBtnPress, ...otherProps }: AlertDialogProps) => {
  const styles = useStyles(themeStyles)

  return (
    <BaseDialog style={styles.AlertDialog} dialog="alert" {...otherProps}>
      <Text style={styles.title}>{title}</Text>
      {desc && <Text style={styles.desc}>{desc}</Text>}
      <Pressable style={styles.btn} onPress={onBtnPress || (() => closeDialog())}>
        <Text style={styles.btnText}>{btnText || '我知道了'}</Text>
      </Pressable>
    </BaseDialog>
  )
}

const themeStyles = createStyles({
  AlertDialog: {
    alignItems: 'center',
    maxWidth: 300,
    padding: 26,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  title: {
    marginTop: 5,
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
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 145,
    height: 40,
    marginTop: 16,
    borderRadius: 33,
    backgroundColor: '#FFE21F',
  },
  btnText: {
    color: '#333332',
    fontSize: 16,
  },
})
