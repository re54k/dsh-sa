# 第 1 步：还原页面布局与样式

## 目标

把第 0 步筛选出的**目标页面设计稿**翻译成符合 Falcon RN 规范的布局与样式代码（视觉层），并按需通过模拟器截图校验形成还原闭环。

## 输入与输出

- **输入**：目标页面的设计稿（Figma URL / 节点 ID，或 Figma Desktop 当前选中节点）
- **输出**：组件结构（`View` / `Text` / `ThemeImage` / `LinearGradient` 层级，含弹窗组件）+ `createStyles` 样式 + 完成布局与样式的页面

> **【优先级规则：视觉以设计稿为准】** 当同一页面同时存在**交互稿**与**设计稿**时，本步的**视觉版式一律以设计稿为准**进行还原：布局、间距、颜色、字号、图标/图片、装饰元素等一律对照设计稿。交互稿只用于定义**交互流程、页面流转与数据字段**，不作为视觉版式的依据。**两者对同一元素冲突时，以设计稿为准**，不要按交互稿的简化版式（如"纯文字列表项"）实现而漏掉设计稿里的图标/装饰/特殊配色。拿不准时先对照设计稿 `get_screenshot` 的视觉基准图，再动手。

> 若 README 里的设计稿是 MasterGo / 其他平台链接（不是 Figma），先提示用户：本步依赖 Figma MCP，请提供 Figma 版本的设计稿或可用的 Figma 节点，否则本步无法精确还原。

## 编排的子技能

| 子技能                     | 在本步的职责                                                | 何时加载             |
| -------------------------- | ----------------------------------------------------------- | -------------------- |
| `mf2e-figma-implement`     | 获取设计上下文、视觉截图、下载资源并导出 PNG                | 1.1 获取设计数据     |
| `mf2e-falcon-rn`           | RN 编码规范、`createStyles`/`useStyles`、组件分层、禁用属性 | 1.2 读规范           |
| `mf2e-rn-library`          | 渐变、列表、模糊、描边等视觉/布局功能库的正确 import 与用法 | 1.3 涉及功能库时     |
| `mf2e-compare-screenshot`  | 模拟器实拍 vs Figma 截图，定位差异并修正                    | 1.4 截图校验（可选） |

## 执行流程

**严格按顺序执行，不可跳步。**

### 1.1 获取设计上下文（编排 `mf2e-figma-implement`）

加载 `mf2e-figma-implement`，按其「实现 Figma 设计稿」工作流的第 1~4 步（references/figma-implement.md）执行：

1. 从 Figma URL 解析 `fileKey` 和 `nodeId`（`node-id=1-2` → `nodeId="1:2"`；分支 URL 用 branchKey 当 fileKey）
2. 调用 `get_design_context` 获取设计规格（布局、尺寸、颜色、字体、组件结构）
   - 返回内容过大/截断时，先用 `get_metadata` 拿节点树，再对子节点逐个 `get_design_context`
3. 调用 `get_screenshot` 获取视觉基准图，**全程保留、随时对照**
4. 下载资源：图标/矢量素材用 `mf2e-figma-implement` 的「导出 PNG 资源」能力（references/export-png.md，内置脚本 `figma-export-png.js`）导出 PNG，不要引入新图标库，不要造占位图

### 1.2 读取 RN 规范（编排 `mf2e-falcon-rn`）

写代码前，先探测项目语言（`bash .agents/skills/mf2e-falcon-rn/scripts/detect-lang.sh`），再读对应版本的规范：

- `references/{ts|js}/base.md` — 编码规范、命名、禁止事项
- `references/{ts|js}/styling.md` — 样式系统（本步最相关，必读）
- `references/{ts|js}/components.md` — 组件分层与结构模板（设计稿含弹窗时，重点读 `BaseDialog` 章节）
- `references/{ts|js}/navigation.md` — 设计稿含弹窗时读弹窗注册与 `openDialog`/`closeDialog` 章节

**不读规范就写代码，必然写出 `gap`、`box-shadow` 等 RN 不支持的属性。**

### 1.3 编写布局与样式（本步核心增值）

> Figma `get_design_context` 返回的代码是「设计的表达」，不是最终代码风格。**禁止直接照搬其类名与样式写法**，必须逐条翻译成 Falcon RN 的 `createStyles` 样式。

#### 1.3.1 先定结构，再写样式

先根据设计稿确定组件树层级，再填样式。原则：

