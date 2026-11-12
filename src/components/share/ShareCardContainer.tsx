import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { useCallback } from 'react'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { ShareCardShot } from './ShareCardShot'
import mnb from '@mf2e/mnb'

export interface ShareCardContainerProps {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

export const ShareCardContainer = ({ style, children }: ShareCardContainerProps) => {
  const styles = useStyles(themeStyles)

  const doShare = useCallback(async (data?: string) => {
    if (__DEV__) return

    try {
      await mnb('share.shareCard', {
        mode: 'localPath',
        data,
        shareText: '分享图片',
        shortUrl: ' ',
        showIMChat: true,
      })
    } catch (e) {
      console.log(e)

      const onRetry = () => {
        mnb.off('share.shareCardRetry', onRetry)
        doShare(data)
      }
      mnb.on('share.shareCardRetry', onRetry)
      mnb('share.showShareCardFail')
    }
  }, [])

  return (
    <ShareCardShot style={[styles.ShareCardContainer, style]} onShot={doShare}>
      {children}
    </ShareCardShot>
  )
}

const themeStyles = createStyles({
  ShareCardContainer: {
    position: 'relative',
  },
})
