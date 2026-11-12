# toast 模块

原生提示组件：Toast 和 SnackBar。

---

## toast.show

调用原生 Toast 组件，在屏幕下方短暂显示一段文字提示。

### Options `object`

- `text` `string` — 要展示的文案，支持用 `\n` 换行
- `duration` `number`（可选）— 显示时长（秒），默认约 2 秒

```js
// 普通提示
mnb('toast.show', { text: '操作成功' }).catch(() => {})

// 换行提示
mnb('toast.show', { text: '上传成功\n请等待审核' }).catch(() => {})

// 自定义时长（10秒）
mnb('toast.show', { text: '较长的提示文案', duration: 10 }).catch(() => {})
```

---

## toast.showSnackBar

调用 SnackBar 组件，在屏幕底部显示带有操作按钮的提示条。

### Options `object`

- `id` `string` — SnackBar 唯一 id（用于 `toast.onSnackBarClick` 回调中识别）
- `icon` `string`（可选）— 图标 URL
- `title` `string` — 提示文案
- `buttonText` `string` — 按钮文字
- `showTime` `number` — 显示时长（毫秒）

```js
mnb('toast.showSnackBar', {
  id: 'share-success',
  icon: 'https://example.com/icon.png',
  title: '分享成功',
  buttonText: '查看',
  showTime: 3000,
}).catch(() => {})
```

---

## toast.onSnackBarClick（事件）

监听 SnackBar 按钮的点击事件。

### 参数 `object`

- `id` `string` — 对应 `showSnackBar` 时传入的 id

```js
useEffect(() => {
  const handler = ({ id }) => {
    if (id === 'share-success') {
      // 用户点击了"查看"按钮
      mnb('navigator.open', { path: 'nc/profile?id=xxx' }).catch(() => {})
    }
  }
  mnb.on('toast.onSnackBarClick', handler)
  return () => mnb.off('toast.onSnackBarClick', handler)
}, [])
```

---

## 使用建议

- 简单的成功/失败提示用 `toast.show`
- 需要用户操作（如"查看"、"撤销"）的提示用 `toast.showSnackBar`
- SnackBar 需要配合 `toast.onSnackBarClick` 使用，注意及时注销监听
