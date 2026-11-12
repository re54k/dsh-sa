#!/usr/bin/env node
/**
 * jira.js — mf2e-jira-fix skill 核心脚本
 *
 * 适配网易自建 Jira（NEWSH5 项目），四个子命令：
 *
 *   node jira.js list  [--keyword <词>] [--limit N] [--project KEY] [--status A,B] [--type A,B]
 *       搜索任务列表（默认：NEWSH5 项目 + bug 类 + 待办状态(开始/重新打开) + 前 10 条）
 *
 *   node jira.js get <ISSUE_KEY> [--no-attachments]
 *       拉取单个任务详情（标题/描述/评论/附件等），附件下载到持久目录
 *
 *   node jira.js finish <ISSUE_KEY> --cause "<bug原因>"
 *       bug 修复完成后调用：把状态流转到"开发中"，并填写 bug原因 字段
 *       （customfield_11109）；流转面板不带该字段时走单独字段更新，
 *       两者都失败则兜底加评论，保证原因一定留痕。
 *       任务已在目标状态时跳过流转、只补写原因（幂等，可安全重跑）。
 *       可加 --dry-run 只查看将执行的流转，不做任何写操作。
 *
 *   node jira.js comment <ISSUE_KEY> --text "<评论内容>"
 *       往任务上加评论。用在修复过程需要留痕但又不属于"修完回写"的时刻：
 *       复现不了需要补充信息、方案说明、测试打回后的解释、旧 bug原因 的留痕等。
 *
 * 依赖: Node.js 18+（内置 fetch，零 npm 依赖），Windows / macOS / Linux 通用
 * 配置: 读取 skill 目录下 config.conf（chmod 600），环境变量优先
 *
 * 退出码: 0 成功（stdout 输出 JSON）
 *         1 参数错误
 *         2 配置缺失 / 不完整
 *         3 登录失败
 *         4 请求失败（网络 / 不存在 / 无权限 / 字段不可写）
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const CONF_FILE = path.join(SCRIPT_DIR, '..', 'config.conf');

// ---------- 退出码约定 ----------
const EXIT = { OK: 0, ARGS: 1, CONFIG: 2, LOGIN: 3, FETCH: 4 };
function fail(code, msg) { console.error(msg); process.exit(code); }

// ---------- 参数解析 ----------
const argv = process.argv.slice(2);
const cmd = argv[0];
const rest = argv.slice(1);

function parseArgs(tokens, flags) {
  const out = { _: [] };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.startsWith('--')) {
      const name = t.slice(2);
      if (flags.bool.includes(name)) { out[name] = true; continue; }
      const val = tokens[++i];
      if (val === undefined) fail(EXIT.ARGS, `ERROR_BAD_ARGS: --${name} 缺少取值。`);
      out[name] = val;
    } else {
      out._.push(t);
    }
  }
  return out;
}

const LIST_FLAGS = { bool: [] };
const GET_FLAGS = { bool: ['no-attachments'] };
const FINISH_FLAGS = { bool: ['dry-run'] };
const COMMENT_FLAGS = { bool: [] };

// ---------- 读取配置 ----------
let conf = {};
if (fs.existsSync(CONF_FILE)) {
  for (const rawLine of fs.readFileSync(CONF_FILE, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    conf[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
}
const env = (k, d) => process.env[k] !== undefined ? process.env[k] : d;

// 连接与凭据：从 config.conf / 环境变量读取
const CFG = {
  jira_base: env('JIRA_FIX_BASE', conf['jira_base'] || ''),
  username: env('JIRA_FIX_USERNAME', conf['username'] || ''),
  password: env('JIRA_FIX_PASSWORD', conf['password'] || ''),
  user_agent: env('JIRA_FIX_USER_AGENT', conf['user_agent'] || 'Mozilla/5.0 (mf2e-jira-fix skill)'),
  attach_dir: env('JIRA_FIX_ATTACH_DIR', ''),
};

// 名词对齐（本团队 Jira 实测结果，直接写死在 skill 里，不从配置读取）：
//   口语"待办"   = 状态"开始" + "重新打开"
//   口语"处理中" = 状态"开发中"
//   bug 类型 = 改进 / 故障 / 线上问题；需求 = 故事 / 任务
//   "bug原因"字段 = customfield_11109
const ALIGN = {
  default_project: 'NEWSH5',           // 默认项目；用户指定其他项目时用 --project 覆盖
  bug_types: ['改进', '故障', '线上问题'],
  todo_statuses: ['开始', '重新打开'],
  doing_status: '开发中',               // finish 默认流转到的目标状态
  cause_field: 'customfield_11109',     // bug原因
};

if (!CFG.jira_base || !CFG.username || !CFG.password) {
  fail(EXIT.CONFIG, 'ERROR_CONFIG_INCOMPLETE:' + CONF_FILE +
    '\n需要 jira_base / username / password 三个字段（或 JIRA_FIX_BASE / JIRA_FIX_USERNAME / JIRA_FIX_PASSWORD 环境变量），请检查。');
}
const BASE = CFG.jira_base.replace(/\/+$/, '');
if (!/^https?:\/\/[A-Za-z0-9._~:/-]+$/.test(BASE)) {
  fail(EXIT.CONFIG, `ERROR_BAD_BASE: jira_base 不是合法的 http(s) 地址：'${CFG.jira_base}'。`);
}

// ---------- HTTP 基础设施（表单登录 + cookie jar，与登录态复用） ----------
const jar = new Map();
function storeCookies(resp) {
  const setCookies = resp.headers.getSetCookie
    ? resp.headers.getSetCookie()
    : (resp.headers.get('set-cookie') ? [resp.headers.get('set-cookie')] : []);
  for (const line of setCookies) {
    const pair = line.split(';')[0];
    const eq = pair.indexOf('=');
    if (eq < 1) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    const expired = /max-age\s*=\s*0/i.test(line) || /expires\s*=\s*[^;]*19[67]\d/i.test(line);
    if (expired || value === '') jar.delete(name);
    else jar.set(name, value);
  }
}
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

async function request(url, opts = {}, { maxRedirects = 5 } = {}) {
  let cur = url;
  for (let i = 0; ; i++) {
    const resp = await fetch(cur, {
      ...opts,
      redirect: 'manual',
      headers: { 'User-Agent': CFG.user_agent, ...(opts.headers || {}), Cookie: cookieHeader() },
      signal: AbortSignal.timeout(20000),
    });
    storeCookies(resp);
    const loc = resp.headers.get('location');
    if (resp.status >= 300 && resp.status < 400 && loc && i < maxRedirects) {
      cur = new URL(loc, cur).toString();
      opts = { ...opts, method: 'GET' };
      delete opts.body;
      continue;
    }
    return resp;
  }
}

async function fetchOrDie(url, opts, step) {
  try {
    return await request(url, opts);
  } catch (e) {
    const reason = e && e.name === 'TimeoutError' ? '请求超时'
      : (e && e.cause && e.cause.code) ? `网络错误(${e.cause.code})` : '网络不通';
    fail(EXIT.FETCH, `ERROR_FETCH_FAILED: 无法连接 ${BASE} —— ${reason}（步骤: ${step}）。`);
  }
}

const KEY_RE = /^[A-Za-z][A-Za-z0-9]*-\d+$/; // 防 URL/路径注入，任务 ID 必须形如 PROJ-123

async function login() {
  await fetchOrDie(`${BASE}/login.jsp`, { method: 'GET' }, '获取登录页');
  const loginResp = await fetchOrDie(`${BASE}/login.jsp`, {
    method: 'POST',
    headers: { 'Referer': `${BASE}/login.jsp`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      os_username: CFG.username,
      os_password: CFG.password,
      os_destination: '/',
      user_role: '',
      login: '登录',
    }).toString(),
  }, '提交登录表单');
  const loginText = await loginResp.text();
  if (/permissionViolation=true|登录失败|用户名或密码错误|Sorry, your username/i.test(loginText)) {
    fail(EXIT.LOGIN, 'ERROR_LOGIN_FAILED: 登录失败，请检查 config.conf 中的 username / password。');
  }
}

async function api(pathAndQuery, opts, step) {
  const r = await fetchOrDie(`${BASE}/rest/api/2/${pathAndQuery}`, opts || { method: 'GET' }, step || 'REST API');
  const text = await r.text();
  if (r.status === 401 || r.status === 403) {
    fail(EXIT.FETCH, `ERROR_FETCH_FAILED: REST API 返回 HTTP ${r.status}（${step || pathAndQuery}）—— 可能无权限，或登录未生效（先确认凭据）。\n${text.slice(0, 400)}`);
  }
  if (r.status < 200 || r.status >= 300) {
    fail(EXIT.FETCH, `ERROR_FETCH_FAILED: REST API 返回 HTTP ${r.status}（${step || pathAndQuery}）。\n${text.slice(0, 400)}`);
  }
  try { return JSON.parse(text); }
  catch { fail(EXIT.FETCH, `ERROR_FETCH_FAILED: REST API 返回非 JSON（${step || pathAndQuery}）。`); }
}

// ---------- 名词对齐：口语 → Jira 实际值 ----------
// JQL 字符串里的引号转义，防止值中引号破坏查询结构
const jqlQuote = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const splitList = (s) => (s || '').split(',').map(x => x.trim()).filter(Boolean);

// JQL 里状态尽量按 ID 检索：实测本 Jira 的 JQL 不接受部分状态名（如"重新打开"
// 会报 400 "status域中没有该值"，虽然 /status 定义里确实存在这个名字——疑似
// 同名状态导致的名字索引歧义）。运行时从 /rest/api/2/status 解析 名字→ID，
// 解析不到的（极少见）保留原名。配置里始终写人话（状态名），ID 只在脚本内部出现。
async function statusNameToIds(names) {
  const statuses = await api('status', { method: 'GET' }, '拉取状态定义');
  const byName = new Map(statuses.map(s => [s.name, s.id]));
  return names.map(n => (byName.has(n) ? byName.get(n) : n));
}

// ---------- 子命令: list ----------
async function cmdList(args) {
  const keyword = args['keyword'] || '';
  const limit = Math.max(1, Math.min(50, parseInt(args['limit'] || '10', 10) || 10));
  const project = args['project'] || ALIGN.default_project;
  const statuses = args['status'] ? splitList(args['status']) : ALIGN.todo_statuses;
  const types = args['type'] ? splitList(args['type']) : ALIGN.bug_types;

  // 经办人：默认只列"分给当前登录用户"的任务（currentUser() 由 Jira 按登录态解析，
  // 比写死用户名更稳）；--assignee all 表示不限；--assignee <姓名> 指定某人。
  const assigneeRaw = args['assignee'];
  let assignee = null; // null = 不加过滤（对应 all）
  if (assigneeRaw === undefined) assignee = 'currentUser()';
  else if (assigneeRaw.toLowerCase() !== 'all') assignee = assigneeRaw;

  const parts = [];
  if (project) parts.push(`project = "${jqlQuote(project)}"`);
  if (types.length) parts.push(`issuetype in (${types.map(t => `"${jqlQuote(t)}"`).join(',')})`);
  const statusIds = await statusNameToIds(statuses);
  if (statusIds.length) parts.push(`status in (${statusIds.map(t => `"${jqlQuote(String(t))}"`).join(',')})`);
  if (assignee === 'currentUser()') parts.push('assignee = currentUser()');
  else if (assignee) parts.push(`assignee = "${jqlQuote(assignee)}"`);
  if (keyword) {
    // 标题或描述命中关键字都算相关；搜索接口本身做了转义，这里仅需整体传入
    parts.push(`text ~ "${jqlQuote(keyword)}"`);
  }
  const jql = parts.join(' AND ') + ' ORDER BY updated DESC';
  const data = await api(`search?jql=${encodeURIComponent(jql)}&maxResults=${limit}&fields=summary,issuetype,status,priority,assignee,updated`, {}, '搜索任务');

  const result = {
    command: 'list',
    jql,
    total: data.total,
    keyword: keyword || null,
    scope: { project, types, statuses, assignee: assignee || 'all' },
    issues: (data.issues || []).map(i => ({
      key: i.key,
      summary: i.fields.summary,
      issue_type: i.fields.issuetype.name,
      status: i.fields.status.name,
      priority: i.fields.priority ? i.fields.priority.name : null,
      assignee: i.fields.assignee ? i.fields.assignee.displayName : null,
      updated: i.fields.updated,
      url: `${BASE}/browse/${i.key}`,
    })),
  };
  console.log(JSON.stringify(result, null, 2));
}

// ---------- 子命令: get ----------
async function cmdGet(args) {
  const ISSUE_KEY = args._[0];
  if (!ISSUE_KEY || !KEY_RE.test(ISSUE_KEY)) {
    fail(EXIT.ARGS, `ERROR_BAD_KEY: 任务 ID 格式不合法：'${ISSUE_KEY || ''}'（应为形如 PROJ-123 的标识）。`);
  }

  const data = await api(`issue/${ISSUE_KEY}`, { method: 'GET' }, '拉取任务');
  const f = data.fields || {};

  // 附件下载到持久目录（脚本退出后保留），供 Read 工具查看截图
  const ATTACH_DIR = CFG.attach_dir || path.join(SCRIPT_DIR, '..', '.cache', 'attachments', ISSUE_KEY);
  const attachments = Array.isArray(f.attachment) ? f.attachment : [];
  const index = [];
  if (!args['no-attachments'] && attachments.length > 0) {
    fs.mkdirSync(ATTACH_DIR, { recursive: true });
    const used = new Set();
    for (let i = 0; i < attachments.length; i++) {
      const a = attachments[i];
      const filename = a.filename || `attachment_${i}`;
      const dot = filename.lastIndexOf('.');
      const name = dot > 0 ? filename.slice(0, dot) : filename;
      const ext = dot > 0 ? filename.slice(dot) : '';
      const safeName = (name.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^_+|_+$/g, '') || `attachment_${i}`) + ext;
      let savedAs = safeName;
      for (let n = 1; used.has(savedAs); n++) {
        savedAs = safeName.replace(/(\.[^.]*)?$/, m => `_${n}${m}`);
      }
      used.add(savedAs);
      const outPath = path.join(ATTACH_DIR, savedAs);
      let httpCode = '000';
      try {
        const r = await fetchOrDie(a.content, { method: 'GET' }, '下载附件');
        httpCode = String(r.status);
        if (r.status === 200) fs.writeFileSync(outPath, Buffer.from(await r.arrayBuffer()));
      } catch { /* 保持 000，index 里如实记录 */ }
      index.push({
        filename,
        saved_as: savedAs,
        path: outPath,
        mime: a.mimeType || '',
        size_bytes: a.size != null ? a.size : fs.existsSync(outPath) ? fs.statSync(outPath).size : 0,
        download_http: httpCode,
        author: (a.author && a.author.displayName) || '',
        created: a.created || '',
      });
    }
  }

  const person = (p) => p ? { name: p.name, display: p.displayName, email: p.emailAddress } : null;
  const result = {
    command: 'get',
    issue_key: data.key,
    issue_id: data.id,
    self_url: data.self,
    summary: f.summary,
    issue_type: (f.issuetype || {}).name,
    status: (f.status || {}).name,
    priority: f.priority ? f.priority.name : null,
    resolution: f.resolution ? f.resolution.name : null,
    project: { key: (f.project || {}).key, name: (f.project || {}).name },
    reporter: person(f.reporter),
    assignee: person(f.assignee),
    created: f.created,
    updated: f.updated,
    components: (f.components || []).map(c => c.name),
    labels: f.labels || [],
    versions: (f.versions || []).map(v => v.name),
    fix_versions: (f.fixVersions || []).map(v => v.name),
    environment: f.environment,
    bug_cause: f[ALIGN.cause_field] !== undefined ? f[ALIGN.cause_field] : null, // bug原因 当前值
    description: f.description,
    comments: ((f.comment && f.comment.comments) || []).map(c => ({
      author: (c.author || {}).displayName, body: c.body, created: c.created,
    })),
    attachments: index,
    url: `${BASE}/browse/${data.key}`,
  };
  console.log(JSON.stringify(result, null, 2));
}

