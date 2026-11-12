import '@/utils/track'
import '@/utils/theme'
import { withFontScale } from '@/utils/font'
import { AppRegistry, LogBox } from 'react-native'
import app from './app.json'
import { App } from '@/App'

// 宿主 App 原生模块在 DEV 下发送 onStateChange 事件无 JS 监听，LogBox 反复弹出干扰开发/验收
// 精确 pattern 未命中（警告可能走 RCTLog 直发通道），DEV 下全量忽略（生产不打包）
if (__DEV__) {
  LogBox.ignoreAllLogs()
}

AppRegistry.registerComponent(app.name, () => withFontScale(App))
