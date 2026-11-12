import type { ReactElement } from 'react'
import { Text, View } from 'react-native'
import { createStyles, useStyles, ThemeImage, type ThemeImageSource } from '@mf2e/react-native-theme-styles'
import type { ActivityBaseInfo, UserInfo, VerifyInfo } from '@/types/BeeEarnCommonType'
import { Assets } from '../assets'

interface TaskSummaryCardProps {
  info?: ActivityBaseInfo
  user?: UserInfo
}

/**
 * 任务主体卡片（视觉稿 11:1109）：发布者行 + 标题 + 金额 + 标签 + 灰底信息块
 */
export const TaskSummaryCard = ({ info, user }: TaskSummaryCardProps): ReactElement => {
  const styles = useStyles(themeStyles)
  const verify = user?.verifyInfo?.[0]

  return (
    <View style={styles.card}>
      <View style={styles.publisherRow}>
        <View style={styles.publisherLeft}>
          {user?.head ? (
            <ThemeImage style={styles.avatar} source={{ uri: user.head }} optimize={false} />
          ) : (
            <View style={styles.avatar} />
          )}
          <Text style={styles.nick} numberOfLines={1}>
            {user?.nick}
          </Text>
          {verify && <VerifyMark verify={verify} />}
        </View>
        <Text style={styles.follow}>{formatFollow(user?.followStatus)}</Text>
      </View>

      <Text style={styles.title}>{info?.name}</Text>
      <Text style={styles.reward}>{info?.rewardDisplay}</Text>

      {!!info?.tags?.length && (
        <View style={styles.tagRow}>
          {info.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoBlock}>
        <View style={styles.infoRow}>
          <ThemeImage style={styles.infoIcon} source={Assets.iconFlag} />
          <Text style={styles.infoText}>报名时间：{formatTimeRange(info?.applyStartTime, info?.applyEndTime)}</Text>
        </View>
        <View style={styles.infoRow}>
          <ThemeImage style={styles.infoIcon} source={Assets.iconCalendarCheck} />
          <Text style={styles.infoText}>完成时间：{formatTimeRange(info?.submitStartTime, info?.submitEndTime)}</Text>
        </View>
        {(info?.applyMaxCount ?? 0) > 0 && (
          <View style={styles.infoRow}>
            <ThemeImage style={styles.infoIcon} source={Assets.iconUserPlus} />
            <Text style={styles.infoText}>
              参与人数：{info?.applyCount ?? 0}人报名/{info?.applyMaxCount}人满员
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

/** 官方认证组：V 标 + 认证文字 */
const VerifyMark = ({ verify }: { verify: VerifyInfo }): ReactElement => {
  const styles = useStyles(themeStyles)
  const icon = verify.authIcon
  const source: ThemeImageSource | undefined = icon?.daytime
    ? {
        light: { uri: icon.daytime },
        dark: { uri: icon.darkmode || icon.daytime },
        night: { uri: icon.night || icon.daytime },
      }
    : undefined

  return (
    <View style={styles.verifyRow}>
      {source && <ThemeImage style={styles.verifyIcon} source={source} optimize={false} />}
      <Text style={styles.verifyText} numberOfLines={1}>
        {verify.authText}
      </Text>
    </View>
  )
}

/** 关注状态文案：0/3 → 关注，1/2 → 已关注 */
const formatFollow = (status?: number): string => {
  if (status === 1 || status === 2) return '已关注'
  return '关注'
}

/** 时间戳 → 「8月22日 12:00」 */
const formatTime = (ts?: number): string => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 时间区间 → 「8月22日 12:00～9月10日 12:00」 */
const formatTimeRange = (start?: number, end?: number): string => {
  if (!start || !end) return ''
  return `${formatTime(start)}～${formatTime(end)}`
}

const themeStyles = createStyles({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  publisherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  publisherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  nick: {
    maxWidth: 110,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19.6,
    color: '#333',
    marginRight: 2,
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyIcon: {
    width: 12,
    height: 12,
    marginRight: 2,
  },
  verifyText: {
    maxWidth: 80,
    fontSize: 12,
    lineHeight: 12,
    color: '#999',
  },
  follow: {
    width: 58,
    height: 26,
    borderRadius: 20,
    backgroundColor: '#ffd917',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 14,
    color: '#333',
    overflow: 'hidden',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  reward: {
    fontSize: 18,
    fontWeight: '600',
    color: '#783c00',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    height: 22,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
    justifyContent: 'center',
  },
  tagText: {
    fontSize: 13,
    lineHeight: 13,
    color: '#555',
  },
  infoBlock: {
    backgroundColor: '#f5f7f9',
    borderRadius: 8,
    padding: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 16.8,
    color: '#333',
  },
})
