# net 模块

网络相关能力：客户端代理请求、上传/下载文件、获取网络状态和请求 headers。

---

## net.request

通过客户端代理发送 HTTP 请求。适合需要携带客户端默认 headers（Cookie、User-Agent 等）的场景。

### Options `object`

- `method` `string` — 请求方法，大小写均可，**不能省略**（`'get'` / `'post'` 等）
- `url` `string` — 完整请求地址，含协议头。**GET 请求需自行将参数拼接到 url 或使用 `params` 字段**
- `params` `object`（可选）— GET 请求查询参数，会自动拼接到 url
- `headers` `object`（可选）— 附加 headers
  - 默认 `Content-Type` 为 `application/x-www-form-urlencoded; charset=UTF-8`
  - **修改 `Content-Type` 后边必须带上 `charset=UTF-8`**
- `data` `object|string`（可选）— POST 请求体

### Returns `string`

服务端返回的响应体（字符串）。如果是 JSON 响应，需要自行 `JSON.parse()`。

```js
// GET 请求
const res = await mnb('net.request', {
  method: 'get',
  url: 'https://gw.m.163.com/nc/api/v1/paid-rank/rank-list',
  params: { listType: 'story', tab: 'hot' },
})
const data = JSON.parse(res)

// POST 表单请求（默认 Content-Type）
await mnb('net.request', {
  method: 'post',
  url: 'https://c.m.163.com/reader/api/medal/wall',
  data: { status: '1', userId: '123' },
})

// POST JSON 请求
await mnb('net.request', {
  method: 'post',
  url: 'https://api.example.com/data',
  headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  data: JSON.stringify({ key: 'value' }),
})

// POST 二进制/字符串体
await mnb('net.request', {
  method: 'post',
  url: 'https://api.example.com/upload',
  headers: { 'Content-Type': 'application/octet-stream; charset=UTF-8' },
  data: 'base64EncodedString==',
})
```

---

## net.getHeaders

获取客户端发送请求时默认携带的 headers（含鉴权信息）。

### Returns `object`

包含 `User-id`、`User-D` 等客户端默认请求头字段。

```js
const headers = await mnb('net.getHeaders')
```

---

## net.getNetState

获取当前网络连接状态。

### Returns `object`

- `networkType` `string` — 网络类型：`'wifi'` / `'4g'` / `'wwan'` / `'bad'` / `'unknown'` 等

```js
const { networkType } = await mnb('net.getNetState')
if (networkType === 'wifi') {
  // WiFi 环境
}
```

---

## net.changeNetworkType（事件）

网络类型发生变化时触发。

### 参数 `object`

- `networkType` `string` — 同 `net.getNetState` 返回值

```js
useEffect(() => {
  const handler = ({ networkType }) => {
    console.log('网络变化:', networkType)
  }
  mnb.on('net.changeNetworkType', handler)
  return () => mnb.off('net.changeNetworkType', handler)
}, [])
```

---

## net.preload（仅 Android）

预加载 URL 资源，提升后续请求速度。**目前仅 Android 平台支持。**

### Options `object`

- `urls` `array` — 预加载列表，每项结构同 `net.request` 的 Options

```js
mnb('net.preload', {
  urls: [
    { method: 'get', url: 'https://api.example.com/data', params: { page: 1 } },
    { method: 'post', url: 'https://api.example.com/submit', data: { id: '123' } },
  ],
}).catch(() => {})
```

---

## net.uploadFile

上传文件到 NOS（网易对象存储）。

### Options `object`

- `files` `array` — 待上传文件列表
  - `uri` `string` — 本地文件路径（通常来自 `media.selectMedia` 返回的 `fileUri`）
  - `id` `string`（可选）— 自定义标识符，用于在返回值中对应
- `bucket` `string`（可选）— 存储桶名称，默认 `'mobilepics'`
- `isProgress` `boolean`（可选）— 是否显示上传进度，默认 `false`

### Returns `array`

每项对应 `files` 中的一个文件：
- `id` `string`（可选）— 对应传入的 `id`
- `url` `string` — 上传后的网络地址

```js
// 基本上传
const result = await mnb('net.uploadFile', {
  files: [{ uri: localFileUri, id: 'myFile' }],
  bucket: 'mobilepics',
})
console.log(result[0].url) // 上传后的网络地址

// 上传到指定 bucket
await mnb('net.uploadFile', {
  files: [{ uri: localFileUri }],
  bucket: 'worklife-file',
})

// 带进度监听（需配合 net.uploadFileProgress 事件）
await mnb('net.uploadFile', {
  files: [{ uri: localFileUri, id: tempId }],
  isProgress: true,
})
```

---

## net.uploadFileProgress（事件）

监听文件上传进度（配合 `isProgress: true` 使用）。

### 参数 `object`

- `id` `string` — 文件 id（对应 uploadFile 传入的 id）
- `taskId` `string` — 任务 id（可用于取消上传）
- `uploadedSize` `number` — 已上传字节数
- `totalSize` `number` — 总字节数

```js
useEffect(() => {
  const handler = (res) => {
    const progress = Math.floor((res.uploadedSize / res.totalSize) * 100)
    setProgress(progress)
    uploadTaskIdRef.current = res.taskId
  }
  mnb.on('net.uploadFileProgress', handler)
  return () => mnb.off('net.uploadFileProgress', handler)
}, [])
```

---

## net.uploadFileCancel（仅 Android）

取消正在进行的文件上传。

### Options `object`

- `taskId` `string` — 任务 id，来自 `net.uploadFileProgress` 事件

```js
mnb('net.uploadFileCancel', { taskId: uploadTaskId }).catch(() => {})
```

---

## net.downloadFile

下载文件到本地。

### Options `object`

- `files` `array` — 待下载文件列表
  - `url` `string` — 网络文件地址
  - `filePath` `string`（可选）— 下载到本地 cache 目录下的子路径，默认 `'downloads'`
  - `id` `string`（可选）— 自定义标识符

### Returns `array`

每项对应 `files` 中的一个文件：
- `url` `string` — 原始网络地址
- `path` `string` — 下载后的本地文件路径

```js
const result = await mnb('net.downloadFile', {
  files: [
    { url: 'https://example.com/file.pdf', id: '1' },
    { url: 'https://example.com/image.jpg' },
  ],
})
console.log(result[0].path) // 本地文件路径
```

---

## net.uploadLive

上传 Live 图（动态照片）到 NOS。

### Options

传入 `media.selectMedia` 返回的 Live 图数据结构（单项）。

### Returns `object`

- `fileUri` `string` — 图片本地地址
- `url` `string` — 图片网络地址
- `livePhotoInfo` `object` — Live 图信息
  - `imageUri` `string` — 图片本地路径
  - `imageUrl` `string` — 图片网络地址
  - `videoUri` `string` — 视频本地路径
  - `videoUrl` `string` — 视频网络地址

```js
// res[0] 为 media.selectMedia 返回的 Live 图数据
const uploaded = await mnb('net.uploadLive', res[0])
console.log(uploaded.livePhotoInfo.imageUrl)
```
