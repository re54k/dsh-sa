import type { ShareParams } from '@/utils/share'
import { useState, useCallback, useEffect } from 'react'
import mnb from '@mf2e/mnb'
import { openDialog, closeDialog } from '@/store/modules/app/dialog'
import { getShareScheme, getShareUrl, getShareQRCodeUrl } from '@/utils/share'

/** 分享配置 */
export interface ShareConfig {
  title: string
  desc: string
  imgUrl: string
  urlParams: ShareParams | null
  cardDialog: string | null
  IMChatData: Record<string, unknown>
}

export interface UseShareReturn {
  /** 更新分享配置 */
  updateShareConfig: (config: Partial<ShareConfig>) => void
  /** 唤起系统分享菜单 */
  showShareMenu: () => void
  /** 生成分享卡片，拉起分享卡片弹窗 */
  doShareCard: (cardDialog?: string | null, urlParams?: ShareParams | null) => Promise<void>
}

const defaultShareConfig: ShareConfig = {
  title: '分享标题',
  desc: '分享描述',
  imgUrl: 'https://static.ws.126.net/163/frontend/share/images/bee/logo144.png',
  urlParams: null,
  cardDialog: null,
  IMChatData: {},
}

export const useShare = (): UseShareReturn => {
  const [shareConfig, setShareConfig] = useState<ShareConfig | null>(null)

  const updateShareConfig = useCallback((config: Partial<ShareConfig>) => {
    setShareConfig((prevConfig) => Object.assign({}, defaultShareConfig, prevConfig, config))
  }, [])

  const showShareMenu = useCallback(() => {
    if (!shareConfig) return
    const { title, desc, imgUrl, urlParams, cardDialog, IMChatData } = shareConfig || {}

    mnb('share.showShareMenu', {
      showShareCard: !!cardDialog,
      hideCopyUrl: false,
      showIMChat: true,
      IMChatData: {
        type: 'activity',
        imageRatio: 1,
        image: imgUrl,
        title: title,
        description: desc,
        link: getShareScheme(urlParams),
        ...IMChatData,
      },
    })
  }, [shareConfig])

  const doShareCard = useCallback(async (cardDialog?: string | null, urlParams?: ShareParams | null) => {
    !__DEV__ && mnb('share.showShareCardLoading', { showIMChat: true })

    const qrcodeUrl = await getShareQRCodeUrl(urlParams)
    cardDialog && openDialog(cardDialog, { qrcodeUrl })

    const onClose = () => {
      mnb.off('share.shareCardDismiss', onClose)
      cardDialog && closeDialog(cardDialog)
    }

    !__DEV__ && mnb.on('share.shareCardDismiss', onClose)
  }, [])

  const handleShareTap = useCallback(
    async ({ tag }: { tag: number }) => {
      const { title, desc, imgUrl, urlParams, cardDialog } = shareConfig || {}

      switch (tag) {
        case 500:
          await doShareCard(cardDialog, urlParams)
          break
        default:
          const url = await getShareUrl(urlParams)
          mnb('share.share', {
            tag,
            imageUrl: imgUrl,
            title: title,
            text: desc,
            url,
          })
          break
      }
    },
    [shareConfig, doShareCard],
  )

  useEffect(() => {
    if (!shareConfig) return

    mnb.on('share.handleShareTap', handleShareTap)

    return () => {
      mnb.off('share.handleShareTap', handleShareTap)
    }
  }, [shareConfig, handleShareTap])

  return {
    updateShareConfig,
    showShareMenu,
    doShareCard,
  }
}
