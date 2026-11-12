/**
 * 蜂赚（外宣任务）创作者认证域类型。
 *
 * 来源：docs/api.yaml 的 /user/creator/accounts、/user/creator/account/detail、
 * /user/creator/account/bind、/user/creator/account/unbind 接口；
 * 类型仅描述响应 data 本体与请求参数。
 */

/** 平台账号（创作者认证） */
export interface PlatformAccount {
  /** 平台：redbook-小红书，douyin-抖音 */
  platform?: string
  /** 平台账号 ID */
  accountId?: string
  /** 平台账号昵称 */
  nickname?: string
  /** 平台账号头像地址 */
  avatarUrl?: string
  /** 粉丝数 */
  fansCount?: number
  /** 认证状态：1-审核中，2-已绑定，3-未通过，4-账号异常 */
  verifyStatus?: number
  /** 认证未通过原因（仅 verifyStatus=3 时返回） */
  verifyFailReason?: string
  /** 绑定时间（毫秒时间戳） */
  bindTime?: number
}

/** 已绑定平台账号列表请求参数 */
export interface CreatorAccountsParams {
  /** 按平台过滤（可选）：redbook-小红书，douyin-抖音 */
  platform?: string
}

/** 单个平台账号详情请求参数 */
export interface CreatorAccountDetailParams {
  /** 平台账号 ID */
  id: number
}

/** 提交平台账号绑定请求参数（异步审核） */
export interface PlatformAccountBindParams {
  /** 平台：redbook-小红书，douyin-抖音 */
  platform: string
  /** 个人主页链接（从复制的口令文本中识别提取） */
  homeUrl: string
  /** 主页截图地址列表 */
  screenshots: string[]
}

/** 解绑平台账号请求参数 */
export interface PlatformAccountUnbindParams {
  /** 平台：redbook-小红书，douyin-抖音 */
  platform: string
  /** 平台账号 ID */
  accountId: string
}
