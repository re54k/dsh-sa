# memory 模块

内存存储能力：在客户端内存中读写键值对，页面间共享临时数据。

> 注意：memory 存储是**临时性**的，App 重启后数据会丢失。用于页面间传递数据（如分享卡片数据预取）。

---

## memory.set

写入数据到内存存储。**统一使用字符串存储**，如需存对象须先 `JSON.stringify()`。

### Options `object`

- `key` `string` — 键名
- `value` `string` — 值（字符串）

```js
// 存字符串
await mnb('memory.set', { key: 'userId', value: '12345' })

// 存对象（需先序列化）
await mnb('memory.set', {
  key: `note_data_${noteId}`,
  value: JSON.stringify({ title, content, coverUrl }),
})
```

---

## memory.get

读取内存存储中的数据。

### Options `object`

- `key` `string` — 键名

### Returns `string`

存储的字符串值。

```js
const value = await mnb('memory.get', { key: 'userId' })

// 读取对象（需反序列化）
const raw = await mnb('memory.get', { key: `note_data_${noteId}` })
const noteData = JSON.parse(raw)
```

---

## memory.delete

删除内存存储中的数据。

### Options `object`

- `key` `string` — 键名

```js
await mnb('memory.delete', { key: `note_data_${noteId}` })
```

---

## 典型使用场景：分享卡片数据预取

分享卡片场景下，RN 主页面需要在用户点击分享时，提前把卡片需要的数据写入 memory，分享卡片页面再从 memory 读取：

```js
// 主页面：用户点击分享时写入数据
const noteKey = `note_data_${noteId}`
await mnb('memory.set', {
  key: noteKey,
  value: JSON.stringify({
    noteId,
    title,
    coverUrl,
    authorName,
  }),
})

// 然后打开分享卡片页
mnb('navigator.open', {
  path: `nc/page?id=rn-share-cards&__openType=3&page=note&dataId=${noteId}`,
}).catch(() => {})

// 分享卡片页面：读取数据
const raw = await mnb('memory.get', { key: `note_data_${noteId}` })
const noteData = JSON.parse(raw)
```
