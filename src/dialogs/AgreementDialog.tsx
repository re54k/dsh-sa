import type { ReactElement } from 'react'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BaseDialog, type BaseDialogProps } from '@/components/base/BaseDialog'
import { closeDialog } from '@/store/modules/app/dialog'
import { useApplyStore } from '@/store/modules/apply'
import { showToast } from '@/store/modules/app/toast'

export interface AgreementDialogProps extends Omit<BaseDialogProps, 'style' | 'dialog' | 'onBackdropPress'> {
  /** 任务 ID */
  activityId?: string
  /** 联系邮箱（邮箱弹窗透传） */
  email?: string
}

/**
 * 协议确认底部弹窗（视觉稿 61:3898）：✕ + 标题 + bullet 正文 + 圆形勾选行 + 「确认」黄胶囊。
 * 勾选后点击确认提交报名（apply/submit），Toast 报名结果。
 */
export const AgreementDialog = ({ activityId, email, ...otherProps }: AgreementDialogProps): ReactElement => {
  const styles = useStyles(themeStyles)
  const [checked, setChecked] = useState(false)
  const submitApply = useApplyStore((s) => s.submitApply)

  const onConfirm = async (): Promise<void> => {
    if (!checked || !activityId) return
    try {
      await submitApply({ activityId, email })
      closeDialog()
      showToast('报名成功\n已提交\n请耐心等待审核结果')
    } catch {
      // 失败提示由 fetch 的 errorToast 机制统一处理
    }
  }

  return (
    <BaseDialog dialog="agreement" position="bottom" style={styles.panel} onBackdropPress={() => closeDialog()} {...otherProps}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>活动规则和隐私协议</Text>
        <Pressable hitSlop={12} onPress={() => closeDialog()} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </View>
      <View style={styles.body}>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bodyText}>活动期间需保持平台的认证状态，认证状态失效将无法记录</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bodyText}>如需新增活动参与账号，请在活动页面 -「我的订单」-「个人信息」添加认证账号</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bodyText}>
            若个人账号已被绑定或有其他疑问可联系客服反馈 <Text style={styles.linkText}>@外宣蜂</Text>
          </Text>
        </View>
      </View>
      <Pressable style={styles.checkRow} onPress={() => setChecked(!checked)}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
        <Text style={styles.checkText}>
          我同意
          <Text style={styles.linkText}>《小蜜蜂活动参与规则》《隐私协议》</Text>
        </Text>
      </Pressable>
      <Pressable style={[styles.confirmBtn, !checked && styles.confirmDisabled]} onPress={onConfirm} disabled={!checked}>
        <Text style={styles.confirmText}>确认</Text>
      </Pressable>
    </BaseDialog>
  )
}

const themeStyles = createStyles({
  panel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  headerRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  closeBtn: {
    position: 'absolute',
    left: 0,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: '#999',
  },
  body: {
    marginBottom: 20,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletDot: {
    width: 16,
    fontSize: 14,
    color: '#333',
  },
  bodyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  linkText: {
    color: '#527acd',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#ffd917',
    borderColor: '#ffd917',
  },
  checkText: {
    fontSize: 14,
    color: '#333',
  },
  confirmBtn: {
    height: 52,
    borderRadius: 30,
    backgroundColor: '#ffd917',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDisabled: {
    opacity: 0.3,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
})
