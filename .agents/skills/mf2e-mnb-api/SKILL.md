---
name: mf2e-mnb-api
description: |-
  MNB（@mf2e/mnb）JS Bridge 接口使用指南。用于网易新闻/蜂蜜 App 中 RN 和 H5 页面通过原生桥接调用客户端能力。
  当用户在 mf2e 项目中需要通过 mnb bridge 与客户端原生层交互时，使用此技能。涵盖：原生 toast/snackbar 提示、用户登录与信息获取、客户端代理网络请求（net.request）、文件上传下载（NOS）、原生导航跳转（navigator.open）、分享到微信/微博等第三方平台、监听原生事件（主题切换、VIP、网络状态）、剪贴板/震动/权限等设备能力、笔记发布、客户端沙箱文件读写、KV 持久化存储、本地 SQLite 数据库。
  注意：此技能仅用于通过 @mf2e/mnb 调用客户端原生能力的场景。如果用户使用的是 react-navigation、AsyncStorage、axios、react-native-toast-message 等第三方 RN/npm 库，则不需要此技能。
metadata:
  version: 1.0.6
---
# MNB API 使用指南

## 核心概念

MNB（`@mf2e/mnb`）是 mf2e 前端与客户端原生之间的 JS Bridge 桥接库，统一用于 RN 和 H5 页面。

> **注意**：旧代码中可能出现 `@newsapp/mnb` 的引用，这是历史命名，现已统一改为 `@mf2e/mnb`，编写新代码时一律使用 `@mf2e/mnb`。

## 两种调用方式

### 1. 方法调用（Method）

用于主动调用原生能力，返回 Promise：

```js
import mnb from '@mf2e/mnb'

// 基本用法
mnb('接口名', options)
  .then(result => { /* 处理返回值 */ })
  .catch(() => { /* 处理失败 */ })

// 示例：显示 Toast
mnb('toast.show', { text: '操作成功' }).catch(() => {})

// 示例：获取用户信息
const userInfo = await mnb('user.getUserInfo')
```

### 2. 事件监听（Event）

用于监听客户端主动推送的事件，使用 `mnb.on()`：

```js
import mnb from '@mf2e/mnb'

// 注册监听（在组件卸载时取消监听）
useEffect(() => {
  const handler = (info) => {
    console.log('登录状态变更', info)
  }
  mnb.on('user.updateLoginState', handler)
  return () => mnb.off('user.updateLoginState', handler)
}, [])
```

---

## 接口模块索引

根据需要查阅对应模块的详细文档：

| 模块 | 说明 | 参考文件 |
|------|------|----------|
| **app** | 设备能力（复制、震动、加解密、权限、状态栏、日历提醒等） | [references/app.md](references/app.md) |
| **user** | 用户（登录、注销、获取信息、登录状态监听） | [references/user.md](references/user.md) |
| **net** | 网络（代理请求、上传/下载文件、获取 headers） | [references/net.md](references/net.md) |
| **navigator** | 导航（打开/关闭视图、监听返回键） | [references/navigator.md](references/navigator.md) |
| **share** | 分享（分享面板、分享到第三方平台） | [references/share.md](references/share.md) |
| **media** | 媒体（选择/查看图片视频、保存图片、选择文件） | [references/media.md](references/media.md) |
| **publish** | 发布（发布笔记、长文草稿） | [references/publish.md](references/publish.md) |
| **memory** | 内存存储（set/get/delete） | [references/memory.md](references/memory.md) |
| **toast** | 提示组件（Toast、SnackBar） | [references/toast.md](references/toast.md) |
| **events** | 全局事件（主题、VIP、键盘、字号等） | [references/events.md](references/events.md) |
| **track** | 埋点 | [references/track.md](references/track.md) |
| **file** | 文件操作（读写、删除、压缩解压、获取 URI） | [references/file.md](references/file.md) |
| **kv** | 持久化 KV 存储（set/get/getAll/delete/clear） | [references/kv.md](references/kv.md) |
| **log** | 客户端日志（info/debug/error/logMonitor） | [references/log.md](references/log.md) |
| **business** | 业务特定（评论输入框、位置选择、笔记打开、蜂巢加入等） | [references/business.md](references/business.md) |
| **db** | 本地 SQLite 数据库（建库建表、增删改查） | [references/db.md](references/db.md) |
| **lifeCycle** | 页面生命周期（获取状态、监听前后台切换） | [references/lifecycle.md](references/lifecycle.md) |

