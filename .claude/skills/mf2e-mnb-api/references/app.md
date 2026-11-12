# app 模块

设备级能力：复制、震动、加解密、权限、状态栏、日历、摇一摇、小程序等。

---

## app.copy

复制文本到剪贴板。

### Options `object`

- `text` `string` — 需要复制的文本，**无需 encodeURIComponent**

```js
mnb('app.copy', { text: '要复制的内容' }).catch(() => {})
// 包含特殊字符也直接传
mnb('app.copy', { text: '包含%百分号的文本' }).catch(() => {})
```

---

## app.vibrate

触发手机震动。

### Options `object`

- `mode` `string` — 震动效果（**仅 iOS 有效**）
  - `impactLight` — 轻度震动
  - `impactMedium` — 中度震动（推荐默认值）
  - `impactHeavy` — 重度震动
- `duration` `number` — 震动时长，毫秒，默认 300（**仅 Android 有效**）

如无特殊需求，统一使用 `impactMedium` + `300`：

```js
mnb('app.vibrate', { mode: 'impactMedium', duration: 300 }).catch(() => {})
```

---

## app.shaking

摇一摇功能。

### Options `object`

- `directive` `string` — `'start'` 开始监听 / `'stop'` 停止监听

```js
mnb('app.shaking', { directive: 'start' }).catch(() => {})
mnb('app.shaking', { directive: 'stop' }).catch(() => {})
```

---

## app.getDeviceInfo

获取用户设备信息。

### Returns `object`

- `id` `string` — 银河统计的 appid
- `m` `string` — 设备型号，如 `小米14 pro`
- `mid` `string` — 渠道号，如 `netease_gw`、`appstore`
- `o` `string|number` — Android API Level（如 `34`）或 iOS 系统版本（如 `"14.7.1"`）
- `v` `string` — 客户端版本号
- `u` `string` — 设备 ID
- 其他不常用字段，具体咨询端开发

```js
const deviceInfo = await mnb('app.getDeviceInfo')
```

---

## app.requestPermission

请求系统权限。

### Options `object`

- `permission` `string` — 权限类型
  - `Camera` — 相机
  - `Storage` — 存储
  - `GPS` — 定位
  - `Push` — 推送

### Returns `object`

- `isSuccess` `boolean`
- `failReason` `string`（失败时）— `'SystemClose'` 或 `'UserClose'`

```js
const { isSuccess } = await mnb('app.requestPermission', { permission: 'Camera' })
```

---

## app.encrypt

AES 加密字符串。

### Options `object`

- `text` `string` — 要加密的文本
- `type` `string`（可选）— 加密类型，默认 AES128+base64
  - `'default'` — 默认
  - `'finance'` — 金融
  - `'underpants'` — underpants
  - `'notify'` — 通知

### Returns `string`

加密后的文本。

```js
const encrypted = await mnb('app.encrypt', { text: '明文内容' })
const encryptedFinance = await mnb('app.encrypt', { text: '明文内容', type: 'finance' })
```

---

## app.decrypt

AES 解密字符串。

### Options `object`

- `text` `string` — 要解密的密文
- `type` `string`（可选）— 解密类型，同 `app.encrypt`

### Returns `string`

解密后的文本。

```js
const plainText = await mnb('app.decrypt', { text: 'VHqr3TO6dKMA2KqinMqUag==' })
```

---

## app.setStatusBar

设置顶部状态栏显示模式。

### Options `object`

- `mode` `string`
  - `'light'` — 浅色（深色背景用）
  - `'dark'` — 深色（浅色背景用）

```js
mnb('app.setStatusBar', { mode: 'dark' }).catch(() => {})
```

---

## app.disableGesture / app.enableGesture

禁用或开启客户端手势返回（右滑退出）。

```js
mnb('app.disableGesture').catch(() => {})  // 禁用右滑退出
mnb('app.enableGesture').catch(() => {})   // 恢复右滑退出
```

## app.gestureSimultaneous

禁用手势返回（**仅 iOS**）。

```js
mnb('app.gestureSimultaneous').catch(() => {})
```

---

## app.calendarRemind `2.34`

操作手机日历提醒（添加、删除、检查）。

### Options `object`

- `directive` `string` — `'add'` / `'remove'` / `'check'`
- `title` `string` — 提醒标题
- `startTime` `string` — 开始时间，格式 `2025-09-01 00:00:00`
- `endTime` `string` — 结束时间
- `endDate` `string` — 结束日期，格式 `2025-09-01`
- `freq` `string` — 提醒频率：`'DAILY'` / `'WEEKLY'` / `'MONTHLY'` / `'YEARLY'`
- `byRule` `array` — 规则，如 `[1, 3]` 表示每周一、三
- `id` `string` — 提醒 ID（remove/check 时使用）

