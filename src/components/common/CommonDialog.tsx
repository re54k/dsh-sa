import type { StyleProp, ViewStyle } from 'react-native'
import { Pressable } from 'react-native'
import { createStyles, useStyles, ThemeImage } from '@mf2e/react-native-theme-styles'
import { Assets } from '@/assets'
import { BaseDialog, type BaseDialogProps } from '@/components/base/BaseDialog'
import { closeDialog } from '@/store/modules/app/dialog'
import { BOTTOM_SPACE } from '@/utils/const'

export interface CommonDialogProps extends Omit<BaseDialogProps, 'style' | 'onBackdropPress'> {
  style?: StyleProp<ViewStyle>
  /** 点击遮罩回调 */
  onBackdropPress?: () => void
}

export const CommonDialog = ({ style, onBackdropPress = closeDialog, ...otherProps }: CommonDialogProps) => {
  const styles = useStyles(themeStyles)

  return (
    <BaseDialog
      style={[styles.CommonDialog, style]}
      onBackdropPress={onBackdropPress}
      customBackdrop={
        <Pressable style={styles.backdrop} onPress={onBackdropPress}>
          <ThemeImage style={styles.close} source={Assets.dialogClose} />
        </Pressable>
      }
      {...otherProps}
    />
  )
}

const themeStyles = createStyles({
  CommonDialog: {
    position: 'relative',
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  close: {
    position: 'absolute',
    bottom: 70 + BOTTOM_SPACE,
    width: 32,
    height: 32,
  },
})
