/*
 * 常用工具函数
 */

// 异步等待函数
export const sleep = (duration: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}
