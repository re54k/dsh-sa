import { View } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { HelloReactNative } from '@/components/HelloReactNative'

export const HomeMain = () => {
  const styles = useStyles(themeStyles)

  return (
    <View style={styles.HomeMain}>
      <HelloReactNative />
    </View>
  )
}

const themeStyles = createStyles({
  HomeMain: {
    flex: 1,
  },
})
