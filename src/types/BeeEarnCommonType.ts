/**
 * 蜂赚（外宣任务）跨业务域共用类型。
 *
 * 来源：docs/api.yaml components/schemas 中被多个 C 端接口共用的结构
 * （用户/认证信息、任务基础信息、投稿要求、群聊信息、稿件统计、用户参与状态）。
 * 类型仅描述响应 data 本体；{ code, message, data } 包装由 fetch 封装统一处理。
 */

/** 认证图标（不同主题模式下的图片地址） */
export interface VerifyIcon {
  /** 日间模式图标地址 */
  daytime?: string
  /** 夜间模式图标地址 */
  night?: string
  /** 深色模式图标地址 */
  darkmode?: string
}

/** 认证信息 */
export interface VerifyInfo {
  /** 认证文案 */
  authText?: string
  /** 认证图标 */
  authIcon?: VerifyIcon
  /** 认证类型 */
  authType?: string
  /** 时间戳 */
  ts?: number
}

/** 用户信息（任务发布者） */
export interface UserInfo {
  /** 用户 ID */
  userId?: string
  /** 昵称 */
  nick?: string
  /** 头像地址 */
  head?: string
  /** 关注状态：0-双向未关注，1-已关注，2-互相关注，3-被关注 */
  followStatus?: number
  /** 认证信息列表 */
  verifyInfo?: VerifyInfo[]
}

/** 投稿详细要求（对应 activity_config config_type=2） */
export interface SubmitRequirements {
  /** 内容类型：1-不限，2-图文，3-视频 */
  contentType?: number
  /** 携带话题（需完全匹配） */
  requiredTopics?: string[]
  /** 图文：标题+内容最少字数 */
  textMinWords?: number
  /** 图文：最少图片张数 */
  imageMinCount?: number
  /** 视频：最少秒数 */
  videoMinSeconds?: number
}

/** 任务基础信息 */
export interface ActivityBaseInfo {
  /** 任务 ID */
  activityId?: string
  /** 任务名称（最多 20 字） */
  name?: string
  /** 任务封面图地址 */
  coverUrl?: string
  /** 标签（最多 3 个） */
  tags?: string[]
  /** 任务金额展示（如 1-500元/篇 或 价格面议） */
  rewardDisplay?: string
  /** 报名开始时间（毫秒时间戳） */
  applyStartTime?: number
  /** 报名结束时间（毫秒时间戳） */
  applyEndTime?: number
  /** 投稿开始时间（毫秒时间戳） */
  submitStartTime?: number
  /** 投稿结束时间（毫秒时间戳） */
  submitEndTime?: number
  /** 结算时间（毫秒时间戳） */
  settleTime?: number
  /** 报名人数（含未过审） */
  applyCount?: number
  /** 报名成功人数 */
  applySuccessCount?: number
  /** 招募人数上限（无上限时为 0） */
  applyMaxCount?: number
  /** 创作平台（redbook-小红书，douyin-抖音） */
  platforms?: string
  /** 投稿详细要求 */
  submitRequirements?: SubmitRequirements
  /** 任务状态：1-报名中，2-报名人数已满，3-进行中(投稿中)，4-进行中(最后更新)，5-进行中(审核中)，6-进行中(结算中)，7-已结算，8-未完成 */
  status?: number
  /** 创建时间（毫秒时间戳） */
  createTime?: number
}

/** 活动群聊信息（详情页/进度页，与 activityInfo 同级） */
export interface GroupInfo {
  /** 小蜜蜂群聊 ID（activity.group_chat_id）；无群则为空 */
  groupId?: string
  /** 当前用户是否已加入该群（无群则 false） */
  joinStatus?: boolean
}

/** 稿件统计（C 端稿件列表与进度详情页共用） */
export interface SubmissionStats {
  /** 总投稿条数 */
  submissionCount?: number
  /** 机审通过条数 */
  machinePassCount?: number
  /** 人审通过条数 */
  manualPassCount?: number
  /** 不通过条数 */
  failCount?: number
}

/** 用户参与状态（任务详情页/任务进度页共用） */
export interface ActivityUserStatus {
  /** 状态：0-可报名(未操作)，1-待审核，2-报名成功，3-未通过，4-已取消，5-已移除，6-已拉黑，7-已退出，8-不可参与 */
  status?: number
  /** 不可参与原因 */
  cannotReason?: string
}
