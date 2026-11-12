# API 脚手架 · 执行体

> 本文件是 `mf2e-api-scaffold` 的**纯执行部分**（无交互）。由交互层（SKILL.md）或编排层（如 `mf2e-dev-flow` 的 sub agent）在**确认入参后**调用。
>
> 调用方先读本文件，按「入参契约」备齐入参，再按「执行步骤」生成，最后按「出参契约」返回结果。

## 入参契约

调用方必须在下表入参齐备后执行；缺失项**不得臆测、不得中途反问**，记入「待决策清单」随出参返回。

| 入参 | 说明 | 来源 |
|------|------|------|
| 接口文档路径 | OpenAPI YAML（`.yaml`/`.yml`）、JSON（`.json`）或 Markdown（`.md`） | 必需 |
| 语言 | `ts` / `js` | Step 0 探测 |
| fetch 封装语义 | ① 返回 data 本体 or 完整响应 `{code,message,data}`；② 约定参数语义（`isEmpty`/`errorToast` 等）；③ TS 泛型含义；④ 是否自动 JSON 序列化 | Step 0 探测 |
| mock 挂载前缀 | 如 `/api/v1` → `./mock/api` | Step 0 探测 |
| mock 单文件模板 | 复用现有 mock 写法（库、delay 等） | Step 0 探测 |
| store 模式 | 状态库 / hook 命名 / 方法命名 / 是否双导出 | Step 0 探测 |
| 类型目录 | `src/types/` + 索引文件 | Step 0 探测 |
| 路径前缀 | 接口真实前缀（如 `/worklife/api/v1`） | 决策点 |
| 字段名口径 | 响应包装 `msg`/`message`、分页 `list`/`items` | 决策点 |
| 接口范围 | 排除的非本项目接口（管理后台、share 等） | 决策点 |
| 冲突处理策略 | 文件已存在时：覆盖 / 合并 / 跳过 | 决策点 |
| JS 类型方案 | `typedef` / `跳过`（仅 JS 项目） | 决策点 |
| 输出路径 | 项目根目录 | 默认 cwd |

## 执行规则

- **不硬猜、不问用户**：一切原本要问用户的点（文档缺字段、文件冲突、验证失败），记入「待决策清单」随出参返回，由上层转达用户后回填。
- 入参已给出冲突处理策略时，直接按策略执行，不必记清单。

---

## 执行步骤

### Step 1: 读取并解析接口文档

1. **按扩展名解析**：
  - `.yaml` / `.yml` / `.json`：读取 `paths`、`tags` 及 Schema 定义——OpenAPI 3.x 在 `components/schemas`，Swagger 2.0 在 `definitions`；`#/components/parameters`、`#/components/responses`、`#/components/requestBodies` 等复用引用也要递归解析
  - `.md` / `.markdown`：从标题、路径行（`GET /path`、`接口地址`、`请求路径`）、参数表、响应字段表、JSON 代码块中提取

2. **Markdown 解析要求**：
  - 从标题、接口名称或路径推断接口名
  - 字段表与 JSON 示例冲突时，**以字段表为准**，并在结果中说明这个假设
  - 缺少 HTTP method、缺少响应示例或字段类型时，**记入「待决策清单」，不要凭空补全**

3. **每个接口提取**：method、路径、请求参数（query/body）、响应结构、字段描述、示例响应。

---

### Step 2: 命名推断

**通用规则**：

- **operationId 优先**：OpenAPI 文档提供 `operationId` 时，优先作为接口名与方法名来源（比路径推断更稳定、语义更准）
- **apiName**：路径末段 kebab 转 camelCase；若项目 api 文件现有条目带业务前缀（如 `beeActivityList`），沿用该风格
- **类型名**：资源名 PascalCase，后缀按用途区分——`XxxData`（data 本体为对象时的主类型）、`XxxItem`（列表项 / 嵌套元素）、`XxxParams`（请求参数，query 与 body 需分开时为 `XxxQueryParams` / `XxxBodyParams`）。**只定义 data 本体**，不加 `Response` 包装层（`{code,message,data}` 由项目 fetch 封装统一处理）
- **mock 目录**：请求路径**去掉 Step 0 探测到的挂载前缀**；kebab 保留；含路径参数（如 `/rank/{id}`）时按 mock 库约定命名目录（connect-api-mocker 支持 `{id}` 形式的目录名）
- **store**：文件名 camelCase；hook / 方法名遵循现有模块风格（通常是 `useXxxStore` + `fetchXxx`）

**路径转换**：路径中的 `-` 在文件/目录名中保留，在变量名中转为驼峰（`/toggle-public` → 目录 `toggle-public/` → 变量 `togglePublic`）。

**示例**（假设挂载前缀 `/api/v1`，文档含两个接口）：

