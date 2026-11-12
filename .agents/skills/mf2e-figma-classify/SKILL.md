---
name: 'mf2e-figma-classify'
description: '把任意 Figma 页面的顶层画板按功能/页面归类，产出 manifest（页面分组 → node-id 列表），供后续「完成XX页设计稿还原」直接查 node-id。当用户提供 Figma 链接并要求「归类/梳理页面」「完成XX页还原」「列出页面和 node-id」时触发。'
---

# Figma 页面归类

## 概述

拿到任意 Figma 页面，把顶层画板按「功能/页面」归类，产出 `manifest.json/.md`。之后「还原首页」= 查 `screens["首页"]` 里的 node-id 列表，不用人工逐个贴。

**核心原则**：
- 🔴 **脚本零推断**：脚本只做纯功能（下载/解析/输出/渲染），不含任何硬编码规则（无同义词表、无尺寸阈值、无关键字列表、不去重）。
- 🔴 **感知与判断分离**：识图（vision）只返回「证据」，不下「归属结论」；归属由大模型交叉比对得出。
- 🔴 **没有永远可靠的信号**：frame 名字、识图结果、内部文字都可能错。判断靠「多路证据互相印证」，冲突标出人工复核，不预设「名字优先」或「识图优先」。
- 🟡 **PRD 词表匹配优先于识图**：有需求文档时，先抽「每页专属词表」拿 frame.texts 做确定性匹配，命中即归、不必识图。

## 触发条件

- 用户提供 Figma 链接 + 要求「归类/梳理页面」「完成XX页设计稿还原」「列出页面和 node-id」
- 用户提供 Figma 链接 + 需求文档（PRD），要求按需求归类页面

## 前置条件

- `FIGMA_TOKEN` 环境变量已设置（若校验失效——HTTP 403/401——**直接中止并提示用户更换 token，不要尝试降级替代方案**）
- 脚本在 `scripts/figma_classify.py`（与本 SKILL.md 同目录，随 skill 分发）。命令示例统一用 `.agents/skills/mf2e-figma-classify/` 这一项目级 skill 标准路径（相对项目根）
- macOS 自带 Python 需 certifi（脚本已内置 `_ssl_context()` 兜底）
- URL 的 `node-id` 必须指向**页面/画布**节点（其直接 children 才是顶层画板）；指向某个 frame 节点会把它的内部图层误当成画板。**注意：URL 里的 node-id 可能指向无关的空页**（如 history 页）——先用页面列表确认真实目标页（用 MCP 无 node-id 调 `get_metadata` 可拿顶层页面清单），不要默认 URL 的 node-id 就是画板所在页

## 🔴 文档身份校验（提取阶段第一步，必做）

Figma desktop MCP **只能读取桌面端当前活跃标签**的文档。走 MCP 路径提取前，必须先校验「MCP 当前可见的文档/页面」与「用户 URL 声明的文件」一致：

1. 无 node-id 调 `get_metadata` 拿当前活跃文档的顶层页面列表
2. 与用户提供的 URL（文件名 / 目标页面名）比对：一致 → 继续；**不一致（文档名/页面都对不上）→ 直接中断返回，请用户把 Figma 桌面端切到目标文档活跃标签后再执行**

> 曾发生：活跃标签是交互稿文档，45 屏全部从错误文档提取，整步归类作废重跑。校验成本一次调用，远低于返工成本。

执行期间也依赖活跃标签：若中途 `get_metadata`/`get_screenshot` 报「No node could be found」，说明标签被切走——中断返回，不要反复重试。

---

## 三阶段工作流

### ① 提取（脚本，确定性）

```bash
python3 .agents/skills/mf2e-figma-classify/scripts/figma_classify.py \
  --url "<figma-url>" \
  --prd <prd.md 路径，可选> \
  --shots shots/ --extract raw
```

产出：
- `raw.json` —— 每个顶层 frame 的 `id/name/type/size/texts(内部文字)/shot(截图路径)`；`--prd` 时额外带 `prd` 原文
- `shots/` —— 全部顶层 frame 截图（`{画板名}__{node-id}.png`）