- 容器用 `View`，文本用 `Text`，图片用 `ThemeImage`（**禁止裸用 `Image`**），渐变用 `LinearGradient`（`react-native-linear-gradient`）
- 优先复用项目已有组件（`Base*` / `Common*`），不要重复造轮子
- 组件用函数组件 + Hooks，禁止 class 组件
- 设计稿里若包含弹窗，弹窗是**独立组件**（`BaseDialog`），与页面分开实现，不要堆在页面组件里
- 涉及渐变、列表（`FlashList`）、模糊、文字描边、Tab 切换等视觉/布局能力时，**先加载 `mf2e-rn-library` 确认包名、版本、import 路径**，不要凭记忆写

**确定好组件层级结构和命名后，先输出给用户确认，再开始写代码。** 确认内容：

- 组件树层级：页面根组件 → 各区块 → 子组件
- 每个组件的命名（PascalCase，遵循 `Base*`/`Common*`/`*Page`/`*Dialog` 约定）
- 组件文件放置位置（按 `mf2e-falcon-rn` 的分层规则）
- 弹窗组件（若有）的命名与位置

用户确认或调整后再进入 1.3.2 写样式，**不要跳过确认直接写代码**。

#### 1.3.2 翻译后逐条自查

把 Figma 代码翻译成 RN 样式属性后，**必须对照 1.3.3 的 RN 样式硬约束与文末「常见陷阱」逐条自查**——尤其是语义转换类和 RN 不支持项，字面映射按直觉翻译即可。

#### 1.3.3 遵循 RN 样式硬约束

- 用 `createStyles` / `useStyles`（来自 `@mf2e/react-native-theme-styles`），**禁止 `StyleSheet.create`**
- `createStyles` 定义在组件函数之后、文件底部；`useStyles` 在组件函数内顶部调用
- 根样式名与组件名一致（如 `MyPage`）
- **禁止行内样式 `style={{ }}`**，静态样式全部进 `createStyles`
- 颜色用十六进制，透明色用 8 位 hex（如 `#FFF48980`）
- 渐变：`colors` 写进 style，`start`/`end` 写在 JSX；禁止在 JSX 硬编码 `colors={[...]}`

#### 1.3.4 响应式与尺寸基准

以 **375px 设计稿宽度**为基准（Falcon 默认无缩放方案）：

- 宽度优先用 `flex: 1`、百分比（`width: '48.5%'`）或 `alignSelf: 'stretch'`，避免写死
- 铺满屏幕的元素显式 `width: '100%'`（背景图、头图等）
- 固定宽度仅用于图标、头像等小元素
- `padding` / `margin` / `fontSize` 直接用设计稿数值，不做换算
- 头图/背景图用 `width: '100%'` + `aspectRatio: 宽/高` 保持比例

#### 1.3.5 最小可渲染壳

为了让页面能在模拟器打开供校验，补上最小的壳：

- 页面注册（路由）——按 `mf2e-falcon-rn` 的 navigation 规范
- 静态/mock 数据占位——设计稿里的动态内容用固定占位数据渲染，**不接真实接口**（接口在第 2、3 步接入）

组件结构模板（TS 示例）：

```tsx
import { View, Text } from 'react-native'
import { createStyles, useStyles, ThemeImage } from '@mf2e/react-native-theme-styles'
import LinearGradient from 'react-native-linear-gradient'

export const MyPage = () => {
  const styles = useStyles(themeStyles)

  return (
    <View style={styles.MyPage}>
      <ThemeImage style={styles.bg} source={/* 背景图资源 */} />
      <LinearGradient
        style={styles.banner}
        colors={styles.banner.colors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      >
        <Text style={styles.title}>标题占位</Text>
      </LinearGradient>
    </View>
  )
}

const themeStyles = createStyles({
  MyPage: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  bg: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  banner: {
    colors: ['#FF2A0E', '#FF599C'],
    marginHorizontal: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
})
```

#### 1.3.6 弹窗组件（若设计稿包含弹窗）

设计稿里常同时包含页面和弹窗（弹窗通常在单独的画板/节点，或页面节点下的弹窗层）。**识别到弹窗就一并实现，不要漏掉**：

