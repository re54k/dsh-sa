/*
 * 本地存储：基于客户端 KV 的持久化读写
 */
import mnb from '@mf2e/mnb'

/** iOS 读回 object、Android 读回字符串，统一转成对象 */
const parseValue = <T>(raw: unknown): T | null => {
  try {
    return (typeof raw === 'string' ? JSON.parse(raw) : raw) as T
  } catch {
    return null
  }
}

/** 写入本地存储，值统一序列化为 JSON 字符串；客户端不支持 KV 时静默失败，不阻断主流程 */
export const setStorage = async (key: string, value: unknown) => {
  try {
    await mnb('kv.set', { key, value: JSON.stringify(value) })
  } catch {
    // 客户端 KV 不可用时忽略
  }
}

/** 读取本地存储，读取失败或无数据返回 null */
export const getStorage = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await mnb('kv.get', { key })

    return raw ? parseValue<T>(raw) : null
  } catch {
    return null
  }
}