---

## 快速查找指引

- **显示提示信息** → `toast.show` / `toast.showSnackBar`，见 [references/toast.md](references/toast.md)
- **用户登录/注销/获取信息** → `user.*`，见 [references/user.md](references/user.md)
- **发送网络请求** → `net.request`，见 [references/net.md](references/net.md)
- **上传图片/文件** → `net.uploadFile` / `media.selectMedia`，见 [references/net.md](references/net.md) 和 [references/media.md](references/media.md)
- **打开原生页面** → `navigator.open`（笔记/视频/话题/蜂巢/合集/榜单/评分对象/用户主页/群聊/H5/RN 等），见 [references/navigator.md](references/navigator.md)
- **分享内容** → `share.showShareMenu` / `share.share`，见 [references/share.md](references/share.md)
- **复制到剪贴板** → `app.copy`，见 [references/app.md](references/app.md)
- **监听登录状态变更** → `user.updateLoginState`，见 [references/user.md](references/user.md)
- **监听主题切换** → `app.changeTheme`，见 [references/events.md](references/events.md)
- **发布笔记** → `publish.note`，见 [references/publish.md](references/publish.md)
- **文件读写/压缩/上传** → `file.*`，见 [references/file.md](references/file.md)
- **持久化 KV 存储** → `kv.*`，见 [references/kv.md](references/kv.md)
- **写客户端日志** → `log.info/debug/error`，见 [references/log.md](references/log.md)
- **发表评论** → `comment.postComment`，见 [references/business.md](references/business.md)
- **加入/退出蜂巢** → `hive.join`，见 [references/business.md](references/business.md)
- **选择国家/地区** → `location.selectCountry` / `location.selectProvince`，见 [references/business.md](references/business.md)
- **打开笔记（iOS 动画转场）** → `note.open`，见 [references/business.md](references/business.md)
- **本地数据库操作** → `db.*`，见 [references/db.md](references/db.md)
- **监听页面生命周期** → `lifeCycle.stateChange`，见 [references/lifecycle.md](references/lifecycle.md)
- **监听发布结果** → `publish.stateChange`，见 [references/publish.md](references/publish.md)
- **控制 Android 返回键行为** → `navigator.keyBackExit`，见 [references/navigator.md](references/navigator.md)
- **打开群聊/创建群聊** → `navigator.open`（`nc/groupChat`、`nc/createGroupChat`、`nc/groupChatInfo` 等），见 [references/navigator.md](references/navigator.md)
- **打开设置页** → `navigator.open`（`nc/appsettings`、`nc/accountSetting`、`nc/privacySetting` 等），见 [references/navigator.md](references/navigator.md)
- **打开榜单/评分** → `navigator.open`（`nc/topicRank`、`nc/scoreObjRank`、`nc/scoreObj`），见 [references/navigator.md](references/navigator.md)

---

## 通用规范

1. **始终 catch 错误**：bridge 调用可能因原生环境异常而失败，务必 `.catch(() => {})`
2. **未登录场景**：`user.getUserInfo` 在未登录时会 reject，调用前需判断或 catch
3. **平台差异**：部分接口标注了 `仅iOS` 或 `仅Android`，跨平台开发时注意处理
4. **版本标注**：接口后跟 `2.x` 或 `xx.0` 表示最低客户端版本要求
5. **事件取消监听**：使用 `mnb.off('事件名', handler)` 取消监听，需保存与 `mnb.on` 相同的 handler 引用，组件卸载时务必调用