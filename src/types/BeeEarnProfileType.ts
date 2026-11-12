/**
 * 蜂赚（外宣任务）个人信息域类型。
 *
 * 来源：docs/api.yaml 的 /user/profile、/user/profile/update 接口；
 * 类型仅描述响应 data 本体与请求参数。
 */

/** 绑定平台账号统计 */
export interface BindAccountInfo {
  /** 绑定小红书账号数 */
  redBookCount?: number
  /** 绑定抖音账号数 */
  douYinCount?: number
}

/** 蜂赚个人信息（data 本体） */
export interface UserProfile {
  /** 用户 ID */
  userId?: string
  /** 昵称 */
  nickname?: string
  /** 头像地址 */
  avatar?: string
  /** 蜜蜂号 */
  beeId?: string
  /** 手机号（当前登录手机号，不可编辑） */
  phone?: string
  /** 联系邮箱（未填写时不下发，报名流程需先弹邮箱填写） */
  email?: string
  /** 绑定平台账号统计 */
  bindAccountInfo?: BindAccountInfo
}

/** 更新联系邮箱请求参数 */
export interface ProfileUpdateParams {
  /** 联系邮箱（标准邮箱格式，页面负责校验） */
  email: string
}
