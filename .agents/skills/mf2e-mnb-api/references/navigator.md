# navigator 模块

页面导航：打开/关闭视图、监听返回键。

---

## navigator.open

打开客户端原生视图或 RN 页面。

### Options `object`

- `path` `string` — 视图路径（详见下方路径说明）

### 路径格式说明

```
nc/<页面类型>?<参数>
```

路由协议的设计原则：
- 参数使用 query params（而非 path params）
- 主键统一命名为 `id`

路径不仅用于 `navigator.open`，也通用于外部调起场景：
- **URL Scheme**：`ntescommunity://nc/{path}?{query}`
- **Universal Links（iOS）**：`http://link.m.163.com/community/applinks.html?path={path}&{query}`
- **推送通知 Payload**：`"path": "{path}?{query}"`

#### 内容

| 场景 | path |
|------|------|
| 图文/笔记详情页 | `nc/recImg?id=<recId>` |
| 视频详情页 | `nc/recVideo?id=<recId>` |
| 音乐图集详情页 | `nc/recMusicPhotos?id=<recId>` |
| 话题详情页 | `nc/topic?id=<topicId>` |
| 榜单详情页 | `nc/topicRank?id=<rankId>` |
| 评分榜单详情页 | `nc/scoreObjRank?id=<rankId>` |
| 评分对象详情页 | `nc/scoreObj?id=<scoreObjId>` |
| 评价库详情页 | `nc/evaluateLib?id=<evaLibId>` |
| 榜单聚合页 | `nc/rankSquare?tab=<categoryId>` |
| 蜂巢详情页 | `nc/hive?id=<hiveCode>` |
| 合集详情页 | `nc/collection?id=<collectionId>` |
| 搜索页 | `nc/search?word=<encodeURIComponent(word)>` |
| 发布页 | `nc/publish` |
| 查看图片 | `nc/viewImages?urls=<encodeURIComponent(用\|分隔的url)>&index=<index>` |
| 查看视频 | `nc/immersecommentvideo?postId=<postId>&docId=<docId>` |

**`recImg` 和 `recVideo` 的可选参数：**

| 参数 | 说明 |
|------|------|
| `topCommentId` | 要置顶的评论 id |
| `topReplyCommentId` | 置顶的被回复的评论 id |
| `topRootCommentId` | 置顶的评论根 id |
| `encPassport` | 置顶用户 passport |
| `scrollToComment` | 是否跳转到跟贴区（0/1） |
| `scrollToLikeFav` | 是否跳转到赞和收藏 tab 区（0/1） |
| `action` | 置顶用户行为（1=点赞，2=收藏） |

**`publish` 的可选参数：**

| 参数 | 说明 |
|------|------|
| `sessionid` | 标识是哪一次请求 |
| `topicName` | 话题名称 |
| `hiveCode` | 蜂巢 code |

**`scoreObjRank` 的可选参数：**

| 参数 | 说明 |
|------|------|
| `tab` | 定位到指定 tab（`scoreObj`=评分 tab，`comment`=评论 tab） |
| `topCommentId` / `topReplyCommentId` / `topRootCommentId` | 评论置顶参数 |

**`scoreObj` 的可选参数：**

| 参数 | 说明 |
|------|------|
| `topCommentId` / `topReplyCommentId` / `topRootCommentId` | 评论置顶参数 |
| `extra` | 额外信息（如同步到笔记引导信息） |

**`evaluateLib` 的可选参数：**`rankId` — 需要定位的榜单 id

#### 个人中心

| 场景 | path |
|------|------|
| 用户主页 | `nc/profile?id=<userId>` |
| 编辑资料页 | `nc/profileEdit` |
| 学历职业认证 | `nc/workEduAuth?tab=<edu\|work>` |
| 礼物墙 | `nc/gift?tab=<wall\|record>` |
| 我的钱包 | `nc/myWallet` |
| 我的反馈 | `nc/feedback` |
| 写反馈 | `nc/newFeedback` |
| 设置页 | `nc/appsettings` |
| 账号设置页 | `nc/accountSetting` |
| 通知设置页 | `nc/notificationSetting` |
| 隐私设置页 | `nc/privacySetting` |
| 评论隐藏设置页 | `nc/commentSetting?replyId=<replyId>` |
| 私信隐私设置页 | `nc/chatPrivateSetting` |
| 扫一扫 | `nc/qrcode` |
| 我发起的抽奖 | `nc/drawPrize` |

**`profile` 的可选参数：**`docId` — 用户发的内容 id（匿名用户时使用，此时 `id` 可不传）

#### 互动 & 通信

| 场景 | path |
|------|------|
| 收到点赞页 | `nc/praiseMe` |
| 收到评论页 | `nc/replyMe` |
| 新增关注页 | `nc/newFans` |
| 私聊 | `nc/privateChat?id=<encrypted-chatId>` |
| 官方号私聊 | `nc/officialServiceChat?id=<encrypted-chatId>` |
| 群聊 | `nc/groupChat?id=<groupId>` |
| 创建群聊 | `nc/createGroupChat` |
| 群资料页 | `nc/groupChatInfo?id=<groupId>` |
| 加群审批页 | `nc/groupChatApplyList?id=<groupId>` |
| 群精华页 | `nc/groupCream?groupId=<groupId>` |
| 群相册页 | `nc/groupAlbum?groupId=<groupId>` |

**`groupChat` 的可选参数：**`conversationId` — 云信通道会话 id

**`groupChatInfo` 的可选参数：**

