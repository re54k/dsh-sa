import type { CustomAnimation } from 'react-native-animatable'
import { View, Text } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import Modal from 'react-native-modal'
import { useToastStore } from '@/store/modules/app/toast'

export const AppToast = () => {
  const styles = useStyles(themeStyles)

  const toastConfig = useToastStore((s) => s.toastConfig)

  return (
    toastConfig.toast && (
      <Modal
        style={styles.AppToast}
        isVisible={toastConfig.visible ?? false}
        hasBackdrop={false}
        coverScreen={false}
        useNativeDriver={true}
        statusBarTranslucent={true}
        // animatable 动画属性（scale 等）不在 RN 样式类型内，需断言跳过过窄的类型定义
        animationIn={
          {
            from: {
              opacity: 0,
              scale: 0.5,
            },
            to: {
              opacity: 1,
              scale: 1,
            },
          } as CustomAnimation
        }
        animationOut="fadeOut"
      >
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastConfig.toast}</Text>
        </View>
      </Modal>
    )
  )
}

const themeStyles = createStyles({
  AppToast: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  toast: {
    maxWidth: '60%',
    padding: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  toastText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
    textAlign: 'center',
  },
})
