# media 模块

媒体能力：选择/查看图片和视频、保存图片、选择/查看文件。

---

## media.selectMedia

调起相册/相机，选择图片或视频。

### Options `object`

- `type` `string`（可选）— 媒体类型
  - `'image/*'` — 仅图片
  - `'video/*'` — 仅视频
  - `'*/*'` — 图片和视频均可（默认）
- `maxCount` `number`（可选）— 最多选择数量
- `needBase64` `boolean`（可选）— 是否需要 base64 格式
- `needUrl` `boolean`（可选）— 是否上传到 NOS 并返回网络地址，默认 `false`
- `cropWidth` `number`（可选）— 裁剪宽度（像素）
- `cropHeight` `number`（可选）— 裁剪高度（像素）
- `needCrop` `boolean`（可选）— 是否需要裁剪
- `needEdit` `boolean`（可选）— 是否需要编辑（涂鸦、贴纸、裁切、马赛克、滤镜）

### Returns `array`

每项包含：
- `fileUri` `string` — 本地文件路径
- `url` `string` — 网络地址（`needUrl=true` 时有值）
- `livePhotoInfo` `object`（Live 图时有值）
  - `imageUri`、`imageUrl`、`videoUri`、`videoUrl`

```js
// 选择单张图片（不上传）
const result = await mnb('media.selectMedia', { type: 'image/*', maxCount: 1 })
const localUri = result[0].fileUri

// 选择多张图片并上传到 NOS
const result = await mnb('media.selectMedia', { type: 'image/*', maxCount: 9, needUrl: true })

// 选择图片并裁剪为正方形
const result = await mnb('media.selectMedia', {
  type: 'image/*',
  maxCount: 1,
  needCrop: true,
  cropWidth: 400,
  cropHeight: 400,
})

// 选择图片并进入编辑器（涂鸦等）
const result = await mnb('media.selectMedia', {
  type: 'image/*',
  maxCount: 10,
  needEdit: true,
})

// 图片和视频都可以选
const result = await mnb('media.selectMedia', { type: '*/*', maxCount: 5 })
```

---

## media.viewMedia

查看图片或视频，支持编辑和删除功能。这是当前推荐的查看接口。

### Options `object`

- `items` `array` — 媒体列表
  - `key` `number`（可选）— 媒体唯一 id（仅需要编辑/删除时传）
  - `type` `string` — 类型：`'Image'` / `'Video'`
  - `fileUri` `string`（可选）— 本地地址
  - `url` `string`（可选）— 网络地址
  - `livePhotoInfo` `object`（可选）— Live 图信息（imageUri/videoUri/imageUrl/videoUrl）
- `needDelete` `boolean` — 是否支持删除
- `needEdit` `boolean` — 是否支持编辑
- `idx` `number` — 初始显示第几个（0-indexed）

### Returns `array`

当 `needEdit=true` 或 `needDelete=true` 时有返回值，格式同传入的 `items`。

```js
// 查看图片，不可编辑删除
await mnb('media.viewMedia', {
  items: [
    { type: 'Image', url: 'https://example.com/photo.jpg' },
    { type: 'Image', fileUri: localUri },
  ],
  needDelete: false,
  needEdit: false,
  idx: 0,
})

// 查看图片，支持删除和编辑
const result = await mnb('media.viewMedia', {
  items: mediaList.map((m, i) => ({ ...m, key: i })),
  needDelete: true,
  needEdit: true,
  idx: 0,
})
// result 为操作后的媒体列表
```

---

## media.viewImage

查看图片（仅展示，支持 Live 图），不支持编辑删除。

### Options `object`

- `images` `array`
  - `url` `string` — 图片地址
  - `videoUrl` `string`（可选）— 视频地址（Live 图时传入）
- `index` `number` — 初始显示第几张（0-indexed）

