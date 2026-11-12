/**
 * app.json 的构建注入类型声明。
 */
declare module '@/../app.json' {
  const app: {
    name: string
    /** 拆包名称，包括@index后缀 */
    splitName?: string
    /** 构建版本号，构建脚本自增 */
    buildVersion?: number
    /** 构建时间，格式 MM/DD HH:mm */
    buildTime?: string
  }
  export default app
}

/**
 * 图片资源模块声明：
 * ImageSourcePropType 联合类型，保证跨端类型一致
 */
declare module '*.png' {
  const value: import('react-native').ImageSourcePropType
  export default value
}
