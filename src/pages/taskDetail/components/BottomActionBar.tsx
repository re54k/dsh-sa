import type { ReactElement } from 'react'
import { Pressable, Text, View } from 'react-native'
import { createStyles, useStyles, ThemeImage } from '@mf2e/react-native-theme-styles'
import { showToast } from '@/store/modules/app/toast'
import { openDialog } from '@/store/modules/app/dialog'
import type { ActivityBaseInfo, ActivityUserStatus } from '@/types/BeeEarnCommonType'
import { Assets } from '../assets'

interface BottomActionBarProps {
  info?: ActivityBaseInfo
  userStatus?: ActivityUserStatus
  /** 是否配置了群聊入口（groupInfo/weworkQrUrl，仅报名成功展示） */
  hasGroupEntry?: boolean
  /** 联系邮箱（已下发则报名流程跳过邮箱弹窗直进协议弹窗） */
  userEmail?: string
}

/** 吸底操作栏按钮形态 */
interface BarButton {
  text: string
  /** 黄色可点 / 灰色（可点带箭头跳转查看，禁用无箭头） */
  type: 'primary' | 'gray'
  arrow?: boolean
}

/**
 * 吸底操作栏（视觉稿 11:1109 底部 + 58:3319 按钮状态矩阵 12 态）
 * 优先级（PRD）：已满员 > 未满足条件提示
 */
export const BottomActionBar = ({ info, userStatus, hasGroupEntry, userEmail }: BottomActionBarProps): ReactElement => {
  const styles = useStyles(themeStyles)
  const button = resolveButton(info, userStatus)

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        {hasGroupEntry && userStatus?.status === 2 ? (
          <View style={styles.groupRow}>
            <Pressable style={styles.groupItem} onPress={onGroupPress}>
              <ThemeImage style={styles.groupIcon} source={Assets.iconGroupChat} />
              <Text style={styles.groupText}>加入群聊</Text>
            </Pressable>
            <Pressable style={styles.groupItem} onPress={onWeworkPress}>
              <ThemeImage style={styles.groupIcon} source={Assets.iconWework} />
              <Text style={styles.groupText}>企业微信</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.applyCount}>{formatApplyCount(info)}</Text>
        )}
      </View>
      <Pressable
        style={[styles.button, button.type === 'gray' && styles.buttonGray]}
        onPress={() => onButtonPress(button, info, userStatus, userEmail)}
      >
        <Text style={[styles.buttonText, button.type === 'gray' && styles.buttonTextGray]}>{button.text}</Text>
        {button.arrow && <ThemeImage style={styles.buttonArrow} source={Assets.iconArrowDetail} />}
      </Pressable>
    </View>
  )
}

/**
 * 按钮状态机（12 态）：activityInfo.status（1 报名中 2 已满 3-6 进行中 7 已结算 8 未完成）
 * + userStatus.status（0 可报名 1 待审核 2 报名成功 3 未通过 4 已取消 5 已移除 6 已拉黑 7 已退出 8 不可参与）
 */
const resolveButton = (info?: ActivityBaseInfo, userStatus?: ActivityUserStatus): BarButton => {
  const us = userStatus?.status ?? 0

  // 已满员优先（PRD：已满员 > 未满足条件提示）
  if (info?.status === 2) return { text: '已满员', type: 'gray' }

  if (info?.status === 1) {
    if (us === 1) return { text: '报名审核中', type: 'primary', arrow: true }
    if (us === 2) return { text: '查看任务进度', type: 'primary', arrow: true }
    if (us === 3) return { text: '报名审核不通过', type: 'gray', arrow: true }
    if (us === 8 || us === 5 || us === 6 || us === 7) {
      // 冷静期等限制：视觉与「我要报名」一致，点击 Toast 提示
      return { text: '我要报名', type: 'primary' }
    }
    return { text: '我要报名', type: 'primary' }
  }

  if ((info?.status ?? 0) >= 3 && (info?.status ?? 0) <= 6) {
    if (us === 2) return { text: '任务进行中', type: 'primary', arrow: true }
    if (us === 4 || us === 7) return { text: '已取消', type: 'gray', arrow: true }
    return { text: '任务已开始，报名结束', type: 'gray' }
  }

  if (info?.status === 7) {
    if (us === 0) return { text: '任务已结束', type: 'gray' }
    return { text: '任务已结束', type: 'gray', arrow: true }
  }

  return { text: '任务已结束', type: 'gray' }
}

/** 左侧报名人数文案（0 人时「抢先报名」） */
const formatApplyCount = (info?: ActivityBaseInfo): string => {
  const count = info?.applyCount ?? 0
  return count > 0 ? `${count}人已报名` : '抢先报名'
}

/** 群聊入口（M10 未还原，占位） */
const onGroupPress = (): void => {
  // TODO: M10 加入群聊实现后接入
}

/** 企微二维码浮层（M10 未还原，占位） */
const onWeworkPress = (): void => {
  // TODO: M10 企微群二维码浮层实现后接入
}

/** 主按钮点击分发 */
const onButtonPress = (
  button: BarButton,
  info?: ActivityBaseInfo,
  userStatus?: ActivityUserStatus,
  userEmail?: string,
): void => {
  const us = userStatus?.status ?? 0

  switch (button.text) {
    case '我要报名':
      // 冷静期等限制用户：Toast 提示（M13 文案）
      if (us === 5 || us === 6 || us === 7 || us === 8) {
        showToast('异常退出任务，已限制报名')
        return
      }
      // 报名流程：邮箱未下发先弹邮箱，已下发直进协议弹窗
      openDialog(userEmail ? 'agreement' : 'email', { activityId: info?.activityId, email: userEmail })
      return
    case '报名审核中':
    case '查看任务进度':
    case '任务进行中':
    case '已取消':
    case '报名审核不通过':
    case '任务已结束':
      if (button.arrow && info?.activityId) {
        // TODO: M3 任务进度详情页实现后接入 openPage('task-progress', { activityId })
      }
      return
    case '已满员':
      showToast('报名人数已满，无法报名')
      return
    case '任务已开始，报名结束':
    default:
      return
  }
}

const themeStyles = createStyles({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 34,
  },
  left: {
    flex: 1,
  },
  applyCount: {
    fontSize: 13,
    lineHeight: 16.8,
    color: '#333',
  },
  groupRow: {
    flexDirection: 'row',
  },
  groupItem: {
    width: 48,
    alignItems: 'center',
    marginRight: 10,
  },
  groupIcon: {
    width: 24,
    height: 24,
    marginBottom: 2,
  },
  groupText: {
    fontSize: 12,
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 30,
    backgroundColor: '#ffd917',
    paddingHorizontal: 20,
  },
  buttonGray: {
    backgroundColor: '#f2f2f2',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  buttonTextGray: {
    color: '#999',
  },
  buttonArrow: {
    width: 12,
    height: 12,
    marginLeft: 6,
  },
})
