/**
 * 蜂赚（外宣任务）活动/报名域类型。
 *
 * 来源：docs/api.yaml 的 /activity/list、/activity/detail、/activity/progress、
 * /activity/share、/apply/submit 接口；类型仅描述响应 data 本体与请求参数。
 */

import type {
  ActivityBaseInfo,
  ActivityUserStatus,
  GroupInfo,
  SubmissionStats,
  UserInfo,
} from './BeeEarnCommonType'

/** 任务列表项 */
export interface ActivityListItem {
  /** 任务基础信息 */
  activityInfo?: ActivityBaseInfo
  /** 发布者信息 */
  userInfo?: UserInfo
}

/** 任务列表响应（data 本体） */
export interface ActivityListData {
  /** 任务列表 */
  list?: ActivityListItem[]
  /** 总条数 */
  total?: number
}

/** 激励详情条目 */
export interface IncentiveItem {
  /** 小标题 */
  title?: string
  /** 正文（激励金额说明） */
  content?: string
}

/** 其他描述模块（每个任务最多 6 个，不含投稿要求和激励模块） */
export interface ExtraModuleItem {
  /** 模块标题 */
  title?: string
  /** 模块内容 */
  content?: string
}

/** 报名条件条目 */
export interface ApplyConditionItem {
  /** 条件文案 */
  label?: string
  /** 当前用户是否满足 */
  satisfied?: boolean
  /** 不满足时的跳转地址 */
  jumpUrl?: string
  /** 跳转链接文案 */
  jumpText?: string
}

/** 参考资料文件（支持 PDF/JPG/MP4） */
export interface ReferenceFileItem {
  /** 文件名 */
  name?: string
  /** 文件地址 */
  url?: string
  /** 文件类型：1-图片，2-视频，0-其他 */
  type?: number
  /** 文件扩展名 */
  fileext?: string
  /** 文件大小（单位字节 B） */
  fileSize?: number
}

/** 参考链接条目 */
export interface ReferenceLinkItem {
  /** 链接文案 */
  title?: string
  /** 链接地址 */
  url?: string
  /** 链接图标（取后台配置，无则用默认） */
  icon?: string
}

/** 投稿数据档位统计条目（任务进度页稿件统计） */
export interface SatisfyStatItem {
  /** 档位文案 */
  label?: string
  /** 内容条数 */
  count?: number
}

/** 预计结算金额（仅运营复审后展示，单位：分） */
export interface SettledAmount {
  /** 总收益（分） */
  totalAmount?: number
  /** 基础激励（分） */
  baseAmount?: number
  /** 首条激励（分） */
  conditionAmount?: number
}

/** 任务详情页响应（data 本体） */
export interface ActivityDetailData {
  /** 任务基础信息 */
  activityInfo?: ActivityBaseInfo
  /** 任务群聊信息 */
  groupInfo?: GroupInfo
  /** 发布者信息 */
  userInfo?: UserInfo
  /** 投稿须知（HTML 富文本，示例文案链接由后端在 HTML 内嵌 a 标签） */
  submitNotice?: string
  /** 用户信息里已填的邮箱；若下发则报名时直接进入协议弹窗，无需再弹邮箱输入 */
  userEmail?: string
  /** 激励详情列表 */
  incentives?: IncentiveItem[]
  /** 其他描述模块（最多 6 个） */
  extraModules?: ExtraModuleItem[]
  /** 报名条件列表 */
  applyConditions?: ApplyConditionItem[]
  /** 参考资料文件列表 */
  referenceFiles?: ReferenceFileItem[]
  /** 参考链接列表 */
  referenceLinks?: ReferenceLinkItem[]
  /** 注意事项 */
  notes?: string
  /** 企微群二维码地址 */
  weworkQrUrl?: string
  /** 当前用户参与状态 */
  userStatus?: ActivityUserStatus
}

/** 任务进度详情页响应（data 本体） */
export interface ActivityProgressData {
  /** 任务基础信息 */
  activityInfo?: ActivityBaseInfo
  /** 任务群聊信息 */
  groupInfo?: GroupInfo
  /** 当前用户参与状态 */
  userStatus?: ActivityUserStatus
  /** 投稿须知（HTML 富文本，示例文案链接由后端在 HTML 内嵌 a 标签） */
  submitNotice?: string
  /** 稿件统计 */
  submissionStats?: SubmissionStats
  /** 投稿数据档位统计列表 */
  satisfyStats?: SatisfyStatItem[]
  /** 预计结算金额（仅运营复审后展示） */
  settledAmount?: SettledAmount
  /** 企微群二维码地址 */
  weworkQrUrl?: string
}

/** 任务分享卡片（data 本体） */
export interface ShareCardData {
  /** 任务 ID */
  activityId?: string
  /** 任务名称 */
  name?: string
  /** 任务封面 */
  coverUrl?: string
  /** 任务金额展示（如 1-500元/篇 或 价格面议） */
  rewardDisplay?: string
  /** 报名时间文案（X月X日X点-X月X日X点） */
  applyTimeText?: string
  /** 回流二维码地址 */
  qrCodeUrl?: string
}

/** 任务列表请求参数 */
export interface ActivityListParams {
  /** 偏移量，默认 0 */
  offset?: number
  /** 每页条数，默认 20 */
  limit?: number
}

/** 任务详情请求参数 */
export interface ActivityDetailParams {
  /** 任务 ID */
  activityId: string
}

/** 任务进度详情请求参数 */
export interface ActivityProgressParams {
  /** 任务 ID */
  activityId: string
}

/** 任务分享卡片请求参数 */
export interface ActivityShareParams {
  /** 任务 ID */
  activityId: string
}

/** 提交报名请求参数 */
export interface ApplySubmitParams {
  /** 任务 ID */
  activityId: string
  /** 联系邮箱（个人信息未填写时需补充，格式校验由页面负责） */
  email?: string
}
