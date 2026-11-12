---
name: mf2e-api-scaffold
description: 根据 OpenAPI YAML 或 Markdown 接口文档，自动生成类型定义（TS interface 或 JS JSDoc）、API 端点定义、Mock 数据和 Store 模块。当用户提供接口文档路径并要求「生成接口 / api配置 / 生成 mock / 接口脚手架」时触发。兼容 TypeScript 与纯 JavaScript 项目，生成前先探测项目现有约定。
license: MIT
metadata:
  version: 1.0.0
---
# API 脚手架指令

根据 OpenAPI YAML 或 Markdown 接口文档，自动生成一套 API 开发文件：类型定义 → API 端点 → Mock 数据 → Store 模块。

**本 skill 是通用版**：不写死任何项目特定的 host、路径前缀或封装方式。所有项目约定必须通过 Step 0 探测得出，探测不到就询问用户，**禁止凭示例臆测**。

> 本文件是**交互层**：负责收集输入、探测项目约定、问清决策点。入参确认后，**执行交给 [`references/execution.md`](references/execution.md)**（纯执行、无交互）。编排场景（如 `mf2e-dev-flow` 的 sub agent）可跳过本文件，直接按 `execution.md` 的入参契约执行。

---

## 触发条件

用户消息中出现「api配置 / 生成接口 / 生成 mock / 接口脚手架」等关键词并附带接口文档路径，或以自然语言提供接口文档路径并要求生成接口相关代码：

```
api配置 docs/xxx/api.yaml
api配置 docs/xxx/api.yaml /api/v1/rank        # 只生成指定接口
根据 docs/xxx/api.md 生成接口和 mock
```

---

## 输入解析

### 必需信息

| 字段 | 说明 |
|------|------|
| 接口文档路径 | OpenAPI YAML（`.yaml`/`.yml`）、OpenAPI JSON（`.json`）或 Markdown 接口文档（`.md`/`.markdown`） |

### 可选信息

| 字段 | 说明 | 默认值 |
|------|------|--------|
| 接口路径 | 只生成指定接口 | 文档内全部接口 |
| 模块名称 | 自定义 Store 模块名 | 按「命名推断规则」生成 |

缺少必需信息时直接向用户索取，不要猜路径。

---

## Step 0: 探测项目约定（必须先做，不可跳过）

生成任何文件之前，先读取项目现有代码确认以下约定。**每一项都要有依据，找不到依据就询问用户。**

| 探测项 | 探测方法 | 要确认的结论 |
|--------|----------|--------------|
| 语言 | 是否存在 `tsconfig.json`、`src` 下文件后缀是 `.ts/.tsx` 还是 `.js/.jsx` | TS 项目 → 生成 interface；JS 项目 → 生成 JSDoc typedef 或省略类型步骤（询问用户） |
| API 端点文件 | 查找 `src/store/api.*`、`src/api.*`、`src/config/api.*` 等 | 端点集中定义的位置；是否使用 `host`/前缀常量拼接（有则复用，禁止全路径硬拼）；命名风格（camelCase / 是否带业务前缀） |
| fetch 封装 | 查找 `src/store/fetch.*`、`src/utils/request.*` 等，**读实现** | ① 返回值是**解包后的 data 本体**还是**完整响应 `{code, message, data}`**——这决定 store 里怎么取数，取错层级运行时必崩；② 支持的约定参数及语义（如判空回调 `isEmpty`、错误提示开关 `errorToast`，有则生成的调用中沿用）；③ TS 项目中泛型参数的含义（是 data 本体类型还是完整响应类型）；④ 请求体是否自动 JSON 序列化（决定 POST 调用要不要手动 `JSON.stringify`） |
| Mock 服务 | 查找 `mock/` 目录、`mock/index.js`、`package.json` 中的 mock 脚本 | ① Mock 服务器挂载前缀（如 `apiMocker('/api/v1', './mock/api')`）→ **mock 目录 = 请求路径去掉挂载前缀**；② 单文件模板（`GET.js`/`POST.js` 用什么库，`connect-api-mocker` 还是其他）；③ 响应包装结构 |
| Store 模式 | 读取 `src/store/modules/` 或等价目录下 1~2 个现有模块 | 状态库（zustand/redux/其他）；hook 命名（`useXxxStore`）；方法命名（`fetchXxx`/`fetchData`）；是否双导出（hook + 独立方法）；是否用 immer 等 middleware |
| 类型目录 | `src/types/` 是否存在、有无 `index.ts` 索引 | 类型文件命名（`XxxType.ts`?）、是否需要更新索引导出 |

**探测结果必须先向用户简要汇报**（"我检测到：TS 项目，fetch 返回解包后的 data，mock 挂载前缀是 `/api/v1`……"），再开始生成。

### 除探测项外，还需问清以下决策点

这些是执行体的入参，探测时一并确认，不要留到执行中：

- **路径前缀**：接口文档前缀可能和项目现有代码不一致（如 `worklife-go` vs `worklife`），先 `grep` 项目代码找真实前缀线索，再向用户确认
- **字段名口径**：响应包装 `msg` vs `message`、分页 `list` vs `items`，以用户/后端确认为准
- **接口范围**：排除非本项目的接口（如管理后台、share 等），向用户确认
- **冲突处理策略**：文件已存在时「覆盖 / 合并 / 跳过」，可默认「跳过并记入待决策清单」
- **JS 类型方案**（仅 JS 项目）：`typedef` / `跳过`，可默认 `typedef`

---

## 执行

Step 0 探测完成、决策点问清后，**读 [`references/execution.md`](references/execution.md)**，把「已确认约定 + 决策点 + 接口文档路径」作为入参传入，按执行体生成。

执行体返回的出参（生成文件清单 / 验证结果 / 待决策清单）汇总后，用下方「输出汇总」模板汇报用户；若「待决策清单」非空，逐条转达用户、收集决策后回填修正。

---

## 输出汇总

```
✅ API 脚手架生成完成

项目约定（Step 0 探测）:
  - 语言: TypeScript
  - fetch 返回: 解包后的 data 本体
  - mock 挂载前缀: /api/v1 → mock/api/

从接口文档生成:
  - 接口数量: N 个
  - Schemas: M 个

生成文件:
1. src/types/RankType.ts - 类型定义（RankData, RankItem）
2. src/store/api.ts - 添加端点 rank, togglePublic
3. mock/api/rank/GET.js + res.json - Mock
4. src/store/modules/rank.ts - Store 模块

验证结果: tsc --noEmit 通过

使用方式:
import { useRankStore } from '@/store/modules/rank'
const { data, fetchRank } = useRankStore()
```

---

## 错误处理（输入缺失类）

| 情况 | 处理 |
|------|------|
| 缺少接口文档路径 | 直接向用户索取，不要猜路径 |
| 文档解析失败 | 提示用户检查 YAML / Markdown / JSON 示例格式 |
| 路径格式异常 | 询问用户确认接口路径 |
| Step 0 探测不到约定 | 询问用户，禁止用本文件示例硬套 |

> 执行中冲突类（类型文件已存在、端点同名、store/mock 已存在、接口前缀不在挂载点、Markdown 缺字段、验证失败）由执行体记入「待决策清单」返回，不在本层处理。
