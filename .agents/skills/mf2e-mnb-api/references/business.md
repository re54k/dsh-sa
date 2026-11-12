# business 模块

业务特定能力：评论、位置、笔记、蜂巢等蜂蜜社区特有接口。

---

## comment.postComment `2.22`

唤起原生评论输入框，让用户发表跟贴评论。

> **注意**：此接口使用**回调模式**（第三个参数为回调函数），而非 Promise。

### Options `object`

- `contentId` `string` — 内容 id
- `replyId` `string` — 主贴 id
- `commentId` `string` — 回复的评论 id（回复某条评论时传入）
- `placeholder` `string` — 输入框预设文案（如 `'回复 xxx'`）
- `content` `string` — 预填写的内容
- `from` `string` — 来源，用于 Galaxy 统计（如 `'文章'`、`'视频'`、`'跟贴页'`）
- `picClose` `string` — `'1'` 关闭图片上传，`'0'` 开启（默认开启）
- `videoClose` `string` — `'1'` 关闭视频上传，`'0'` 开启
- `emojiClose` `string` — `'1'` 关闭 Emoji，`'0'` 开启
- `atClose` `string` — `'1'` 关闭 @ 功能，`'0'` 开启（`2.22`）
- `syncRec` `string` — 是否显示"同步到动态"：`'0'` 不显示，`'1'` 显示且不勾选，`'2'` 显示且勾选
- `anonymous` `string` — `'0'` 不支持匿名，`'1'` 支持匿名（`2.44`）

> `nickName` 字段已废弃，使用 `placeholder` 替代。

### Callback 参数 `object`

- `mockData` `object` — 发送成功后服务端返回的跟贴假数据中的 `data`（`68.0`，**优先使用**）
- `postId` `string` — 服务端生成的 postId（`66.0`）
- `content` `string` — 用户输入的内容
- `imageInfo` `object` — 用户选择的图片信息（`66.0`）
  - `url` `string`、`width` `number`、`height` `number`

```js
// 回复某条评论
mnb(
  'comment.postComment',
  {
    replyId: postId,
    commentId: targetCommentId,
    placeholder: `回复 ${targetNickname}`,
    from: '跟贴页',
    picClose: '1',   // 回复时关闭图片
    videoClose: '1',
  },
  (result) => {
    console.log('回复成功', result)
  },
)
```

---

## location.selectCountry

调起国家选择器。

### Returns `object`

- `name` `string` — 国家名称
- `code` `string` — 国家代码

```js
const { name, code } = await mnb('location.selectCountry')
console.log(name, code) // 如：中国  CN
```

---

## location.selectProvince

调起地区选择器（基于国家代码筛选）。

### Options `object`

- `code` `string` — 国家代码（来自 `location.selectCountry` 返回的 `code`）

### Returns `object`

- `name` `string` — 地区名称
- `code` `string` — 地区代码

```js
// 通常与 selectCountry 配合使用
const country = await mnb('location.selectCountry')
if (country.name === '中国') {
  const province = await mnb('location.selectProvince', { code: country.code })
  console.log(province.name, province.code)
}
```

---

## note.open

打开笔记详情页，支持 iOS 动画转场（元素共享动画）。**仅 iOS 有效。**

### Options `object`

- `skipID` `string` — 笔记 id
- `skipType` `string` — 内容类型：`'recImg'`（图文笔记）/ `'recVideo'`（视频笔记）
- `reactTag` `number` — RN 组件的 native tag，通过 `findNodeHandle(ref)` 获取，用于实现图片点击展开的转场动画

```js
import { findNodeHandle, useRef } from 'react-native'

const imageRef = useRef(null)

const handlePress = () => {
  const reactTag = findNodeHandle(imageRef.current)
  mnb('note.open', {
    skipID: noteId,
    skipType: 'recImg',
    reactTag,
  }).catch(() => {})
}

// JSX
<TouchableOpacity onPress={handlePress}>
  <Image ref={imageRef} source={{ uri: coverUrl }} style={{ width: 100, height: 100 }} />
</TouchableOpacity>
```

> 如果不需要转场动画，直接用 `navigator.open` 的 `nc/recImg?id=xxx` 路径即可，无平台限制。

---

## hive.join

加入或退出蜂巢。

### Options `object`

- `action` `string` — `'join'` 加入 / `'quit'` 退出
- `hiveCode` `string` — 蜂巢 id

```js
// 加入蜂巢
await mnb('hive.join', { action: 'join', hiveCode: 'HV1741679737635' })

// 退出蜂巢
await mnb('hive.join', { action: 'quit', hiveCode: 'HV1741679737635' })
```
