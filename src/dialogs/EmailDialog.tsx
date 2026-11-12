import type { ReactElement } from 'react'
import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { createStyles, useStyles } from '@mf2e/react-native-theme-styles'
import { BaseDialog, type BaseDialogProps } from '@/components/base/BaseDialog'
import { closeDialog, openDialog } from '@/store/modules/app/dialog'

export interface EmailDialogProps extends Omit<BaseDialogProps, 'style' | 'dialog' | 'onBackdropPress'> {
  /** 任务 ID（报名提交用） */
  activityId?: string
  /** 已有邮箱（回填输入框） */
  email?: string
}

/** 邮箱格式校验 */
const EMAIL_RE = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/

/**
 * 填写邮箱底部弹窗（视觉稿 59:4143/60:4449/60:4653，标题/按钮按视觉稿「联系邮箱」「完成」）
 * 输入合法后「完成」激活；完成后进入协议确认弹窗
 */
export const EmailDialog = ({ activityId, email, ...otherProps }: EmailDialogProps): ReactElement => {
  const styles = useStyles(themeStyles)
  const [value, setValue] = useState(email || '')
  const valid = EMAIL_RE.test(value)

  return (
    <BaseDialog dialog="email" position="bottom" style={styles.panel} onBackdropPress={() => closeDialog()} {...otherProps}>
      <View style={styles.navRow}>
        <Pressable style={styles.navCancel} onPress={() => closeDialog()}>
          <Text style={styles.navCancelText}>取消</Text>
        </Pressable>
        <Text style={styles.navTitle}>联系邮箱</Text>
        <Pressable onPress={() => onComplete(activityId, value)} disabled={!valid}>
          <Text style={[styles.navDone, !valid && styles.navDoneDisabled]}>完成</Text>
        </Pressable>
      </View>
      <Text style={styles.tip}>
        <Text style={styles.tipStar}>*</Text>首次报名，需完善邮箱信息，提升报名成功率
      </Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder="请输入邮箱"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCorrect={false}
        />
      </View>
      {!valid && !!value && <Text style={styles.error}>邮箱格式不正确，请重新输入</Text>}
    </BaseDialog>
  )
}

/** 完成：关闭本弹窗，携带邮箱进入协议确认弹窗 */
const onComplete = (activityId?: string, email?: string): void => {
  if (!email) return
  openDialog('agreement', { activityId, email })
}

const themeStyles = createStyles({
  panel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  navCancel: {
    paddingVertical: 10,
  },
  navCancelText: {
    fontSize: 16,
    color: '#333',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#333',
  },
  navDone: {
    height: 26,
    borderRadius: 20,
    paddingHorizontal: 20,
    textAlignVertical: 'center',
    overflow: 'hidden',
    backgroundColor: '#ffd917',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  navDoneDisabled: {
    opacity: 0.3,
  },
  tip: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  tipStar: {
    color: '#f00',
  },
  inputWrap: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginTop: 8,
  },
  input: {
    height: 44,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
  },
  error: {
    fontSize: 12,
    color: '#f00',
    marginTop: 6,
  },
})
