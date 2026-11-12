import type { StyleProp, ViewStyle } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BasePage, type BasePageProps } from '@/components/base/BasePage'

export interface CommonPageProps extends Omit<BasePageProps, 'style'> {
  style?: StyleProp<ViewStyle>
}

export const CommonPage = ({ style, ...otherProps }: CommonPageProps) => {
  const styles = useStyles(themeStyles)

  return <BasePage style={[styles.CommonPage, style]} {...otherProps} />
}

const themeStyles = createStyles({
  CommonPage: {
    backgroundColor: '#fff',
  },
})
