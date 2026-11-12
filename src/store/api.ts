import { appHosts, queryParams } from '@/utils/inject'

const mock = __DEV__
const host = mock ? `http://${getMockHost()}:8082` : appHosts.api_mifengs_com || 'https://api.mifengs.com'

// 蜂赚（外宣任务）接口前缀
const beeEarnHost = `${host}/worklife-go/api/v1/bee-earn`

// 定义接口
export const api = {
  // 首页信息（示例接口）
  info: `${host}/worklife-go/api/v1/info`,
  // 蜂赚（外宣任务）
  beeEarn: {
    // 创作者认证
    creator: {
      // 已绑定平台账号列表
      accounts: `${beeEarnHost}/user/creator/accounts`,
      // 单个平台账号详情
      accountDetail: `${beeEarnHost}/user/creator/account/detail`,
      // 提交平台账号绑定（异步审核）
      accountBind: `${beeEarnHost}/user/creator/account/bind`,
      // 解绑平台账号
      accountUnbind: `${beeEarnHost}/user/creator/account/unbind`,
    },
    // 链接解析
    link: {
      // 一键解析主页链接（前端预览，不落库）
      parseCreator: `${beeEarnHost}/link/parse/creator`,
      // 一键解析内容链接（前端预览，不落库）
      parseSubmission: `${beeEarnHost}/link/parse/submission`,
    },
    // 活动
    activity: {
      // 蜂赚任务列表
      list: `${beeEarnHost}/activity/list`,
      // 任务详情
      detail: `${beeEarnHost}/activity/detail`,
      // 任务进度详情页
      progress: `${beeEarnHost}/activity/progress`,
      // 分享卡片信息
      share: `${beeEarnHost}/activity/share`,
    },
    // 报名
    apply: {
      // 提交报名
      submit: `${beeEarnHost}/apply/submit`,
    },
    // 投稿
    submission: {
      // 上传投稿（异步审核）
      upload: `${beeEarnHost}/submission/upload`,
      // 更新投稿数据截图（7 天窗口期）
      update: `${beeEarnHost}/submission/update`,
      // 稿件管理列表
      list: `${beeEarnHost}/submission/list`,
      // 稿件详情页
      detail: `${beeEarnHost}/submission/detail`,
    },
    // 个人信息
    profile: {
      // 蜂赚个人信息页
      detail: `${beeEarnHost}/user/profile`,
      // 更新联系邮箱
      update: `${beeEarnHost}/user/profile/update`,
    },
  },
}

/**
 * 从 queryParams.url（scheme 携带的 bundle 地址）解析开发机 host
 * 无 url 参数时兜底 localhost
 */
function getMockHost(): string {
  const matched = (queryParams.url || '').match(/^https?:\/\/([^/:]+)/)
  return matched ? matched[1] : 'localhost'
}
