import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BaseNav } from '@/components/base/BaseNav'

export const HomeNav = () => {
  const styles = useStyles(themeStyles)

  return <BaseNav style={styles.HomeNav} navTransparent={true} />
}

const themeStyles = createStyles({
  HomeNav: {
    position: 'relative',
  },
})
