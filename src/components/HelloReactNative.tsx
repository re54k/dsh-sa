import { useRef } from 'react'
import { View, Text, Pressable, Animated, Easing } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
// import { BaseLottie } from '@/components/base/BaseLottie'
// import { Assets } from '@/assets'

export const HelloReactNative = () => {
  const styles = useStyles(themeStyles)
  // 累计旋转角度（度），每点击一次顺时针旋转 90°
  const rotate = useRef(new Animated.Value(0)).current
  const rotation = useRef(0)
  // 旋转动画进行中忽略新的点击
  const isAnimating = useRef(false)

  const handlePress = () => {
    if (isAnimating.current) {
      return
    }
    isAnimating.current = true
    rotation.current += 90
    Animated.timing(rotate, {
      toValue: rotation.current,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      isAnimating.current = false
    })
  }

  const rotateStyle = {
    transform: [
      {
        rotate: rotate.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress}>
        <Animated.Text style={[styles.title, rotateStyle]}>Hello React Native</Animated.Text>
      </Pressable>
      <Text style={styles.tip}>点击文字旋转</Text>
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
    marginBottom: 24,
    width: '100%',
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  tip: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  logo: {
    transform: [{ scale: 1.5 }],
    width: 200,
    height: 200,
    borderRadius: 10,
  },
})
