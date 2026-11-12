# share 模块

分享能力：唤起分享面板、分享内容到第三方平台、监听分享按钮点击。

---

## share.showShareMenu

唤起客户端分享面板，让用户选择分享平台。

**重要**：为了统一原生视图中所有分享行为，客户端中的分享按钮被点击时，会回调前端的 `share.handleShareTap` 事件。前端需要提前注册该事件，在回调中调用 `share.share` 执行实际分享。

### Options `object`

- `showShareCard` `boolean` — 是否展示"分享卡片"按钮
- `hideCopyUrl` `boolean` — 是否隐藏"复制链接"按钮
- `showIMChat` `boolean` — 是否展示"分享到聊天"按钮（仅蜂蜜社区）
- `IMChatData` `object` — 分享到聊天的数据结构（仅蜂蜜社区，`showIMChat=true` 时传入）
  - `type` `string` — 内容类型：`'activity'` / `'card'` / `'ency'` / `'paper'`
  - `title` `string` — 卡片标题
  - `description` `string` — 卡片描述
  - `image` `string` — 卡片配图 URL
  - `imageRatio` `float` — 图片比例，如 `1.77`（16/9）
  - `link` `string` — 卡片链接
  - `icon` `string` — 图标地址
  - `shareTip` `string` — 消息列表中显示的文案

```js
// 基本分享面板
mnb('share.showShareMenu', {
  showShareCard: false,
  hideCopyUrl: false,
}).catch(() => {})

// 带分享卡片和聊天（蜂蜜社区）
mnb('share.showShareMenu', {
  showShareCard: true,
  showIMChat: true,
  IMChatData: {
    type: 'activity',
    title: '活动标题',
    description: '活动描述',
    image: 'https://example.com/cover.jpg',
    imageRatio: 1.77,
    link: 'ntescommunity://nc/page?id=rn-my-page',
  },
}).catch(() => {})
```

---

## share.handleShareTap（事件）

监听原生视图中分享按钮的点击事件。收到回调后，根据 `tag` 执行对应的分享操作。

### 参数 `object`

- `tag` `number` — 分享平台编号（见下方列表）

**平台 tag 对应关系：**

| tag | 平台 |
|-----|------|
| 201 | 新浪微博 |
| 204 | QQ 空间 |
| 207 | QQ 好友 |
| 208 | 微信好友 |
| 209 | 微信朋友圈 |
| 213 | 有道云笔记 |
| 302 | 群聊 (`96.0`) |
| 400 | 复制链接 |
| 500 | 分享卡片 |

```js
useEffect(() => {
  const handler = ({ tag }) => {
    if (tag === 500) {
      // 分享卡片：打开分享卡片页面
      mnb('navigator.open', {
        path: `nc/page?id=rn-share-cards&__openType=3&page=note&dataId=${noteId}`,
      }).catch(() => {})
      return
    }
    // 其他平台：执行分享
    mnb('share.share', {
      tag,
      title: '分享标题',
      text: '分享描述',
      url: 'https://example.com/article.html',
      imageUrl: 'https://example.com/cover.png',
    }).catch(() => {})
  }
  mnb.on('share.handleShareTap', handler)
  return () => mnb.off('share.handleShareTap', handler)
}, [])
```

---

## share.share

分享图片或链接到第三方平台。

> 客户端会自动基于所选平台上报 `SHARE_NEWS` 埋点事件。

### Options `object`

- `tag` `number` — 分享平台编号（同上方 tag 列表）
- `imageUrl` `string`（可选）— 图片地址
  - 图片分享时：为图片本身地址
  - 链接分享时：为缩略图地址，留空则默认使用 App icon
- `title` `string`（可选）— 分享标题，链接分享时需要
- `text` `string`（可选）— 分享描述
- `url` `string`（可选）— 分享链接，链接分享时需要
- `skipType` `string`（可选）— 内容类型，仅 `tag=302`（群聊）时有效
- `skipId` `string`（可选）— 内容 ID，仅 `tag=302`（群聊）时有效

```js
// 分享图片
mnb('share.share', {
  tag: 208,
  imageUrl: 'https://example.com/photo.jpg',
  text: '这是一张图片',
}).catch(() => {})

// 分享链接到微信好友
mnb('share.share', {
  tag: 208,
  imageUrl: 'https://example.com/cover.png',
  title: '文章标题',
  text: '文章摘要描述',
  url: 'https://c.m.163.com/news/a/XXXXX.html',
}).catch(() => {})

// 分享到群聊
mnb('share.share', {
  tag: 302,
  title: '分享内容标题',
  text: '分享描述',
  url: 'newsapp://nc/rnpage?id=rn-hot-collection@index',
  skipType: 'doc',
  skipId: 'XXXXX',
}).catch(() => {})

// 分享链接（缩略图为空，使用默认 App icon）
mnb('share.share', {
  tag: 209,
  title: '分享标题',
  text: '分享描述',
  url: 'https://example.com/',
}).catch(() => {})
```

---

## share.shareCard

生成分享卡片。

```js
mnb('share.shareCard', { /* 卡片参数 */ }).catch(() => {})
```

---

## share.shareCardLoading / share.shareCardFail

分享卡片的加载状态和失败状态通知。

```js
mnb('share.shareCardLoading').catch(() => {})
mnb('share.shareCardFail').catch(() => {})
```

---

## share.selectTo

选择分享目标。

```js
mnb('share.selectTo', { /* 参数 */ }).catch(() => {})
```
