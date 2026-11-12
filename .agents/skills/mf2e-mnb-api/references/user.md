# user 模块

用户相关能力：登录、注销、获取用户信息、监听登录状态变更。

---

## user.login

调起客户端登录界面。登录成功后会自动注入已登录 cookie；如果已登录，会重新注入 cookie。

客户端会上报 `LOGINP` 和 `LOGINX` 埋点事件。

### Options `object`

- `onlyNetease` `boolean`（可选）— 仅显示通行证输入框，隐藏第三方登录入口（**仅 iOS 支持**）

### Returns `object`

- `name` `string` — 通行证账号
- `head` `string` — 头像地址
- `nickname` `string` — 用户昵称
- `loginType` `string` — 登录来源
- `boundMobile` `string` — 绑定的手机号（`91.0`，**未绑定时无该字段**）
- `vipInfo` `null|object` — VIP 信息（`88.0`，**非 VIP 返回 `null`**）

```js
// 普通登录
const userInfo = await mnb('user.login')

// 仅通行证登录（iOS）
const userInfo = await mnb('user.login', { onlyNetease: true })
```

---

## user.getUserInfo

获取当前用户基本信息。**未登录时会触发 reject，调用时务必 catch 或判断登录状态。**

### Returns `object`

同 `user.login` 返回值：
- `name` `string` — 通行证
- `head` `string` — 头像地址
- `nickname` `string` — 用户昵称
- `loginType` `string` — 登录来源
- `boundMobile` `string` — 绑定手机号（`91.0`，未绑定无此字段）
- `vipInfo` `null|object` — VIP 信息（`88.0`）

```js
// 注意：未登录时会 reject
try {
  const userInfo = await mnb('user.getUserInfo')
  console.log(userInfo.nickname)
} catch {
  // 未登录
}
```

---

## user.logout

主动触发登出。

```js
mnb('user.logout').catch(() => {})
```

---

## user.bindPhone `91.0`

绑定手机号，调起绑定手机号界面。

### Returns `object`

- `boundMobile` `string` — 绑定成功的手机号

```js
const { boundMobile } = await mnb('user.bindPhone')
```

---

## user.accountVerify

账号认证（实名认证）。

```js
mnb('user.accountVerify').catch(() => {})
```

---

## user.updateProfile

更新个人资料（调起编辑个人资料界面）。

```js
mnb('user.updateProfile').catch(() => {})
```

---

## user.updateLoginState（事件）`89.0`

监听登录状态变更，**登录和登出均会触发**。

- 登录时携带用户信息参数，结构同 `user.login` 返回值
- 登出时无任何参数（`undefined`）

```js
useEffect(() => {
  const handler = (info) => {
    if (info) {
      // 已登录，info 为用户信息
      console.log('登录', info.nickname)
    } else {
      // 已登出
      console.log('登出')
    }
  }
  mnb.on('user.updateLoginState', handler)
  return () => mnb.off('user.updateLoginState', handler)
}, [])
```

---

## user.updateUserInfo（事件）

用户信息发生变更时触发（如修改昵称、头像等）。

```js
useEffect(() => {
  const handler = (userInfo) => {
    console.log('用户信息更新', userInfo)
  }
  mnb.on('user.updateUserInfo', handler)
  return () => mnb.off('user.updateUserInfo', handler)
}, [])
```
