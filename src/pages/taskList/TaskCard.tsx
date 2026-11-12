import type { ReactElement } from 'react'
import { Pressable, Text, View } from 'react-native'
import { createStyles, useStyles, ThemeImage, type ThemeImageSource } from '@mf2e/react-native-theme-styles'
import { openPage } from '@/store/modules/app/page'
import type { ActivityListItem } from '@/types/BeeEarnActivityType'
import type { ActivityBaseInfo, VerifyInfo } from '@/types/BeeEarnCommonType'

interface TaskCardProps {
  item: ActivityListItem
}

/**
 * 任务概要卡片（视觉稿「任务概要」组件 93:5191）
 * 结构：标题行 → 发布者行（头像+昵称+认证徽标+官方账号）→ 价格行（左价格/右状态）
 */
export const TaskCard = ({ item }: TaskCardProps): ReactElement => {
  const styles = useStyles(themeStyles)
  const info = item.activityInfo
  const verify = item.userInfo?.verifyInfo?.[0]
  const price = formatPrice(info)

  return (
    <Pressable style={styles.card} onPress={() => openTaskDetail(info)}>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {info?.name}
        </Text>
      </View>
      <View style={styles.publisherRow}>
        {item.userInfo?.head ? (
          <ThemeImage style={styles.avatar} source={{ uri: item.userInfo.head }} optimize={false} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}
        <Text style={styles.nick} numberOfLines={1}>
          {item.userInfo?.nick}
        </Text>
        {verify && <VerifyBadge verify={verify} />}
        {verify?.authText && (
          <Text style={styles.authText} numberOfLines={1}>
            {verify.authText}
          </Text>
        )}
      </View>
      <View style={styles.priceRow}>
        <View style={styles.priceWrap}>
          <Text style={styles.price}>{price.amount}</Text>
          {price.unit && <Text style={styles.priceUnit}>{price.unit}</Text>}
        </View>
        <Text style={styles.status} numberOfLines={1}>
          {getStatusText(info)}
        </Text>
      </View>
    </Pressable>
  )
}

/** 价格展示拆分结果：amount 金额主体 / unit 单位小字 */
interface PriceParts {
  amount: string
  unit: string
}

/** 认证徽标：官方认证 icon + 不展示文字（文字由外层 authText 展示） */
const VerifyBadge = ({ verify }: { verify: VerifyInfo }): ReactElement => {
  const styles = useStyles(themeStyles)
  const icon = verify.authIcon
  // 认证图标为多主题 URL：daytime → light、darkmode → dark、night → night
  const source: ThemeImageSource | undefined = icon?.daytime
    ? {
        light: { uri: icon.daytime },
        dark: { uri: icon.darkmode || icon.daytime },
        night: { uri: icon.night || icon.daytime },
      }
    : undefined

  if (!source) return <></>

  return <ThemeImage style={styles.verifyIcon} source={source} optimize={false} />
}

/** 点击卡片进入任务详情页 */
const openTaskDetail = (info?: ActivityBaseInfo): void => {
  if (info?.activityId) {
    openPage('task-detail', { activityId: info.activityId })
  }
}

/**
 * 价格展示（视觉稿「¥ 1.9 - 1500 /篇」）：金额主体大字 + 「/篇」单位小字
 * 有明确价格加「¥」前缀，无价格展示「价格面议」
 */
const formatPrice = (info?: ActivityBaseInfo): PriceParts => {
  const display = info?.rewardDisplay
  if (!display || display.includes('价格面议')) return { amount: '价格面议', unit: '' }

  // 按最后一个「/」拆出单位（如「1-500元/篇」→ 金额「1-500元」+ 单位「/篇」）
  const idx = display.lastIndexOf('/')
  const amount = idx > 0 ? display.slice(0, idx) : display
  const unit = idx > 0 ? display.slice(idx) : ''
  return { amount: `¥ ${amount}`, unit }
}

/**
 * 卡片右侧状态文案（视觉稿 4 态：N人报名 / 报名截止 / 报名截止，进行中 / 已完成）
 * status 枚举见 BeeEarnCommonType：1 报名中 2 已满 3 进行中(投稿中) 4 最后更新 5 审核中 6 结算中 7 已结算 8 未完成
 */
const getStatusText = (info?: ActivityBaseInfo): string => {
  switch (info?.status) {
    case 1: {
      const count = info.applyCount ?? 0
      const max = info.applyMaxCount
      return max && max > 0 ? `${count}/${max}人报名` : `${count}人报名`
    }
    case 2:
      return '报名截止'
    case 3:
      return '报名截止，进行中'
    case 4:
    case 5:
    case 6:
      return '进行中'
    case 7:
      return '已完成'
    default:
      return '已完成'
  }
}

const themeStyles = createStyles({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  titleRow: {
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 16,
    lineHeight: 19.6,
    fontWeight: '600',
    color: '#333',
  },
  publisherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
  },
  avatarPlaceholder: {
    backgroundColor: '#e5e5e5',
  },
  nick: {
    maxWidth: 120,
    fontSize: 12,
    lineHeight: 16.8,
    color: '#666',
    marginRight: 4,
  },
  verifyIcon: {
    width: 11,
    height: 11,
    marginRight: 4,
  },
  authText: {
    fontSize: 10,
    color: '#777',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 16,
    lineHeight: 19.6,
    fontWeight: '600',
    color: '#783c00',
  },
  priceUnit: {
    fontSize: 12,
    lineHeight: 17.6,
    color: '#783c00',
    marginLeft: 2,
  },
  status: {
    fontSize: 14,
    lineHeight: 16.8,
    color: '#666',
  },
})