// ---------- 子命令: finish ----------
async function cmdFinish(args) {
  const ISSUE_KEY = args._[0];
  const cause = args['cause'] || '';
  const dryRun = !!args['dry-run'];
  if (!ISSUE_KEY || !KEY_RE.test(ISSUE_KEY)) {
    fail(EXIT.ARGS, `ERROR_BAD_KEY: 任务 ID 格式不合法：'${ISSUE_KEY || ''}'（应为形如 PROJ-123 的标识）。`);
  }
  if (!cause) {
    fail(EXIT.ARGS, 'ERROR_BAD_ARGS: finish 需要 --cause "<bug原因>"。修复完成后应给出一句根因描述，例如：\n  node jira.js finish NEWSH5-123 --cause "列表复用时未重置滚动位置导致错位"');
  }

  const issue = await api(`issue/${ISSUE_KEY}?fields=status,summary`, { method: 'GET' }, '确认任务');
  const fromStatus = ((issue.fields || {}).status || {}).name || '';
  const summary = (issue.fields || {}).summary || '';

  // 找"流转到目标状态"的可用 transition：优先 to.name 精确匹配，其次包含。
  // 目标状态默认"开发中"（口语"处理中"），用户指定其他状态时用 --to 覆盖（如 --to 待测试）。
  // 用 expand=transitions.fields 拿到每个流转屏幕上有哪些字段，判断能否随流转写 bug原因。
  const target = args['to'] || ALIGN.doing_status;
  // 幂等：任务已在目标状态（如上次 finish 执行到一半、流转成功但 cause 没写上，
  // 或者任务早已被流转过）时，跳过流转直接走写 cause 的逻辑。否则重跑会被
  // ERROR_NO_TRANSITION 卡死，原因永远补不上。
  const already = fromStatus === target;
  const trans = await api(`issue/${ISSUE_KEY}/transitions?expand=transitions.fields`, { method: 'GET' }, '查流转列表');
  const list = trans.transitions || [];
  const matched = list.find(t => ((t.to || {}).name || '') === target)
    || list.find(t => (((t.to || {}).name || '') || '').includes(target))
    || list.find(t => ((t.name || '') || '').includes(target));
  // 该流转的屏幕是否包含 bug原因 字段（决定能否随流转一次性写入）
  const screenHasCause = !!(matched && matched.fields && Object.prototype.hasOwnProperty.call(matched.fields, ALIGN.cause_field));

  const result = {
    command: 'finish',
    issue_key: ISSUE_KEY,
    summary,
    from_status: fromStatus,
    target_status: target,
    cause_field: ALIGN.cause_field,
    screen_has_cause_field: screenHasCause,
    dry_run: dryRun,
    transition_skipped: already,
    transition_id: matched ? matched.id : null,
    transition_name: matched ? matched.name : null,
  };

  if (dryRun) {
    result.available_transitions = list.map(t => ({ id: t.id, name: t.name, to: (t.to || {}).name }));
    result.would_do = already
      ? `任务已在"${target}"状态，跳过流转；bug原因走 PUT/评论兜底写入`
      : matched
        ? `流转 ${fromStatus} → ${target}；bug原因${screenHasCause ? '随流转写入 ' + ALIGN.cause_field : '不在此流转屏幕，将走 PUT/评论兜底'}`
        : `未找到流转到"${target}"的 transition（见 available_transitions）`;
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (!already && !matched) {
    fail(EXIT.FETCH, `ERROR_NO_TRANSITION: 任务 ${ISSUE_KEY}（当前 ${fromStatus}）没有流转到"${target}"的可用 transition。` +
      `可先用 --dry-run 查看可用流转列表。`);
  }

  // 1) 执行流转（已在目标状态时跳过）。只有当目标流转屏幕确实包含 bug原因 字段时，
  // 才把它随流转一起带上；否则带上会被 Jira 以 400 拒绝整个流转（字段不在该屏幕）。
  if (!already) {
    const body = { transition: { id: matched.id } };
    if (cause && screenHasCause) body.fields = { [ALIGN.cause_field]: cause };
    const doResp = await request(`${BASE}/rest/api/2/issue/${ISSUE_KEY}/transitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, '执行流转');

    if (doResp.status < 200 || doResp.status >= 300) {
      const errText = (await doResp.text().catch(() => '')).slice(0, 400);
      fail(EXIT.FETCH, `ERROR_TRANSITION_FAILED: 执行流转返回 HTTP ${doResp.status}。\n${errText}`);
    }
    result.transition_done = true;
  }

  // 2) 确认 bug原因 是否已随流转写入；没写上就单独 PUT 字段更新。
  const after = await api(`issue/${ISSUE_KEY}?fields=${ALIGN.cause_field},status`, { method: 'GET' }, '回读字段');
  result.status_after = ((after.fields || {}).status || {}).name || '';
  if ((after.fields || {})[ALIGN.cause_field] === cause) {
    // 字段已是要写的值：要么随本次流转写入，要么上次 finish 已写上（幂等重跑）
    result.cause_written_via = already ? 'already_set' : 'transition';
  } else {
    const putResp = await request(`${BASE}/rest/api/2/issue/${ISSUE_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { [ALIGN.cause_field]: cause } }),
    }, '写 bug原因 字段');
    if (putResp.status >= 200 && putResp.status < 300) {
      result.cause_written_via = 'field_update';
    } else {
      // 3) 字段不可写 → 兜底加评论，保证原因留痕
      const cResp = await request(`${BASE}/rest/api/2/issue/${ISSUE_KEY}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: `【修复原因】${cause}` }),
      }, '加评论兜底');
      if (cResp.status < 200 || cResp.status >= 300) {
        const errText = (await cResp.text().catch(() => '')).slice(0, 400);
        fail(EXIT.FETCH, `ERROR_CAUSE_WRITE_FAILED: 流转成功，但 bug原因 字段与评论均写入失败（HTTP ${cResp.status}）。\n${errText}`);
      }
      result.cause_written_via = 'comment';
    }
  }

  console.log(JSON.stringify(result, null, 2));
}

// ---------- 子命令: comment ----------
// 往任务上加评论。用在修复过程需要留痕但又不属于"修完回写"的时刻：
// 复现不了需要补充信息、方案说明、测试打回后的解释、旧 bug原因 的留痕等。
async function cmdComment(args) {
  const ISSUE_KEY = args._[0];
  const text = args['text'];
  if (!ISSUE_KEY || !KEY_RE.test(ISSUE_KEY)) {
    fail(EXIT.ARGS, `ERROR_BAD_KEY: 任务 ID 格式不合法：'${ISSUE_KEY || ''}'（应为形如 PROJ-123 的标识）。`);
  }
  if (!text) {
    fail(EXIT.ARGS, 'ERROR_BAD_ARGS: comment 需要 --text "<评论内容>"。例如：\n  node jira.js comment NEWSH5-123 --text "缺复现步骤，麻烦补充下操作路径和环境"');
  }

  const resp = await request(`${BASE}/rest/api/2/issue/${ISSUE_KEY}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: text }),
  }, '发表评论');
  if (resp.status < 200 || resp.status >= 300) {
    const errText = (await resp.text().catch(() => '')).slice(0, 400);
    fail(EXIT.FETCH, `ERROR_COMMENT_FAILED: 发表评论返回 HTTP ${resp.status}。\n${errText}`);
  }
  const created = await resp.json().catch(() => null);
  console.log(JSON.stringify({
    command: 'comment',
    issue_key: ISSUE_KEY,
    comment_id: created && created.id ? created.id : null,
    author: (created && created.author && created.author.displayName) || null,
    created_at: (created && created.created) || null,
    body: text,
    url: `${BASE}/browse/${ISSUE_KEY}`,
  }, null, 2));
}

