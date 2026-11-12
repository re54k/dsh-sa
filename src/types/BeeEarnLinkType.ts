/**
 * 蜂赚（外宣任务）链接解析域类型。
 *
 * 来源：docs/api.yaml 的 /link/parse/creator、/link/parse/submission 接口；
 * 解析结果仅供前端预览（不落库），类型仅描述响应 data 本体与请求参数。
 */

/** 链接解析请求参数（主页/内容链接共用） */
export interface LinkParseParams {
  /** 用户粘贴的链接（可含口令文本，后端识别提取）；平台由后端从 URL 自动识别并在结果中返回 */
  url: string
}

/** 主页链接一键解析结果（data 本体，前端预览用，不落库） */
export interface CreatorLinkParseResult {
  /** 解析状态：1-成功，2-失败 */
  parseStatus?: number
  /** 解析失败原因 */
  failReason?: string
  /** 平台：redbook-小红书，douyin-抖音 */
  platform?: string
  /** 页面类型：user_profile-主页，content-作品页（非主页应提示用户） */
  pageType?: string
  /** 平台账号 ID */
  accountId?: string
  /** 平台账号昵称 */
  nickname?: string
  /** 粉丝数 */
  fansCount?: number
  /** 账号是否已注销/删除 */
  isDeleted?: boolean
}

/** 内容链接一键解析结果（data 本体，前端预览用，不落库） */
export interface SubmissionLinkParseResult {
  /** 解析状态：1-成功，2-失败 */
  parseStatus?: number
  /** 解析失败原因 */
  failReason?: string
  /** 平台：redbook-小红书，douyin-抖音 */
  platform?: string
  /** 页面类型：应为 content；若为 user_profile 提示用户上传内容链接 */
  pageType?: string
  /** 平台账号 ID */
  accountId?: string
  /** 平台账号昵称 */
  nickname?: string
  /** 内容标题 */
  title?: string
  /** 内容正文 */
  content?: string
  /** 内容封面图地址 */
  coverUrl?: string
  /** 发布时间（毫秒时间戳） */
  publishTime?: number
  /** 小红书浏览数/抖音播放量 */
  views?: number
  /** 点赞数 */
  likes?: number
  /** 评论数 */
  comments?: number
  /** 分享数 */
  shares?: number
  /** 收藏数 */
  collects?: number
  /** 内容是否已删除 */
  isDeleted?: boolean
}