| 接口 | apiName | 生成类型 | mock 目录 | store |
|------|---------|----------|-----------|-------|
| `GET /api/v1/rank` | `rank` | `RankData`、`RankItem` | `rank/GET.js` | `rank.ts` → `useRankStore` / `fetchRank` |
| `POST /api/v1/rank/toggle-public` | `togglePublic` | `TogglePublicParams` | `rank/toggle-public/POST.js` | 并入 `rank.ts` 增加动作方法 |

---

### Step 3: 生成类型定义

#### TS 项目

**文件**：`src/types/{TypeName}Type.ts`（以 Step 0 探测到的目录与命名为准）

规则：
- **只生成 data 本体的 interface**，不把 `{code, message, data}` 包装层写进业务类型
- data 顶层本身就是数组时不包主类型，直接使用 `XxxItem[]`
- **store 私有的简单包装结构允许内联**：仅单个 store 使用的分页包装（如 `{ items, hasMore }`）可直接定义在 store 文件顶部（如命名 `ResponseData`），不必进 types 目录；跨模块复用或结构复杂的类型必须放 types 目录
- `description` 转为中文注释；`enum` 在注释中列出所有值（如 `/** 状态：1-正常，2-异常 */`）
- 嵌套对象拆分为独立 interface；`$ref` 递归解析；`allOf` 合并属性；`oneOf` 生成联合类型
- **nullable 处理**：`nullable: true`、JSON 示例中字段值为 `null`、或字段表标注可空 → 类型加 `| null`（示例 `"myRank": null` 就必须生成 `myRank: RankItem | null`，不是 `RankItem`）
- `required` 之外的字段加 `?`
- 有请求参数时生成 `XxxParams` 类型；query 与 body 需分开时为 `XxxQueryParams` / `XxxBodyParams`
- 在类型索引文件（如 `src/types/index.ts`）中添加导出

```tsx
// src/types/RankType.ts
export interface RankData {
  items: RankItem[]
  /** 我的排名；未上榜或未登录时为 null */
  myRank: RankItem | null
}

export interface RankItem {
  /** 排名（1-based）；-1 表示未上榜 */
  rank: number
  /** 公开模式：真实 id；匿名模式：MD5 */
  userId: string
  /** 累计收益（单位：分） */
  totalReward: number
}
```

#### JS 项目

按入参「JS 类型方案」执行（默认 `typedef`）：

**方案 1：typedef** — 生成 JSDoc typedef 文件，store 中用 `@type` 引用：

```js
// src/types/RankType.js
/**
 * @typedef {Object} RankItem
 * @property {number} rank 排名（1-based）；-1 表示未上榜
 * @property {string} userId 公开模式：真实 id；匿名模式：MD5
 * @property {number} totalReward 累计收益（单位：分）
 */

/**
 * @typedef {Object} RankData
 * @property {RankItem[]} items
 * @property {RankItem|null} myRank 我的排名；未上榜或未登录时为 null
 */
```

**方案 2：跳过** — 不生成类型文件，仅保留字段中文注释于 store 模块头部。

#### 类型映射表

| OpenAPI Type | TypeScript | JSDoc |
|--------------|-----------|-------|
| `string` | `string` | `string` |
| `string` + `format: date-time/uuid` 等 | `string`（注释注明格式） | `string`（注释注明格式） |
| `string` + `format: binary`（文件下载） | `Blob` / `ArrayBuffer`，以 fetch 封装实际返回为准 | 同左 |
| `integer` / `number` | `number` | `number` |
| `boolean` | `boolean` | `boolean` |
| `array` | `T[]` | `T[]` |
| `object` | 独立 `interface` | 独立 `@typedef` |
| `nullable: true` | `T \| null` | `T\|null` |
| `enum` | 原类型 + 注释列值 | 原类型 + 注释列值 |

> 文件上传（`multipart/form-data`）接口的请求构造以 Step 0 探测到的 fetch 封装能力为准（如 RN 项目常走原生桥上传），不要凭空拼 FormData。

---

### Step 4: 添加 API 端点定义

在 Step 0 探测到的端点文件中追加：

- **复用现有的 host / 前缀常量**（如已有 ``const beeHost = `${host}/api/v1` ``，新接口写 `` `${beeHost}/rank` ``），禁止每条全路径硬拼
- 按业务分组加注释；命名遵循 Step 2 规则
- 已有同名条目 → 按入参「冲突处理策略」执行；无策略则记入「待决策清单」

---

### Step 5: 生成 Mock 数据

**目录**：`{mock根目录}/{请求路径去掉挂载前缀}/{METHOD}.js` + `res.json`

- 挂载前缀以 Step 0 探测结果为准。例：挂载 `apiMocker('/api/v1', './mock/api')`，接口 `/api/v1/rank` → `mock/api/rank/GET.js`
- **新接口前缀不在现有挂载点内** → 记入「待决策清单」（需上层决定是否修改 mock 服务入口添加挂载）
- `{METHOD}.js` 模板**复用项目现有 mock 文件的写法**（库、delay 等保持一致）；没有现存模板可参考时，默认：