- 弹窗用 `BaseDialog` 实现，按设计稿选位置变体（底部弹出 / 居中 / 顶部等），读 `mf2e-falcon-rn` 的 `components.md`（BaseDialog 详解）与 `navigation.md`（弹窗注册、`openDialog`/`closeDialog`）
- 弹窗的布局样式同样遵循本步规则：`createStyles`/`useStyles` + 样式翻译自查 + 375 基准
- 弹窗内也是 `View`/`Text`/`ThemeImage` 层级，遮罩、圆角、关闭按钮等都要还原
- 弹窗也要在 1.3.5 的最小壳里注册（AppModal 渲染器），否则第 3 步交互时无法打开

### 1.4 截图校验（可选，编排 `mf2e-compare-screenshot`）

**询问时机：UI 代码写完之后（1.3 完成、1.5 收尾前），本步结束之前。** 先询问用户：

> 「页面布局已实现完毕，是否需要通过模拟器截图与设计稿进行对比验证修正样式？」

- 用户确认需要 → 加载 `mf2e-compare-screenshot` 执行下方校验流程；
- 用户明确不需要 → 跳过校验，并在本步验收摘要中标注「截图校验：用户跳过」；
- 用户未明确答复（空回复 / 含糊 / 未选择）→ 视为未确认，再次追问，**不得默认跳过**。

> 校验询问是第 1 步的收口动作，**绝不能在进入第 2 步之后才补**。

1. 用 `compare_with_design` 一步获取模拟器实拍 + 设备信息 + 对比检查清单：

   ```
   compare_with_design(
     page_name="<页面名>",
     figma_url="<目标页面 Figma URL>",
     focus_areas=["<用户关注的重点区域>"]
   )
   ```

2. 逐项对比差异，产出差异报告，修正组件样式
3. 修正后用 `screenshot_simulator()` 复验，与 Figma 基准截图二次对比
4. 仍有差异就回到对比-修正，**同一文件最多修正 2 轮**，2 轮后剩余差异记录并告知用户

> 校验的完整规则（长页面分段截图、坐标换算、平台判断、阴影差异等）以 `mf2e-compare-screenshot` 技能为准。

### 1.5 收尾清理

清理 Figma MCP 下载的 hash 命名临时文件（40 位 hex）：保留被代码引用的，删除未被引用的，确认无断引用。

## 本步出口条件

满足以下全部条件后，输出第 1 步验收摘要并**停等用户确认**，用户确认后才进入第 2 步：

- [ ] 布局与样式代码完成，最小可渲染壳可运行，静态占位数据渲染正常
- [ ] 截图校验已按用户意愿处理：完成对比修正（同一文件 ≤2 轮）或用户明确跳过（摘要中标注）
- [ ] 1.5 收尾清理完成，无未引用的 hash 临时文件
- [ ] 验收摘要已输出：页面结构、还原要点、截图校验结论、遗留差异清单

**未获得用户确认，禁止开始第 2 步。**

## 常见陷阱

- **以交互稿为准做视觉还原**：同一页面交互稿与设计稿并存时，必须**以设计稿为准**还原版式。若按交互稿的简化版式实现（如漏掉设计稿里的图标/装饰/特殊配色），会与用户预期不符。交互稿只用于交互流程与数据字段。
- **照搬 Figma 返回的类名/样式**：Figma 返回的代码不能直接当 RN 代码用。必须翻译成 `createStyles` 并对照 1.3.3 硬约束自查。
- **用 `gap` 排版**：RN 不支持，横向列表用 `marginRight`，纵向用 `marginTop`。这是最常见的错误。
- **裸用 `Image`**：必须 `ThemeImage`，否则主题切换失效。
- **用 `StyleSheet.create` 或行内样式**：必须 `createStyles` / `useStyles`。
- **渐变硬编码 `colors` 在 JSX**：`colors` 必须写进 style，JSX 里用 `styles.xxx.colors` 引用。
- **阴影只写一套**：iOS 用 `shadowXxx`，Android 用 `elevation`，两端都要覆盖。
- **写死宽度**：全宽容器应 `width: '100%'` 或 `flex: 1`，只有图标/头像才写死。
- **未确认库就 import**：涉及渐变/列表/模糊/描边等三方库，先查 `mf2e-rn-library` 确认已安装与正确 import，否则白屏。
- **把截图校验询问拖到第 1 步之后**：1.4 是可选环节，但询问必须发生在第 1 步 UI 代码写完之后、本步结束之前（1.5 收尾前）；用户未明确答复须追问，不得默认跳过，也不得拖到第 2 步之后才补。
- **下载资源后不清理**：Figma MCP 的 hash 临时文件会污染仓库，1.5 必须清理。