| 参数 | 说明 |
|------|------|
| `msgId` | 附带的消息 id，用于群内分享内容回流 |
| `encPassport` | 邀请人加密 passport |
| `source` | 业务来源，主要用于有储备群业务的加群逻辑 |

**`groupChatApplyList` 的可选参数：**`groupName` — 群聊名称

**`groupCream` 的可选参数：**`msgId` — 附带的消息 id，用于精华页置顶

#### 框架 & 导航

| 场景 | path | 备注 |
|------|------|------|
| H5 页面 | `nc/web?id=<encodeURIComponent(url)>` | |
| RN 页面（默认从右滑入） | `nc/page?id=<moduleId>` | id 格式为 `component@split`，split 可选 |
| RN 页面（从下弹出） | `nc/page?id=<moduleId>&__openType=2` | |
| RN 透明弹层 | `nc/page?id=<moduleId>&__openType=3&transparent=1` | |
| 启动 APP | `nc/startup?inviteCode=<inviteCode>` | inviteCode 选填 |
| 切换到首页 Tab | `nc/newRoot?tab=home` | |
| 切换到广场 Tab | `nc/newRoot?tab=square` | |
| 切换到消息 Tab | `nc/newRoot?tab=message` | |
| 切换到我的 Tab | `nc/newRoot?tab=user` | |
| 切换到关注频道 | `nc/newRoot?tab=home&column=follow` | |
| 切换到发现频道 | `nc/newRoot?tab=home&column=discover` | |
| 切换到蜂巢频道 | `nc/newRoot?tab=home&column=hive` | |

`__openType` 说明：
- 不传（默认）：从右往左滑入
- `__openType=2`：从下往上弹出
- `__openType=3&transparent=1`：透明背景（用于弹层、覆盖层）

```js
// 打开笔记详情
mnb('navigator.open', { path: `nc/recImg?id=${noteId}` }).catch(() => {})

// 打开视频详情（置顶评论）
mnb('navigator.open', {
  path: `nc/recVideo?id=${recId}&topCommentId=${commentId}&topRootCommentId=${rootCommentId}`,
}).catch(() => {})

// 打开笔记详情并跳转到赞和收藏区
mnb('navigator.open', {
  path: `nc/recImg?id=${recId}&scrollToLikeFav=1`,
}).catch(() => {})

// 打开话题详情
mnb('navigator.open', { path: `nc/topic?id=${topicId}` }).catch(() => {})

// 打开蜂巢详情
mnb('navigator.open', { path: `nc/hive?id=${hiveCode}` }).catch(() => {})

// 打开榜单详情
mnb('navigator.open', { path: `nc/topicRank?id=${rankId}` }).catch(() => {})

// 打开评分对象详情
mnb('navigator.open', { path: `nc/scoreObj?id=${scoreObjId}` }).catch(() => {})

// 打开搜索页
mnb('navigator.open', {
  path: `nc/search?word=${encodeURIComponent(keyword)}`,
}).catch(() => {})

// 打开发布页（带话题和蜂巢）
mnb('navigator.open', {
  path: `nc/publish?topicName=${encodeURIComponent(topicName)}&hiveCode=${hiveCode}`,
}).catch(() => {})

// 打开用户主页
mnb('navigator.open', { path: `nc/profile?id=${userId}` }).catch(() => {})

// 打开私聊
mnb('navigator.open', { path: `nc/privateChat?id=${chatId}` }).catch(() => {})

// 打开群资料页
mnb('navigator.open', { path: `nc/groupChatInfo?id=${groupId}` }).catch(() => {})

// 打开 H5 页面
mnb('navigator.open', {
  path: `nc/web?id=${encodeURIComponent('https://m.163.com')}`,
}).catch(() => {})

// 打开 RN 页面（从下往上）
mnb('navigator.open', {
  path: 'nc/page?id=rn-my-page&__openType=2',
}).catch(() => {})

// 打开 RN 透明弹层
mnb('navigator.open', {
  path: 'nc/page?id=rn-my-dialog&__openType=3&transparent=1',
}).catch(() => {})

// 查看多图
const urls = 'http://example.com/img1.jpg|http://example.com/img2.jpg'
mnb('navigator.open', {
  path: `nc/viewImages?urls=${encodeURIComponent(urls)}&index=0`,
}).catch(() => {})

// 切换到广场 Tab
mnb('navigator.open', { path: 'nc/newRoot?tab=square' }).catch(() => {})

// 切换到发现频道
mnb('navigator.open', { path: 'nc/newRoot?tab=home&column=discover' }).catch(() => {})
```

---

## navigator.close

关闭当前 RN 视图或 H5 视图。

```js
mnb('navigator.close', {}).catch(() => {})
```

---

## navigator.backPress（事件）

监听用户点击系统返回键（Android 返回键 / iOS 侧滑）。

```js
useEffect(() => {
  const handler = (info) => {
    console.log('返回键被按下', info)
    // 可在此处拦截默认返回行为
  }
  mnb.on('navigator.backPress', handler)
  return () => mnb.off('navigator.backPress', handler)
}, [])
```

---

## navigator.keyBackExit

控制 Android 物理返回键是否退出当前页面。**仅 Android 有效。**

### Options `object`

- `exit` `boolean` — `true` 表示点击返回键直接退出（默认行为）；`false` 表示禁止返回键退出页面

```js
// 禁止物理返回键退出（适合需要拦截返回事件的场景）
mnb('navigator.keyBackExit', { exit: false }).then(() => {})

// 恢复物理返回键退出
mnb('navigator.keyBackExit', { exit: true }).then(() => {})
```

> 注意：禁用后如需自定义返回行为，配合 `navigator.backPress` 事件使用。

