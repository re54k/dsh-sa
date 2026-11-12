import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { ModalProps } from 'react-native-modal'
import type { CustomAnimation } from 'react-native-animatable'
import { useMemo, useEffect } from 'react'
import { View, Animated, Platform, Dimensions } from 'react-native'
import Modal from 'react-native-modal'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import mnb from '@mf2e/mnb'
import { useDialogStore, closeDialog } from '@/store/modules/app/dialog'
import { useDialog, DialogContext } from '@/uses/useDialog'

/** 弹窗位置 */
export type DialogPosition = 'top' | 'center' | 'bottom' | 'cover'

export interface BaseDialogProps extends Omit<Partial<ModalProps>, 'style' | 'children' | 'onBackdropPress'> {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  /** 弹窗名称，用于与弹窗配置匹配 */
  dialog: string
  /** 弹窗位置 */
  position?: DialogPosition
  /** 点击遮罩回调 */
  onBackdropPress?: () => void
}

export const BaseDialog = ({
  style,
  children,
  dialog,
  position = 'center',
  onBackdropPress = closeDialog,
  ...otherProps
}: BaseDialogProps) => {
  const styles = useStyles(themeStyles)

  const dialogConfigs = useDialogStore((s) => s.dialogConfigs)
  const { propagateSwipe, scrollProps, scrollResponder } = useDialog()

  const isVisible = useMemo(() => {
    return dialogConfigs.find((item) => item.dialog === dialog)?.visible
  }, [dialog, dialogConfigs])

  const modalProps = useMemo<Partial<ModalProps>>(() => {
    switch (position) {
      case 'top':
        return {
          animationIn: 'slideInDown',
          animationOut: 'slideOutUp',
        }
      case 'center':
        return {
          animationIn: {
            from: {
              opacity: 0,
              scale: 0.8,
            },
            to: {
              opacity: 1,
              scale: 1,
            },
          } as CustomAnimation,
          animationOut: {
            from: {
              opacity: 1,
              scale: 1,
            },
            to: {
              opacity: 0,
              scale: 0.8,
            },
          } as CustomAnimation,
        }
      case 'bottom':
        return {
          animationIn: 'slideInUp',
          animationOut: 'slideOutDown',
          useNativeDriver: false,
          swipeDirection: 'down',
          onSwipeComplete: () => closeDialog(),
          propagateSwipe,
          scrollTo: () => {},
          scrollOffset: 1,
        }
      case 'cover':
        return {
          animationIn: 'fadeIn',
          animationOut: 'fadeOut',
        }
      default:
        return {}
    }
  }, [position, propagateSwipe])

  // 弹窗打开时禁用客户端手势, iOS开启手势协同，Android物理返回键关闭弹窗
  useEffect(() => {
    switch (Platform.OS) {
      case 'ios':
        mnb('app.disableGesture')
        position === 'bottom' && mnb('app.gestureSimultaneous', { enable: true })
        break
      case 'android':
        mnb('app.disableGesture')
        mnb('navigator.keyBackExit', { exit: false })
        mnb.on('navigator.backPress', onBackdropPress)
        break
      default:
        break
    }

    return () => {
      if (dialogConfigs.length > 1) return

      switch (Platform.OS) {
        case 'ios':
          mnb('app.enableGesture')
          position === 'bottom' && mnb('app.gestureSimultaneous', { enable: false })
          break
        case 'android':
          mnb('app.enableGesture')
          mnb('navigator.keyBackExit', { exit: true })
          mnb.off('navigator.backPress', onBackdropPress)
          break
        default:
          break
      }
    }
  }, [dialogConfigs.length, position, onBackdropPress])

  return (
    <Modal
      style={styles.BaseDialog}
      isVisible={isVisible}
      coverScreen={false}
      useNativeDriver={true}
      useNativeDriverForBackdrop={true}
      statusBarTranslucent={true}
      deviceWidth={Dimensions.get('screen').width}
      deviceHeight={Dimensions.get('screen').height}
      onBackdropPress={onBackdropPress}
      {...modalProps}
      {...otherProps}
    >
      <DialogContext.Provider value={{ scrollProps }}>
        <View style={styles.container} pointerEvents="box-none">
          <Animated.View style={[styles[position], style]} {...scrollResponder?.panHandlers}>
            {children}
          </Animated.View>
        </View>
      </DialogContext.Provider>
    </Modal>
  )
}

const themeStyles = createStyles({
  BaseDialog: {
    justifyContent: 'flex-start',
    margin: 0,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  top: {
    alignSelf: 'flex-start',
  },
  center: {
    alignSelf: 'center',
  },
  bottom: {
    alignSelf: 'flex-end',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
})
