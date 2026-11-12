# events 模块

全局事件：客户端主动推送给前端的状态变更通知。使用 `mnb.on()` 监听，记得在组件卸载时取消监听。

---

## app.changeTheme

主题模式切换通知（亮色/暗色）。

### 参数 `object`

- `theme` `string` — 当前主题，如 `'dark'` / `'light'`

```js
useEffect(() => {
  const handler = ({ theme }) => {
    setTheme(theme)
  }
  mnb.on('app.changeTheme', handler)
  return () => mnb.off('app.changeTheme', handler)
}, [])
```

---

## updateVipInfo `88.0`

用户 VIP 状态发生变化时触发。非 VIP 时参数为 `null`。

### 参数 `object | null`

- `vipType` `string` — VIP 类型
- `vipStatus` `string` — VIP 状态
- `subscribeStatus` `string` — 订阅状态
- `expireDateStr` `string` — 到期日期字符串
- `nextChargeDateStr` `string` — 下次续费日期字符串
- `remainderDays` `number` — 剩余天数

```js
useEffect(() => {
  const handler = (vipInfo) => {
    if (vipInfo) {
      setVipStatus(vipInfo.vipStatus)
    } else {
      // 变为非VIP
      setVipStatus(null)
    }
  }
  mnb.on('updateVipInfo', handler)
  return () => mnb.off('updateVipInfo', handler)
}, [])
```

---

## updateKeyboardState `76.0`（仅 iOS）

键盘高度变化通知，用于键盘弹起时调整布局。

```js
useEffect(() => {
  const handler = ({ height }) => {
    setKeyboardHeight(height)
  }
  mnb.on('updateKeyboardState', handler)
  return () => mnb.off('updateKeyboardState', handler)
}, [])
```

---

## setFontSize `94.0`

用户在客户端调整字号后触发通知。

### 参数 `object`

- `fontSize` `string` — 字号档位
  - `'s'` — 小
  - `'m'` — 标准
  - `'l'` — 大
  - `'xl'` — 超大

```js
useEffect(() => {
  const handler = ({ fontSize }) => {
    applyFontSize(fontSize)
  }
  mnb.on('setFontSize', handler)
  return () => mnb.off('setFontSize', handler)
}, [])
```

---

## net.changeNetworkType

网络类型变化通知（详见 net 模块）。

```js
useEffect(() => {
  const handler = ({ networkType }) => {
    setNetworkType(networkType)
  }
  mnb.on('net.changeNetworkType', handler)
  return () => mnb.off('net.changeNetworkType', handler)
}, [])
```

---

## user.updateLoginState `89.0`

登录状态变更通知（详见 user 模块）。

---

## user.updateUserInfo

用户信息变更通知（详见 user 模块）。

---

## 取消监听规范

使用 `mnb.off('事件名', handler)` 取消监听，需保存与 `mnb.on` 相同的 handler 引用。在 React 组件中应当在 `useEffect` 的返回值中调用：

```js
// 正确：先保存 handler 引用，卸载时调用 mnb.off
useEffect(() => {
  const handler = (params) => {
    // 处理事件
  }
  mnb.on('app.changeTheme', handler)
  return () => mnb.off('app.changeTheme', handler)
}, [])

// 错误：未取消监听，会造成内存泄漏
useEffect(() => {
  mnb.on('app.changeTheme', handler)  // 没有返回取消函数
}, [])
```
