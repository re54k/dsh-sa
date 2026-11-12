import type { StyleProp, ViewStyle } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BaseSuspense, type BaseSuspenseProps } from '@/components/base/BaseSuspense'
import { PageLoading, PageError, PageEmpty } from '@bee/page-ui'

export interface CommonSuspenseProps extends Omit<BaseSuspenseProps, 'style'> {
  style?: StyleProp<ViewStyle>
  /** 加载/错误/空状态是否透明背景 */
  bgTransparent?: boolean
}

export const CommonSuspense = ({ style, bgTransparent, ...otherProps }: CommonSuspenseProps) => {
  const styles = useStyles(themeStyles)

  return (
    <BaseSuspense
      style={[styles.CommonSuspense, style]}
      loading={<PageLoading style={bgTransparent && styles.bgTransparent} />}
      error={<PageError style={bgTransparent && styles.bgTransparent} />}
      empty={<PageEmpty style={bgTransparent && styles.bgTransparent} />}
      {...otherProps}
    />
  )
}

const themeStyles = createStyles({
  CommonSuspense: {
    flex: 1,
  },
  bgTransparent: {
    backgroundColor: 'transparent',
  },
})