// ---------- 入口 ----------
async function main() {
  await login();
  if (cmd === 'list') return cmdList(parseArgs(rest, LIST_FLAGS));
  if (cmd === 'get') return cmdGet(parseArgs(rest, GET_FLAGS));
  if (cmd === 'finish') return cmdFinish(parseArgs(rest, FINISH_FLAGS));
  if (cmd === 'comment') return cmdComment(parseArgs(rest, COMMENT_FLAGS));
  fail(EXIT.ARGS, [
    '用法: node jira.js <list|get|finish|comment> [参数]',
    '  list    [--keyword 词] [--limit N] [--project KEY] [--status A,B] [--type A,B] [--assignee 姓名|all]   搜索任务（默认：NEWSH5 bug 类待办、分给当前用户的前 10 条）',
    '  get     <ISSUE_KEY> [--no-attachments]                                          拉取任务详情与附件',
    '  finish  <ISSUE_KEY> --cause "bug原因" [--to 状态] [--dry-run]                                流转任务（默认到"开发中"）并填 bug原因',
    '  comment <ISSUE_KEY> --text "评论内容"                                          往任务上加评论',
  ].join('\n'));
}

main().catch(e => fail(EXIT.FETCH, `ERROR_FETCH_FAILED: 意外错误：${e && e.stack || e}`));
