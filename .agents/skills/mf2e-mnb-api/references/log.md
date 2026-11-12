# log 模块

将日志写入客户端日志系统，便于线上问题排查（日志可通过客户端工具导出）。

**适用场景：** 需要在 RN 页面记录关键操作日志、错误信息，以便客户端工程师辅助排查问题时使用。日常开发调试用 `console.log` 即可，不需要调用 log 模块。

---

## log.info

记录普通信息日志。

### Options `object`

传入任意键值对，会被序列化到日志中。

```js
mnb('log.info', {
  action: 'page_view',
  pageId: 'rn-my-page',
}).then(() => {})
```

---

## log.debug

记录调试日志（Debug 级别）。

```js
mnb('log.debug', {
  step: 'load_data',
  result: 'success',
}).then(() => {})
```

---

## log.error

记录错误日志（Error 级别）。建议在重要操作的 catch 块中记录。

```js
mnb('log.error', {
  error: 'upload_failed',
  reason: err.message,
}).then(() => {})

// 实际使用示例
mnb('net.uploadFile', { files })
  .then(() => { /* 成功 */ })
  .catch((err) => {
    mnb('log.error', { module: 'upload', error: String(err) })
  })
```

---

## log.logMonitor

记录监控日志（用于性能或业务监控）。

```js
mnb('log.logMonitor', {
  event: 'share_success',
  platform: 'wechat',
}).then(() => {})
```