```js
// 查看普通图片
mnb('media.viewImage', {
  images: [{ url: 'https://example.com/photo.jpg' }],
  index: 0,
}).catch(() => {})

// 查看 Live 图
mnb('media.viewImage', {
  images: [{ url: 'https://example.com/photo.heif', videoUrl: 'https://example.com/photo.mov' }],
  index: 0,
}).catch(() => {})
```

---

## media.viewImageEdit

查看本地图片，支持删除操作（**仅支持本地地址**）。

### Options `object`

传入 `media.selectMedia` 返回的单个媒体项（含 `fileUri`/`videoUrl` 等字段）。

### Returns `object`

- `action` `string` — 操作类型：`'delete'` / `'close'`

```js
const result = await mnb('media.viewImageEdit', selectedMedia)
if (result.action === 'delete') {
  // 用户删除了图片
}
```

---

## media.viewMediaEdit

查看图片/视频，支持编辑和删除（旧版接口，新项目推荐使用 `media.viewMedia`）。

### Options `object`

- `items` `array`
  - `id` `number` — 媒体 id
  - `type` `string` — `'Image'` / `'Video'`
  - `fileUri` / `url` / `livePhotoInfo`
- `isSupportDelete` `boolean`
- `isSupportEdit` `boolean`
- `idx` `number` — 初始显示第几个

```js
const result = await mnb('media.viewMediaEdit', {
  items: [{ id: 1, type: 'Image', fileUri: localUri }],
  isSupportDelete: true,
  isSupportEdit: true,
  idx: 0,
})
```

---

## media.saveImage

保存图片到系统相册。

### Options `object`

- `url` `string` — 图片资源
- `mode` `string` — 资源类型
  - `'imageUrl'` — 网络图片 URL
  - `'imageData'` — base64 数据（含 `data:image/jpeg;base64,` 前缀）
  - `'localPath'` — 本地文件路径

```js
// 保存网络图片
mnb('media.saveImage', {
  url: 'https://example.com/photo.jpg',
  mode: 'imageUrl',
}).catch(() => {})

// 保存 base64 图片
mnb('media.saveImage', {
  url: 'data:image/jpeg;base64,/9j/4AAQ...',
  mode: 'imageData',
}).catch(() => {})

// 保存本地图片
mnb('media.saveImage', {
  url: localFilePath,
  mode: 'localPath',
}).catch(() => {})
```

---

## media.selectFile

调起文件选择器，选择文件上传。

### Options `object`

- `type` `array` — 允许的文件 MIME 类型列表，如 `['application/pdf', 'image/*']`
- `maxCount` `number` — 最多选择数量
- `maxSize` `number` — 单个文件最大字节数
- `needUrl` `boolean`（可选）— 是否上传到 NOS，默认 `false`

### Returns `array`

每项包含：
- `name` `string` — 文件名
- `size` `number` — 文件大小（字节）
- `type` `string` — MIME 类型
- `uri` `string` — 本地路径
- `url` `string` — 网络地址（`needUrl=true` 时有值）

```js
const files = await mnb('media.selectFile', {
  type: ['application/pdf', 'application/msword', 'image/*'],
  maxCount: 1,
  maxSize: 1024 * 1024 * 20, // 20MB
  needUrl: false,
})
const file = files[0]
console.log(file.name, file.uri)
```

---

## media.viewFile

在客户端内预览文件。

### Options `object`

- `file` `object`
  - `name` `string` — 文件名
  - `size` `number` — 文件大小（字节）
  - `type` `string`（可选）— MIME 类型
  - `uri` `string`（可选）— 本地路径
  - `url` `string`（可选）— 网络地址
- `isSupportMore` `boolean`（可选）— 是否支持更多操作
- `isSupportDelete` `boolean`（可选）— 是否支持删除

```js
// 预览本地文件
mnb('media.viewFile', {
  file: { name: 'report.pdf', size: 102400, uri: localFilePath },
}).catch(() => {})

// 预览网络文件，支持删除
mnb('media.viewFile', {
  file: { name: 'report.pdf', size: 102400, url: 'https://example.com/report.pdf' },
  isSupportDelete: true,
}).catch(() => {})
```
