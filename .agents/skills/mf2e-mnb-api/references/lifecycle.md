# lifeCycle 模块

监听 RN 页面的生命周期状态变化（前台/后台切换）。

---

## lifeCycle.getState

主动获取当前生命周期状态。

```js
const state = await mnb('lifeCycle.getState')
console.log(state)
```

---

## lifeCycle.stateChange（事件）

页面生命周期状态发生变化时触发（如 App 切换到后台再切回前台）。

### 参数 `object`

- `state` `string` — 当前生命周期状态

```js
useEffect(() => {
  const handler = (res) => {
    console.log('生命周期变化:', res.state)
  }
  mnb.on('lifeCycle.stateChange', handler)
  return () => mnb.off('lifeCycle.stateChange', handler)
}, [])
```
