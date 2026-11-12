/*
 * 客户端默认注入常量
 */
import { TurboModuleRegistry, NativeModules } from 'react-native'

/**
 * 客户端环境变量（原生端注入，字段按需扩展）
 */
export interface AppEnv {
  /** 状态栏高度 */
  statusBarHeight?: number
  /** 导航栏高度 */
  navBarHeight?: number
  /** 字体缩放比例 */
  fontScale?: number
  [key: string]: unknown
}

/** 客户端网络环境 host 列表 */
export interface AppHosts {
  /** 蜜蜂 API 域名 */
  api_mifengs_com?: string
  /** 网易网关域名 */
  gw_m_163_com?: string
  [key: string]: string | undefined
}

/** 客户端路由协议链接参数 */
export interface QueryParams {
  id?: string
  url?: string
  page?: string
  dialog?: string
  [key: string]: unknown
}

/** 原生注入的上下文，各字段均为 JSON 字符串 */
interface ClientContext {
  appEnv?: string
  appHosts?: string
  queryParams?: string
}

/** 原生上下文模块的通用形态 */
interface NativeContextModule {
  getConstants?: () => ClientContext
}

/** 从 TurboModule / NativeModules 获取原生上下文，兼容新旧两端 */
const getNativeContext = (): ClientContext => {
  const turboContext = (
    TurboModuleRegistry as unknown as {
      getEnforcing?: (name: string) => NativeContextModule | undefined
    }
  )
    .getEnforcing?.('NERCTAppContextModule')
    ?.getConstants?.()

  const legacyContext = (
    NativeModules as unknown as {
      NERCTAppContextModule?: ClientContext
    }
  ).NERCTAppContextModule

  return turboContext || legacyContext || {}
}

/** 安全解析 JSON 字符串，失败时回退默认值，避免模块加载抛错 */
const parseJson = <T>(raw: string | undefined, fallback: T): T => {
  try {
    return JSON.parse(raw || '') as T
  } catch {
    return fallback
  }
}

const context = getNativeContext()

// 客户端环境变量
export const appEnv: AppEnv = parseJson<AppEnv>(context.appEnv, {})

// 客户端网络环境 host 列表
export const appHosts: AppHosts = parseJson<AppHosts>(context.appHosts, {})

// 客户端路由协议链接参数
export const queryParams: QueryParams = parseJson<QueryParams>(context.queryParams, {})
