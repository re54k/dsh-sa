import type { StyleProp, ViewStyle } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BaseNav, type BaseNavProps } from '@/components/base/BaseNav'

export interface CommonNavProps extends Omit<BaseNavProps, 'style'> {
  style?: StyleProp<ViewStyle>
}

export const CommonNav = ({ style, ...otherProps }: CommonNavProps) => {
  const styles = useStyles(themeStyles)

  return <BaseNav style={[styles.CommonNav, style]} {...otherProps} />
}

const themeStyles = createStyles({
  CommonNav: {
    position: 'relative',
  },
})
