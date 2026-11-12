# track 模块

埋点相关能力。

---

## track.sendEvent

发送自定义埋点事件。

### Options `object`

- `eventId` `string` — 事件 id（与埋点文档对应）
- `tag` `string`（可选）— 标签
- `du` `string`（可选）— 时长
- `kv` `Record<string, string>`（可选）— 额外的键值对参数

```js
// 基本埋点
mnb('track.sendEvent', { eventId: 'NOTE_LIKE_CLICK' }).catch(() => {})

// 带 tag
mnb('track.sendEvent', { eventId: 'PAGE_VIEW', tag: 'home' }).catch(() => {})

// 带额外参数
mnb('track.sendEvent', {
  eventId: 'CONTENT_SHARE',
  kv: { contentId: noteId, contentType: 'note' },
}).catch(() => {})
```

---

## feedback.feedbackUploadLog

上传日志文件（用于用户反馈场景）。

### Returns `string`

上传后的文件地址。

```js
const logUrl = await mnb('feedback.feedbackUploadLog')
```
