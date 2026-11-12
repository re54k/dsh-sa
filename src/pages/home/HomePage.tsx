import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BasePage } from '@/components/base/BasePage'
import { HomeNav } from './HomeNav'
import { HomeMain } from './HomeMain'

export const HomePage = () => {
  const styles = useStyles(themeStyles)

  return <BasePage style={styles.HomePage} nav={<HomeNav />} main={<HomeMain />} />
}

const themeStyles = createStyles({
  HomePage: {
    backgroundColor: '#fff',
  },
})
