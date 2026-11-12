import { View, Text } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
// import { BaseLottie } from '@/components/base/BaseLottie'
// import { Assets } from '@/assets'

export const HelloReactNative = () => {
  const styles = useStyles(themeStyles)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello React Native</Text>
      {/*<BaseLottie style={styles.logo} source={Assets.lottie} autoPlay loop />*/}
    </View>
  )
}

const themeStyles = createStyles({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 100,
    width: '100%',
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  logo: {
    transform: [{ scale: 1.5 }],
    width: 200,
    height: 200,
    borderRadius: 10,
  },
})
