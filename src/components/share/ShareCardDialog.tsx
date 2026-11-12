import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { createStyles, useStyles, ThemeContext } from '@mf2e/react-native-theme-styles'
import { BaseDialog, type BaseDialogProps } from '@/components/base/BaseDialog'

export interface ShareCardDialogProps extends Omit<BaseDialogProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

export const ShareCardDialog = ({ style, children, ...otherProps }: ShareCardDialogProps) => {
  const styles = useStyles(themeStyles)

  return (
    <BaseDialog style={[styles.ShareCardDialog, style]} hasBackdrop={__DEV__} {...otherProps}>
      <ThemeContext.Provider value="light">{children}</ThemeContext.Provider>
    </BaseDialog>
  )
}

const themeStyles = createStyles({
  ShareCardDialog: {
    position: 'relative',
  },
})