### Returns `object`

- `status` `string` — `'success'` / `'fail'`
- `id` `string` — 提醒 ID

```js
// 添加
const { id } = await mnb('app.calendarRemind', {
  directive: 'add',
  title: '每日提醒',
  startTime: '2025-09-01 08:00:00',
  endTime: '2025-09-01 09:00:00',
  freq: 'DAILY',
})

// 删除
await mnb('app.calendarRemind', { directive: 'remove', id })

// 检查是否存在
await mnb('app.calendarRemind', { directive: 'check', id })
```

---

## app.pay `2.22`

消费/充值蜂蜜币。

### Options `object`

- `businessType` `string` — 业务类型
- `actionAfterRecharge` `number` — `1`：直接支付（不够则充值后支付）；`2`：仅充值
- `targetId` `string` — 送礼物目标 ID
- `targetType` `string` — 目标类型
- `goodsCode` `string` — 商品 code
- `goodsQuantity` `number` — 商品数量（笔记支持档位：1、6、8、88）
- `totalCoinQuantity` `number` — 总共需要消费的蜂蜜币数量
- `extraParams` `object`（可选）`2.37` — 额外参数

### Returns（出错时）`object`

- `message` `string` — 服务端错误信息
- `code` `string` — 错误码（网络错误固定返回 `-1`）

```js
await mnb('app.pay', {
  businessType: 'giftReward',
  actionAfterRecharge: 1,
  targetId: 'WFC0607KTS7B8YZW',
  targetType: 'recImg',
  goodsCode: 'gift1',
  goodsQuantity: 1,
  totalCoinQuantity: 1,
})
```

---

## app.emoticons

获取表情数据。

### Returns `object`

- `recentUsed` `array` — 最近使用的表情
  - `name` `string`、`localPath` `string`、`picUrl` `string`
- `emoticonList` `array` — 全量表情列表，结构同上

```js
const { recentUsed, emoticonList } = await mnb('app.emoticons')
```

---

## app.halei

获取哈雷（远程配置）的值。

### Options `object`

- `key` `string` — 配置 key

```js
const result = await mnb('app.halei', { key: 'video_module' })
```

---

## app.openMiniProgram

打开微信小程序（目前仅支持微信）。

### Options `object`

- `userName` `string` — 小程序原始 ID
- `path` `string`（可选）— 小程序内的跳转路径
- `type` `number`（可选）— 版本类型：`0` release / `1` test / `2` preview

```js
mnb('app.openMiniProgram', { userName: 'gh_377d641c310d' }).catch(() => {})
mnb('app.openMiniProgram', {
  userName: 'gh_377d641c310d',
  path: '/pages/article/article?docid=xxx',
}).catch(() => {})
```

---

## app.eventPost / app.onEventListener

Native、RN、Webview 三端通用事件发送与监听机制。

```js
// 发送事件
mnb('app.eventPost', {
  key: 'APP_NOTE_PRAISE',
  value: { skipID: noteId, skipType: 'recImg', status: 1, count: 100 },
}).catch(() => {})

// 监听事件
mnb.on('app.onEventListener', (event) => {
  console.log(event)
})
```

---

## app.changeFontScale `2.37`（事件）

字体缩放变化通知。

### 参数 `object`

- `fontScale` `number` — 字体缩放值

```js
useEffect(() => {
  const handler = ({ fontScale }) => {
    console.log('字体缩放:', fontScale)
  }
  mnb.on('app.changeFontScale', handler)
  return () => mnb.off('app.changeFontScale', handler)
}, [])
```

---

## app.mainTabChange（事件）

监听主 Tab 切换。

```js
useEffect(() => {
  const handler = (res) => {
    console.log('Tab 切换:', res)
  }
  mnb.on('app.mainTabChange', handler)
  return () => mnb.off('app.mainTabChange', handler)
}, [])
```

---

## app.changeTheme（事件）

监听主题模式切换（亮/暗）。

### 参数 `object`

- `theme` `string` — 主题模式

```js
useEffect(() => {
  const handler = ({ theme }) => {
    setTheme(theme)
  }
  mnb.on('app.changeTheme', handler)
  return () => mnb.off('app.changeTheme', handler)
}, [])
```
