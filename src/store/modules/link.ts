import { create } from 'zustand'
import { api } from '../api'
import { fetch } from '../fetch'
import type {
  CreatorLinkParseResult,
  SubmissionLinkParseResult,
} from '@/types/BeeEarnLinkType'

interface LinkStore {
  /** 一键解析主页链接（创作者认证页粘贴链接后调用，结果供用户确认，不落库） */
  parseCreatorLink: (url: string) => Promise<CreatorLinkParseResult>
  /** 一键解析内容链接（投稿页粘贴链接后调用，结果供用户确认，不落库） */
  parseSubmissionLink: (url: string) => Promise<SubmissionLinkParseResult>
}

export const useLinkStore = create<LinkStore>(() => ({
  async parseCreatorLink(url) {
    return fetch<CreatorLinkParseResult>({
      url: api.beeEarn.link.parseCreator,
      method: 'post',
      dataJson: 'json',
      data: { url },
    })
  },

  async parseSubmissionLink(url) {
    return fetch<SubmissionLinkParseResult>({
      url: api.beeEarn.link.parseSubmission,
      method: 'post',
      dataJson: 'json',
      data: { url },
    })
  },
}))
