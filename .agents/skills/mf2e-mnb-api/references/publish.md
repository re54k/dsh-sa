# publish 模块

发布能力：发布笔记、长文草稿操作。

---

## publish.note `2.32`

调用客户端发布器发布笔记。

### Options `object`

- `mediaType` `string`（可选）— 媒体类型
  - `'text2img'` — 文字生图
  - `'longText2img'` — 长文生图
  - `'rn2img'` — RN 生图
  - `'custom'` — 自定义
- `templateId` `string`（可选）— 模板 id
- `title` `string`（可选）— 笔记标题
- `content` `string`（可选）— 笔记内容
- `text` `string`（可选）— 长文生图文本
- `hiveInfo` `object`（可选）— 蜂巢信息
  - `hiveCode` `string`、`name` `string`、`icon` `string`
- `images` `array`（可选）— 图片列表
  - `imgUrl` `string`、`bgColor` `string`
- `components` `object`（可选）— `{ linkUrl }` 等

### Returns `object`

- `state` `string` — `'success'` / `'fail'` / `'saveDraft'`
- `data` `object` — `state='success'` 时，服务端接口返回的数据

```js
// 普通发布（预设标题和内容）
const result = await mnb('publish.note', {
  title: '这是预设标题',
  content: '这是预设内容',
})
if (result.state === 'success') {
  console.log('发布成功', result.data)
}

// 带蜂巢的发布
await mnb('publish.note', {
  title: '标题',
  hiveInfo: {
    hiveCode: 'HV1741679737635',
    name: '校园',
    icon: 'https://example.com/hive-icon.png',
  },
})

// 长文生图发布
await mnb('publish.note', {
  mediaType: 'rn2img',
  templateId: '11',
  text: '生图文本内容',
  images: [{ imgUrl: 'https://example.com/bg.jpg' }],
})
```

---

## publish.longNote（已废弃）

~~调用客户端发布长文笔记（已废弃，新项目请使用 `publish.note`）。~~

---

## publish.setLongNoteDraft

存储长文草稿（永久或临时）。

### Options `object`

- `content` `string` — 草稿内容（建议 `JSON.stringify({title, content})`）
- `title` `string` — 草稿标题
- `draftId` `string` — 草稿 id，新建时传空字符串 `''`
- `temp` `boolean`（可选）— `true` 表示存为临时草稿，默认存永久草稿

### Returns `object`

- `draftId` `string` — 草稿 id（新建时由客户端生成）

```js
// 存永久草稿
const { draftId } = await mnb('publish.setLongNoteDraft', {
  content: JSON.stringify({ title, content }),
  title,
  draftId: '',  // 新建传空
})

// 更新已有草稿
await mnb('publish.setLongNoteDraft', {
  content: JSON.stringify({ title, content }),
  title,
  draftId: existingDraftId,
})

// 存临时草稿
await mnb('publish.setLongNoteDraft', {
  content: JSON.stringify({ title, content }),
  title,
  draftId: '',
  temp: true,
})
```

---

## publish.getLongNoteDraft

获取长文草稿内容。

### Options `object`

- `draftId` `string` — 草稿 id

### Returns `object`

- 草稿数据，结构与 `setLongNoteDraft` 传入的 `content` 对应

```js
const draft = await mnb('publish.getLongNoteDraft', { draftId })
const { title, content } = JSON.parse(draft.content)
```

---

## publish.deleteTempLongNoteDraft

删除临时草稿。

```js
await mnb('publish.deleteTempLongNoteDraft', { draftId })
```

---

## publish.publishLongNote

一键排版并发布长文。

### Options `object`

- `content` `string` — 长文内容
- `draftId` `string` — 草稿 id

```js
await mnb('publish.publishLongNote', {
  content: longTextContent,
  draftId: currentDraftId,
})
```

---

## publish.stateChange（事件）

监听发布页的发布结果回调。配合 `navigator.open` 打开 `nc/publish?sessionid=xxx` 使用，当用户在原生发布页完成操作后触发。

### 参数 `object`

- `sessionid` `string` — 本次发布请求的唯一 id，与 `nc/publish?sessionid=xxx` 中的值对应
- `state` `string` — 发布结果：`'success'` / `'fail'` / `'saveDraft'`
- `data` `object` — 发布成功时，后台接口返回的内容数据（含 `recommendDetail.title` 等）

```js
useEffect(() => {
  return mnb.on('publish.stateChange', (res) => {
    if (res.state === 'success') {
      console.log('发布成功，标题:', res.data?.recommendDetail?.title)
    } else if (res.state === 'saveDraft') {
      console.log('已存草稿')
    } else {
      console.log('发布失败')
    }
  })
}, [])

// 打开发布页，传入 sessionid
mnb('navigator.open', {
  path: `nc/publish?topicName=${encodeURIComponent('生活种草')}&sessionid=unique-session-id`,
}).catch(() => {})
```
