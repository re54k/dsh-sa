# kv 模块

客户端持久化 KV 存储（Key-Value 数据库）。比 `memory` 模块更持久，App 重启后数据依然保留。

**重要说明：**

- **值统一使用字符串存储**，与客户端协商一致。如需存储对象，先 `JSON.stringify()`；读取后再 `JSON.parse()`。
- `kvName` 不存在时 `kv.set` 会自动创建，通常无需手动调用 `kv.createKV`。
- `kvName` 默认值为 `'defaultKV'`（省略时使用默认 KV 库）。
- **兼容性注意**：`kv.get` 在 iOS 返回 object，Android 返回 string——如果存入的是 JSON 字符串，读出后请统一做一次 `typeof res === 'string' ? JSON.parse(res) : res` 处理。

---

## kv.createKV

手动创建 KV 库（通常不需要显式调用，`kv.set` 会自动创建）。

### Options `object`

- `kvName` `string` — KV 库名称

```js
await mnb('kv.createKV', { kvName: 'my_kv_store' })
```

---

## kv.set

设置键值对（如果 KV 库不存在会自动创建）。

### Options `object`

- `kvName` `string` — KV 库名称
- `key` `string` — 键名
- `value` `string` — 值（**务必为字符串**）

```js
// 存储字符串
await mnb('kv.set', {
  kvName: 'my_kv_store',
  key: 'user_pref',
  value: 'dark',
})

// 存储对象（先序列化）
await mnb('kv.set', {
  kvName: 'my_kv_store',
  key: 'config',
  value: JSON.stringify({ theme: 'dark', fontSize: 16 }),
})
```

---

## kv.get

获取单个键的值。键不存在时返回空字符串或 null。

### Options `object`

- `kvName` `string` — KV 库名称
- `key` `string` — 键名

### Returns `string | object`

> iOS 可能返回 object，Android 返回 string，建议统一处理。

```js
const value = await mnb('kv.get', { kvName: 'my_kv_store', key: 'user_pref' })

// 如果存入的是 JSON 字符串，统一处理双端差异：
const raw = await mnb('kv.get', { kvName: 'my_kv_store', key: 'config' })
const config = typeof raw === 'string' ? JSON.parse(raw) : raw
```

---

## kv.getAll

获取 KV 库中的全部键值对。

### Options `object`

- `kvName` `string` — KV 库名称

### Returns `object`

键值对集合，格式为 `{ key1: value1, key2: value2, ... }`。

```js
const allData = await mnb('kv.getAll', { kvName: 'my_kv_store' })
console.log(Object.keys(allData)) // 所有键名
```

---

## kv.delete

删除单个键。

### Options `object`

- `kvName` `string` — KV 库名称
- `key` `string` — 键名

```js
await mnb('kv.delete', { kvName: 'my_kv_store', key: 'user_pref' })
```

---

## kv.clear

清空整个 KV 库（删除所有键值对）。

### Options `object`

- `kvName` `string` — KV 库名称

```js
await mnb('kv.clear', { kvName: 'my_kv_store' })
```

---

## 与 memory 模块的区别

| 对比项 | `memory` | `kv` |
|--------|----------|------|
| 持久性 | 内存，App 重启后丢失 | 持久化，重启后保留 |
| 场景 | 页面内跨组件共享状态 | 需要跨次启动保存的配置、偏好 |
| 性能 | 更快（内存读写） | 略慢（磁盘 I/O） |
