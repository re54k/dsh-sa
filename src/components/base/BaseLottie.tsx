import type { StyleProp, ViewStyle } from 'react-native'
import type { LottieViewProps } from 'lottie-react-native'
import { forwardRef } from 'react'
import { View, StyleSheet } from 'react-native'
import LottieView from 'lottie-react-native'

export interface BaseLottieProps extends Omit<LottieViewProps, 'style'> {
  style?: StyleProp<ViewStyle>
}

export const BaseLottie = forwardRef<LottieView, BaseLottieProps>(
  ({ style, source, onAnimationFinish, ...otherProps }, ref) => {
    return (
      <View style={style}>
        <LottieView
          style={StyleSheet.absoluteFill}
          ref={ref}
          source={source}
          onAnimationFinish={onAnimationFinish}
          {...otherProps}
        />
      </View>
    )
  },
)
