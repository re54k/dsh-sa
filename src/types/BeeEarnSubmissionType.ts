/**
 * 蜂赚（外宣任务）投稿域类型。
 *
 * 来源：docs/api.yaml 的 /submission/upload、/submission/update、
 * /submission/list、/submission/detail 接口；类型仅描述响应 data 本体与请求参数。
 */

import type { ActivityBaseInfo, SubmissionStats } from './BeeEarnCommonType'

/** 稿件列表项 */
export interface SubmissionItem {
  /** 稿件 ID */
  submissionId?: string
  /** 内容 ID（链接解析得到；投稿 upload 按该值做 status<>invalid 全局去重） */
  contentId?: string
  /** 内容标题 */
  contentTitle?: string
  /** 内容封面图地址 */
  coverUrl?: string
  /** 平台：redbook-小红书，douyin-抖音 */
  platform?: string
  /** 发布内容账号昵称 */
  platformNickname?: string
  /** 稿件状态：1-机审中，2-通过机审，3-未过机审，4-复审中，5-未过复审，6-已通过，7-已结算，8-内容失效，9-截图数据不达标 */
  status?: number
  /** 稿件状态文案 */
  statusLabel?: string
  /** 曝光量/播放量 */
  views?: number
  /** 点赞数 */
  likes?: number
  /** 预计获得金额（单位：分；通过运营复审后展示） */
  estimatedAmount?: number
  /** 实际获得金额（单位：分；通过运营复审后且结算时展示） */
  actualAmount?: number
  /** 未达标/未通过原因 */
  failReason?: string
  /** 未达标原因类型：audit-审核未过(红色高亮)，data-数据不达标(其他高亮) */
  failReasonType?: string
  /** 发布时间（毫秒时间戳） */
  publishTime?: number
  /** 投稿数据更新截止时间（publishTime+7 天，毫秒时间戳） */
  updateDeadlineTime?: number
  /** 投稿数据最近更新时间（毫秒时间戳） */
  lastUpdateTime?: number
  /** 创建时间（毫秒时间戳） */
  createTime?: number
  /** 游标分页值；最后一项 cursor 为空表示到底 */
  cursor?: string
}

/** 稿件管理列表请求参数 */
export interface SubmissionListParams {
  /** 任务 ID */
  activityId: string
  /** 稿件筛选（与 submissionStats 四种状态对应）：all-全部，machine_pass-机审通过，manual_pass-人审通过，fail-不通过 */
  status?: string
  /** 游标分页值（首页空串） */
  cursor?: string
  /** 每页条数，默认 20 */
  size?: number
}

/** 稿件管理列表响应（data 本体） */
export interface SubmissionListData {
  /** 稿件列表 */
  list?: SubmissionItem[]
  /** 总条数 */
  total?: number
  /** 任务基础信息 */
  activityInfo?: ActivityBaseInfo
  /** 稿件统计 */
  submissionStats?: SubmissionStats
}

/** 稿件信息（稿件详情页 submissionInfo 字段） */
export interface SubmissionInfo {
  /** 内容 ID（链接解析，去重用） */
  contentId?: string
  /** 内容链接 */
  contentUrl?: string
  /** 内容标题 */
  contentTitle?: string
  /** 内容封面图地址 */
  coverUrl?: string
  /** 稿件截图地址列表 */
  contentScreenshots?: string[]
}

/** 稿件详情页响应（data 本体） */
export interface SubmissionDetailData {
  /** 任务基础信息 */
  activityInfo?: ActivityBaseInfo
  /** 稿件信息 */
  submissionInfo?: SubmissionInfo
}

/** 稿件详情请求参数 */
export interface SubmissionDetailParams {
  /** 稿件 ID */
  submissionId: string
}

/** 上传投稿请求参数（异步审核） */
export interface SubmissionUploadParams {
  /** 任务 ID */
  activityId: string
  /** 内容链接 */
  contentUrl: string
  /** 数据截图地址列表（至少 1 张） */
  contentScreenshots: string[]
}

/** 更新投稿数据截图请求参数（7 天窗口期内可多次更新） */
export interface SubmissionUpdateParams {
  /** 稿件 ID */
  submissionId: string
  /** 内容链接 */
  contentUrl: string
  /** 数据截图地址列表（至少 1 张） */
  contentScreenshots: string[]
}