```javascript
const path = require('path')
const { delay, file } = require('connect-api-mocker/helpers')

module.exports = [delay(300), file(path.join(__dirname, 'res.json'))]
```

- `res.json` 数据来源：OpenAPI `examples` / Markdown 示例响应 / 响应 JSON 代码块
  - 多个 example 时优先选 `normal`、`success` 或第一个
  - 必须符合项目响应包装结构（默认 `{ code, message, data }`，以探测为准）
  - 数据应覆盖不同枚举状态值，使用真实有意义的内容
- mock 目录已存在同接口 → 按入参「冲突处理策略」执行；无策略则记入「待决策清单」

---

### Step 6: 生成 Store 模块

**不同项目的 store 写法差异较大，本步骤不提供示例代码**（示例反而会成为干扰项，模型会照抄示例而不是项目规范）。生成前必读两处，以真实规范和现有代码为准：

1. `.agents/skills/mf2e-falcon-rn/` 的 store 规范文档（`references/ts/store.md` / `references/js/store.md`，先按该 skill 的探测规则选 TS/JS 版本）——状态结构、命名、双导出等约定
2. 项目 store 目录下**已有的模块代码**（如 `src/store/modules/`，以 Step 0 探测结果为准）——新模块的风格、写法与现有模块保持一致

**以 Step 0 探测到的 fetch 封装语义为准**：fetch 返回解包后的 data 本体还是完整响应，决定取数层级；请求体是否自动 JSON 序列化，决定要不要手动 `JSON.stringify`。

**模式选择**（按数据形状，与请求方法正交）：
- `data` 是普通对象 → 普通数据模块
- `data` 含数组字段且有分页 → 列表数据模块
- 纯动作无状态（如提交表单）→ 作为 store 方法写入模块内，与其他数据方法一致
- POST 也可能返回需缓存的数据（如更新资料）→ 按数据形状处理，不要一刀切
- 若现有模块管理 loading / error / dataState 等状态，生成时保留同款模式，不要只存数据

其他要求：
- 分页字段名与页大小以接口文档或现有模块惯例为准；若项目已有统一分页方案（工厂函数、hook），优先复用
- 纯动作（如提交表单、删除、踢出）作为 store 方法写入模块内；若动作会改变 store 已有状态（如踢出后从列表移除），在方法内 `set` 同步更新
- JS 项目：文件后缀 `.js`，去掉类型标注与泛型；若 Step 3 生成了 JSDoc typedef，用 `@type` 引用标注状态形状，否则仅保留中文注释
- 现有模块若双导出（hook + 独立方法）或使用 immer 等 middleware，新模块保持同款

---

### Step 7: 验证

生成完成后执行可行的验证：

1. **TS 项目**：运行项目已有的类型检查命令（如 `tsc --noEmit` 或 package.json 中的 `typecheck` 脚本），确认新增类型无错误
2. **启动接口服务**：通常对应命令 `npm run dev`（以 `package.json` scripts 为准，可能是 `dev` / `start` / `mock` 等）
  - 先检查服务是否已在运行（端口占用 / 已有进程）：**已在运行则先重启**，确保加载新生成的 mock 文件
  - 用后台方式启动，等待服务就绪后再验证
  - 启动后对新生成的接口发一次请求（`curl`），逐项核对：
    - **包装结构**：符合 `{ code, message, data }`（以 Step 0 探测为准）
    - **字段完整性**：响应 `data` 的字段与接口文档/生成的类型定义一一对应，不缺字段、不多字段
    - **字段类型**：每个字段的实际值类型与类型定义一致（`string`/`number`/`boolean`/数组/对象/`null`），重点检查可空字段（`| null`）和枚举值是否落在注释声明的范围内
    - 发现不一致时，修正 `res.json` 或类型定义后重新验证，直到完全一致
3. 验证无法执行时（如无 dev 脚本、端口被占且无法释放），记入「待决策清单」，说明原因及手动验证方式

---

## 出参契约

最终以结构化结果返回给上层（不要只返回「做完了」）：

| 出参 | 说明 |
|------|------|
| 生成文件清单 | 每个文件的路径 + 一句话说明 |
| 验证结果 | `tsc --noEmit` 结果 + `curl` 核对结论 |
| 待决策清单 | 执行中遇到的、无法自行决定的点（文档缺字段 / 文件冲突 / 验证失败），每条一句话 |

---

## 注意事项

1. **响应包装识别**：如果接口文档使用统一响应包装（如 `BaseResponse`），自动识别并只提取 `data` 字段建模；包装层不进业务类型。
2. **安全性标注**：接口标记了 `security` 时，在类型或 store 注释中说明需要登录态。
3. **批量生成**：不指定接口路径时生成文档内全部接口，输出汇总逐一列出。
4. **示例免疫**：本文件中的 `rank`、`api/v1` 等仅为示意，**绝不带入生成结果**；一切以前缀常量、挂载点、现有文件风格的探测结果为准。
