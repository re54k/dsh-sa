# 第 4 步：添加埋点

## 目标

根据埋点文档，为目标页面第 3 步实现的交互点添加埋点，用项目封装的 `@/utils/track` 方法上报。

## 输入与输出

- **输入**：埋点文档（目标页面部分）+ 第 3 步的交互点
- **输出**：埋点事件已挂到对应交互/展示/曝光节点的页面

## 跳过条件

**无埋点文档 → 直接跳过本步**，不阻塞流程，在最终交付报告里标注「埋点：跳过（无埋点文档）」。

## 执行流程

### 4.1 获取并筛选目标页面埋点事件

1. **读取埋点文档**（读取方式按第 0 步 0.1 的地址类型选择）
2. **按目标页面锚点筛选**（锚点来自第 0 步）：埋点文档通常覆盖整个项目，只取目标页面的埋点事件表
3. **列埋点事件清单**，向用户确认：

   ```
   📋 目标页面「<页面名>」埋点清单
   1. show_home_page     展示埋点   页面加载时
   2. click_share        点击埋点   点击「分享」按钮，参数 { type }
   3. exposure_banner    曝光埋点   横幅可见 20%
   ```

### 4.2 映射埋点事件 → track 方法

按埋点文档里每个事件的「触发时机」，选择 `@/utils/track` 的对应方法：

| 触发时机              | 方法                                  | 说明                          |
| --------------------- | ------------------------------------- | ----------------------------- |
| 主动上报 / 逻辑内发送 | `track(event, info?)`                 | 任意时机手动发送              |
| 点击（包装点击回调）  | `onPressTrack(fn, event, info?)`      | 包装 `Pressable` 的 `onPress` |
| 展示（组件挂载时）    | `useEffectTrack(event, info?)`        | 进入页面 / 组件出现           |
| 曝光（元素可见 ≥20%） | `useExposureTrack(ref, event, info?)` | 需要 `ref` 指向目标 `View`    |

### 4.3 添加埋点代码

读 `mf2e-falcon-rn` 的 `utils.md` 埋点章节确认签名后，按映射添加代码：

```tsx
import { track, onPressTrack, useEffectTrack, useExposureTrack } from '@/utils/track'

export const MyPage = () => {
  // 展示埋点
  useEffectTrack('show_home_page')

  const bannerRef = useRef<View | null>(null)
  // 曝光埋点
  useExposureTrack(bannerRef, 'exposure_banner', { bannerId: '123' })

  return (
    <>
      <Pressable onPress={onPressTrack(handleShare, 'click_share', { type: 'card' })}>
        <Text>分享</Text>
      </Pressable>
      <View ref={bannerRef}>...</View>
    </>
  )
}
```

**规范**：优先使用封装埋点，**不要直接调用 `mnb('track.sendEvent')`**。事件名与参数（kv）严格按埋点文档填写，不要自造。

### 4.4 校验

- 逐个交互点核对：埋点事件是否挂对位置、触发时机是否与文档一致、参数是否齐全
- 若第 3 步因交互稿缺失而跳过了交互，本步只能埋「展示 / 曝光」类事件，点击类事件留待交互补齐后补埋，报告中标注

### 4.5 本步出口条件

- [ ] 埋点清单逐项核对：事件挂对位置、触发时机与文档一致、参数齐全
- [ ] 输出埋点验收摘要（事件数 / 跳过原因）；本步跳过时，在最终交付报告中标注「埋点：跳过（无埋点文档）」

**前置：第 3 步验收通过后本步才可开工。**

## 常见陷阱

- **埋错时机**：展示用 `useEffectTrack`、点击用 `onPressTrack`、曝光用 `useExposureTrack`，别混用。
- **直接调 `mnb` 原生埋点**：必须走 `@/utils/track` 封装（会合并 `columnInfo` 频道参数）。
- **自造事件名**：事件 id 和参数以埋点文档为准，不要凭感觉命名。
- **全项目埋点一起做**：只做目标页面的，别的页面埋点不做。
