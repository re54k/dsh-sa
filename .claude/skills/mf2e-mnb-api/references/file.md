# file 模块

客户端文件系统操作。所有路径均为客户端沙箱内的本地路径。

**获取应用路径：**

```js
import { appPath } from '@/utils/inject'
// appPath.file — 应用文件目录（持久存储）
// appPath.cache — 应用缓存目录（可被系统清理）
```

---

## file.exist

检查文件或目录是否存在。

### Options `object`

- `path` `string` — 本地路径

### Returns `boolean`

```js
const exists = await mnb('file.exist', { path: `${appPath.file}/rn/test.txt` })
```

---

## file.write

写入文件内容（覆盖写入）。如果目录不存在会自动创建。

### Options `object`

- `path` `string` — 本地路径
- `data` `string` — 文件内容

```js
await mnb('file.write', {
  path: `${appPath.file}/rn/test.txt`,
  data: '文件内容',
})
```

---

## file.read

读取文件内容。

### Options `object`

- `path` `string` — 本地路径

### Returns `string`

文件内容字符串。

```js
const content = await mnb('file.read', { path: `${appPath.file}/rn/test.txt` })
```

---

## file.append

向文件末尾追加内容（文件不存在时自动创建）。

### Options `object`

- `path` `string` — 本地路径
- `data` `string` — 追加的内容

```js
await mnb('file.append', {
  path: `${appPath.file}/rn/test.txt`,
  data: '追加的内容',
})
```

---

## file.delete

删除文件或目录。

### Options `object`

- `path` `string` — 本地路径

```js
await mnb('file.delete', { path: `${appPath.file}/rn/test.txt` })
```

---

## file.rename

重命名或移动文件/目录。

### Options `object`

- `path` `string` — 原路径
- `destPath` `string` — 目标路径

```js
await mnb('file.rename', {
  path: `${appPath.file}/rn/test.txt`,
  destPath: `${appPath.file}/rn/renamed.txt`,
})
```

---

## file.md5

计算文件的 MD5 值。

### Options `object`

- `path` `string` — 本地路径

### Returns `string`

文件的 MD5 哈希值。

```js
const md5 = await mnb('file.md5', { path: `${appPath.file}/rn/test.txt` })
```

---

## file.zip

压缩文件或目录为 zip 包。

### Options `object`

- `path` `string` — 要压缩的文件/目录路径
- `destPath` `string` — 压缩包输出路径（需以 `.zip` 结尾）

```js
await mnb('file.zip', {
  path: `${appPath.file}/rn`,
  destPath: `${appPath.file}/rn/output.zip`,
})
```

---

## file.unzip

解压 zip 文件。

### Options `object`

- `path` `string` — zip 文件路径
- `destPath` `string` — 解压目标目录

```js
await mnb('file.unzip', {
  path: `${appPath.file}/rn/output.zip`,
  destPath: `${appPath.file}/rn/unzipped`,
})
```

---

## file.uri

将沙箱内路径转换为可访问的 URI（通常用于上传）。

### Options `object`

- `path` `string` — 本地沙箱路径

### Returns `string`

可用于上传（`net.uploadFile`）的 URI 字符串。

```js
const uri = await mnb('file.uri', { path: filePath })
// 然后用于上传
await mnb('net.uploadFile', {
  files: [{ uri, id: 'myFile' }],
  bucket: 'worklife-file',
})
```

---

## file.save

将沙箱内文件保存到系统相册或下载目录（需要存储权限）。

> 注意：调用前需先通过 `app.requestPermission` 请求 `Storage` 权限。

### Options `object`

- `uri` `string` — 本地沙箱路径

```js
const { isSuccess } = await mnb('app.requestPermission', { permission: 'Storage' })
if (isSuccess) {
  await mnb('file.save', { uri: filePath })
}
```