### ② 分析（大模型）——先词表、再识图、后交叉比对

核心：把「看」和「判」拆开，能不用识图就不用识图——确定性信号优先，识图兜底。

**步骤 0｜PRD 词表匹配（确定性，优先）**：若提供 PRD，先抽出「每页专属词表」（如「任务详情页」= 我要报名/报名条件/参考资料，「任务进度页」= 进度条/可结算/预计结算金额……），拿每个 frame 的 `texts` 去匹配：

- `texts` 命中某页词表 → 直接归该页，不进识图；
- 未命中 / 命中多页 → 进入步骤 A。

**步骤 A｜识图取证据（只对步骤 0 没定的 frame，交给 vision subagent）**：

> ⚠️ 主模型不具备识图能力，必须把截图交给 `vision` subagent。**只让它输出证据，不让它下结论**——prompt 模板见下。

**步骤 B｜交叉比对定归属（主模型做）**：拿「识图证据 + frame 名字 + raw.json 内部文字 + PRD 词表」互相印证：

- 多路证据相互印证 → 归类；
- 证据与名字冲突、或证据缺失 → 标出「待人工复核」，不硬猜。

产出 `classify.json`：

```json
{
  "groups": {
    "页面甲": { "screens": ["1:84", "1:210"], "attachments": ["1:204"] },
    "页面乙": { "screens": ["..."] }
  },
  "unattributed": ["1:6663", "..."]
}
```

- `screens`：该页面的完整画板（同名多状态全保留，只分组不去重）
- `attachments`：散落的背景图/组件/素材
- `unattributed`：无法判归属的（通用组件、标注、演示板）

> 所有 frame 都要在 classify.json 里出现一次（screens/attachments/unattributed 之一），渲染时脚本会警告漏掉的 frame。

### ③ 渲染（脚本）

```bash
python3 .agents/skills/mf2e-figma-classify/scripts/figma_classify.py \
  --url "<figma-url>" \
  --classify classify.json --out manifest
```

> 有步骤① 的 `raw.json` 时，可离线渲染（无需 token/联网，且与提取时数据一致、不漂移）：
>
> ```bash
> python3 .agents/skills/mf2e-figma-classify/scripts/figma_classify.py \
>   --frames raw.json \
>   --classify classify.json --out manifest
> ```

产出 `manifest.json/.md`。之后「还原XX页」= 查 `screens["XX页"]`。

### 产物分类（交付物 vs 过程数据）

| 产物 | 分类 | 说明 |
|---|---|---|
| `manifest.json` / `manifest.md` | **交付物** | 后续页面还原查 node-id 的依据，保留 |
| `raw.json`、`classify.json`、`shots/` | 过程数据 | 提取/分析的中间产物，需求收尾时可清理；需要时可按 manifest 的 node-id 重新拉取 |

---

## 识图 prompt 模板（步骤 A）

对每张截图，只输出三行证据，**不要给「属于哪个页面」这类结论**：

```text
1. 文字：逐字 OCR 所有可见文字（原样抄，没有写「无」）
2. 元素：从上到下列出可见 UI 元素（按钮/标签/tab/导航/卡片/图标/输入框/进度条等）
3. 布局：一句话描述整体结构
```

## 通用原则（不是规则）

- **脚本零推断**：脚本不做归类判断，也不内置「相似词 / 尺寸阈值 / 关键字」规则。
- **感知与判断分离**：识图只返回可核对的证据（OCR 文字、元素、布局），归属结论由大模型交叉比对得出，不由识图直接下结论。
- **没有永远可靠的信号**：frame 名字、识图结果、内部文字都可能错。判断依据是「多路证据互相印证」；冲突就标出来人工复核，不预设「名字优先」或「识图优先」。
- **PRD 词表匹配优先于识图**：提供需求文档时，先抽「每页词表」拿 frame.texts 做确定性匹配，命中即归、不必识图；只有未命中/冲突的 frame 才进识图。页面集合也从「发现」变成「赋值」，更稳定。
