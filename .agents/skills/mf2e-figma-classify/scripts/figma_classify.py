#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
figma_classify.py —— Figma 页面归类工具（纯功能版）

脚本只负责机械动作：下载(metadata/截图) + 解析(抽顶层 frame + 内部文字) + 输出(raw 清单) + 渲染(LLM 分类结果)。
所有「分析推断」——哪些是页面/组件/背景、如何分组、归属哪页——都交给大模型，脚本不含任何硬编码规则。

三阶段流程：
  ① 提取(脚本)  python3 figma_classify.py --url "..." --shots shots/ --extract raw
     产出 raw.json（每个顶层 frame 的 id/name/type/尺寸/内部文字/截图路径）+ 截图目录
  ② 分析(大模型)  读 raw.json + 截图，产出 classify.json：
     {
       "groups": {
         "首页": {"screens": ["1:84", ...], "attachments": ["1:204", "286:2998", ...]},
         "排行榜": {"screens": [...], "attachments": [...]}
       },
       "unattributed": ["1:6663", ...]
     }
  ③ 渲染(脚本)  python3 figma_classify.py --url "..." --classify classify.json --out manifest
     产出 manifest.json/.md（把 node-id 映射回完整 frame 信息）

用法：
  --url URL          Figma 页面 URL（在线拉取，读 FIGMA_TOKEN）
  --json PATH        本地 metadata JSON（Figma MCP 导出）
  --frames PATH      本地 raw.json 路径（离线渲染，供 --classify 用，无需 token）
  --shots DIR        下载所有顶层 frame 截图到 DIR（需 --url）
  --extract PREFIX   输出 raw 清单（LLM 输入），文件名 PREFIX.json
  --prd PATH         需求文档路径，原文原样并入 raw 清单（供大模型做词表匹配）
  --classify JSON    应用 LLM 分类结果，渲染 manifest（--out 前缀）
  --out PREFIX       输出文件前缀（默认 manifest）
"""

import argparse
import html
import json
import os
import re
import ssl
import sys
import time
import urllib.request


# ---------------------------------------------------------------------------
# 纯功能：网络 / 解析
# ---------------------------------------------------------------------------

def _ssl_context():
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl._create_unverified_context()


def parse_url(url):
    m = re.search(r'/design/([^/]+)/', url)
    if not m:
        raise ValueError(f"无法从 URL 解析 file_key: {url}")
    file_key = m.group(1)
    n = re.search(r'node-id=([^&]+)', url)
    node_id = n.group(1).replace('-', ':') if n else None
    return file_key, node_id


def _dedup(items):
    seen, result = set(), []
    for it in items:
        if it not in seen:
            seen.add(it)
            result.append(it)
    return result


def fetch_via_api(file_key, node_id, token, depth=2):
    """在线拉取页面顶层 frame（不展开内部层级）。"""
    url = (f"https://api.figma.com/v1/files/{file_key}/nodes"
           f"?ids={node_id}&depth={depth}")
    req = urllib.request.Request(url, headers={"X-Figma-Token": token})
    try:
        with urllib.request.urlopen(req, timeout=30, context=_ssl_context()) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 403:
            raise RuntimeError("Token 无效或无该文件权限 (HTTP 403)")
        raise RuntimeError(f"请求失败 (HTTP {e.code}): {e.reason}")

    node = data["nodes"][node_id]["document"]
    frames = []
    for child in node.get("children", []):
        bbox = child.get("absoluteBoundingBox") or {}
        frames.append({
            "id": child.get("id", ""),
            "name": child.get("name", ""),
            "type": child.get("type", ""),
            "x": bbox.get("x", 0),
            "y": bbox.get("y", 0),
            "width": bbox.get("width", 0),
            "height": bbox.get("height", 0),
        })
    return frames, node.get("name", "")


def extract_texts_from_xml(xml_text, node_id):
    """从 metadata XML 里抽取某顶层节点子树内的所有 text 文案（去重保序）。"""
    lines = xml_text.split("\n")
    start = None
    for i, line in enumerate(lines):
        if f'id="{node_id}"' in line:
            start = i
            break
    if start is None:
        return []
    end = len(lines)
    for j in range(start + 1, len(lines)):
        if lines[j].startswith("  <"):
            end = j
            break
    texts = []
    for line in lines[start:end]:
        if re.match(r'^\s*<text\b', line):
            nm = re.search(r'name="([^"]*)"', line)
            if nm and nm.group(1):
                texts.append(nm.group(1))
    return _dedup(texts)


def fetch_via_json(path):
    """读本地 metadata JSON，返回顶层 frame（含内部文字）。"""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    text = data[0]["text"]
    page_name = ""
    frames = []
    for line in text.split("\n"):
        if line.startswith("<canvas "):
            m = re.search(r'name="([^"]*)"', line)
            if m:
                page_name = m.group(1)
        # 顶层节点 = 恰好 2 空格缩进的任意元素
        if line.startswith("  <"):
            tm = re.match(r'^  <([a-z][a-z0-9-]*)\b', line)
            idm = re.search(r'\bid="([^"]+)"', line)
            if not tm or not idm:
                continue
            nm = re.search(r'\bname="([^"]*)"', line)
            def _g(pat):
                mm = re.search(pat, line)
                return float(mm.group(1)) if mm else 0.0
            frames.append({
                "id": idm.group(1),
                "name": nm.group(1) if nm else "",
                "type": tm.group(1).upper(),
                "x": _g(r'\bx="([^"]+)"'),
                "y": _g(r'\by="([^"]+)"'),
                "width": _g(r'\bwidth="([^"]+)"'),
                "height": _g(r'\bheight="([^"]+)"'),
            })
    for frame in frames:
        frame["texts"] = extract_texts_from_xml(text, frame["id"])
    return frames, page_name


def _walk_texts(node):
    """递归收集某节点子树内的所有 TEXT characters。"""
    texts = []

    def walk(n):
        if n.get("type") == "TEXT" and n.get("characters"):
            texts.append(n["characters"])
        for c in n.get("children", []):
            walk(c)

    walk(node)
    return texts


def fetch_texts_via_api(file_key, node_ids, token, depth=4, chunk=10):
    """批量拉取多个 frame 子树内的 text 文案，返回 {node_id: [texts]}（去重保序）。"""
    result = {}
    for i in range(0, len(node_ids), chunk):
        batch = node_ids[i:i + chunk]
        url = (f"https://api.figma.com/v1/files/{file_key}/nodes"
               f"?ids={','.join(batch)}&depth={depth}")
        req = urllib.request.Request(url, headers={"X-Figma-Token": token})
        try:
            with urllib.request.urlopen(req, timeout=120, context=_ssl_context()) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"警告: 拉取文字失败，该批 {len(batch)} 个 frame 的 texts 为空: {e}",
                  file=sys.stderr)
            for nid in batch:
                result[nid] = []
            continue
        nodes = data.get("nodes", {})
        for nid in batch:
            node = nodes.get(nid, {}).get("document")
            result[nid] = _dedup(_walk_texts(node)) if node else []
    return result


def load_frames_from_raw(path):
    """从 --extract 产出的 raw.json 读取 frame 信息（离线渲染用，无需 token）。"""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    frames = []
    for item in data.get("frames", []):
        width = item.get("width")
        height = item.get("height")
        if width is None or height is None:
            m = re.match(r'^(\d+)x(\d+)$', item.get("size", ""))
            width, height = (float(m.group(1)), float(m.group(2))) if m else (0, 0)
        frames.append({
            "id": item.get("id", ""),
            "name": item.get("name", ""),
            "type": item.get("type", ""),
            "width": width,
            "height": height,
            "x": item.get("x", 0),
            "y": item.get("y", 0),
            "texts": item.get("texts", []),
        })
    return frames


def shot_filename(frame):
    name = html.unescape(frame.get("name", "") or "").strip()
    safe = re.sub(r'[^\w一-鿿-]+', '_', name)[:40].strip('_')
    return f"{safe or 'frame'}__{frame['id'].replace(':', '-')}.png"


def fetch_screenshots(file_key, frames, token, out_dir, scale=2, chunk=20):
    """批量渲染并下载顶层 frame 截图。"""
    ids = [f["id"] for f in frames if f.get("id")]
    os.makedirs(out_dir, exist_ok=True)
    images = {}
    for i in range(0, len(ids), chunk):
        batch = ids[i:i + chunk]
        url = (f"https://api.figma.com/v1/images/{file_key}"
               f"?ids={','.join(batch)}&format=png&scale={scale}")
        req = urllib.request.Request(url, headers={"X-Figma-Token": token})
        with urllib.request.urlopen(req, timeout=180, context=_ssl_context()) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        images.update(data.get("images", {}))
    n = 0
    for f in frames:
        img_url = images.get(f["id"])
        if not img_url:
            continue
        path = os.path.join(out_dir, shot_filename(f))
        ok = False
        for _ in range(3):
            try:
                req2 = urllib.request.Request(img_url)
                with urllib.request.urlopen(req2, timeout=60, context=_ssl_context()) as resp:
                    with open(path, "wb") as out:
                        out.write(resp.read())
                ok = True
                break
            except Exception as e:
                print(f"  下载 {f['id']} 重试中 ({e})", file=sys.stderr)
                time.sleep(1)
        if ok:
            n += 1
    print(f"已下载 {n}/{len(ids)} 张截屏到 {out_dir}")
    return out_dir


# ---------------------------------------------------------------------------
# 输出 / 渲染
# ---------------------------------------------------------------------------

def emit_raw(frames, shots_dir, out_prefix, prd_text=None):
    """输出 raw 清单（LLM 输入）。prd_text 为需求文档原文，原样并入，供大模型做词表匹配。"""
    items = []
    for f in frames:
        items.append({
            "id": f["id"],
            "name": html.unescape(f.get("name", "") or "").strip(),
            "type": f.get("type", ""),
            "width": f["width"],
            "height": f["height"],
            "size": f"{f['width']:.0f}x{f['height']:.0f}",
            "x": f["x"],
            "y": f["y"],
            "texts": f.get("texts", []),
            "shot": os.path.join(shots_dir, shot_filename(f)) if shots_dir else None,
        })
    payload = {"frames": items}
    if prd_text:
        payload["prd"] = prd_text
    path = f"{out_prefix}.json"
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)
    extra = "，含 PRD 原文" if prd_text else ""
    print(f"已写出 raw 清单 {path}（{len(items)} 个顶层 frame{extra}，交给大模型分析）")
    return items


def render_manifest(frames, classification, out_prefix):
    """应用 LLM 分类结果，渲染 manifest.json/.md。

    classification 形如：
      {"groups": {"首页": {"screens": [...], "attachments": [...]}, ...}, "unattributed": [...]}
    """
    by_id = {f["id"]: f for f in frames}
    groups = classification.get("groups", {})
    unattributed = classification.get("unattributed", [])

    def _entry(node_id, kind):
        f = by_id.get(node_id)
        if not f:
            return None
        return {
            "id": node_id,
            "name": html.unescape(f.get("name", "") or "").strip(),
            "kind": kind,
            "size": f"{f['width']:.0f}x{f['height']:.0f}",
            "x": f["x"],
            "y": f["y"],
        }

    screens = {}
    attachments = {}
    for g, parts in groups.items():
        screens[g] = [e for e in (_entry(i, "screen") for i in parts.get("screens", [])) if e]
        attachments[g] = [e for e in (_entry(i, "attachment") for i in parts.get("attachments", [])) if e]
    # 去掉空分组（没有 screen 或 attachment 的组不输出）
    screens = {g: items for g, items in screens.items() if items}
    attachments = {g: items for g, items in attachments.items() if items}
    unattr = [e for e in (_entry(i, None) for i in unattributed) if e]

    # 检查是否有 frame 漏在分类之外
    mentioned = set(unattributed)
    for g, parts in groups.items():
        mentioned.update(parts.get("screens", []))
        mentioned.update(parts.get("attachments", []))
    missing = [f["id"] for f in frames if f["id"] not in mentioned]
    if missing:
        print(f"警告: {len(missing)} 个 frame 未在分类结果中出现，将被忽略: {missing[:15]}",
              file=sys.stderr)

    for v in screens.values():
        v.sort(key=lambda e: (e["y"], e["x"]))
    for v in attachments.values():
        v.sort(key=lambda e: (e["y"], e["x"]))
    unattr.sort(key=lambda e: (e["y"], e["x"]))

    manifest = {"screens": screens, "attachments": attachments, "unattributed": unattr}
    json_path = f"{out_prefix}.json"
    with open(json_path, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2)
    md_path = f"{out_prefix}.md"
    with open(md_path, "w", encoding="utf-8") as fh:
        fh.write(render_markdown(manifest))
    print(f"已渲染 {json_path} 和 {md_path}")
    return manifest


def render_markdown(manifest):
    lines = ["# Figma 页面归类清单\n"]
    n_screen = sum(len(v) for v in manifest["screens"].values())
    n_att = sum(len(v) for v in manifest["attachments"].values())
    lines.append(f"- 统计: 页面 {n_screen} / 附属 {n_att} / 未归属 {len(manifest['unattributed'])}\n")
    lines.append("\n## 页面（按功能分组）\n")
    for g, frames_ in manifest["screens"].items():
        lines.append(f"### {g}（{len(frames_)}）\n")
        lines.append("| node-id | 名称 | 尺寸 |")
        lines.append("|---|---|---|")
        for e in frames_:
            lines.append(f"| `{e['id']}` | {e['name']} | {e['size']} |")
        lines.append("")
    lines.append("\n## 附属（散落的背景图/组件/素材）\n")
    if manifest["attachments"]:
        for g, items in manifest["attachments"].items():
            lines.append(f"### {g}\n")
            lines.append("| node-id | 名称 | 尺寸 |")
            lines.append("|---|---|---|")
            for e in items:
                lines.append(f"| `{e['id']}` | {e['name']} | {e['size']} |")
            lines.append("")
    else:
        lines.append("（无）\n")
    lines.append("\n## 未归属\n")
    if manifest["unattributed"]:
        lines.append("| node-id | 名称 | 尺寸 |")
        lines.append("|---|---|---|")
        for e in manifest["unattributed"]:
            lines.append(f"| `{e['id']}` | {e['name']} | {e['size']} |")
    else:
        lines.append("（无）")
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# 入口
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Figma 页面归类工具（纯功能版）")
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--url", help="Figma 页面 URL")
    src.add_argument("--json", help="本地 metadata JSON 路径")
    src.add_argument("--frames", help="本地 raw.json 路径（离线渲染，供 --classify 用）")
    ap.add_argument("--token", help="Figma Personal Access Token（或环境变量 FIGMA_TOKEN）")
    ap.add_argument("--shots", help="下载顶层 frame 截图到该目录（需 --url）")
    ap.add_argument("--extract", help="输出 raw 清单到该前缀（LLM 输入）")
    ap.add_argument("--prd", help="需求文档路径，原文并入 raw 清单（需 --extract）")
    ap.add_argument("--classify", help="应用 LLM 分类结果 JSON，渲染 manifest")
    ap.add_argument("--out", default="manifest", help="输出文件前缀（默认 manifest）")
    args = ap.parse_args()

    file_key = None
    token = None

    need_raw = args.extract or (not args.classify)

    if args.url:
        file_key, node_id = parse_url(args.url)
        if not node_id:
            print("错误: URL 缺少 node-id（形如 ?node-id=0-1），请提供指向页面/画布节点的链接",
                  file=sys.stderr)
            sys.exit(1)
        token = args.token or os.environ.get("FIGMA_TOKEN")
        if not token:
            home_token = os.path.expanduser("~/.figma_token")
            if os.path.exists(home_token):
                token = open(home_token, encoding="utf-8").read().strip()
        if not token:
            print("错误: 需要 Figma Token（--token 或环境变量 FIGMA_TOKEN 或 ~/.figma_token）",
                  file=sys.stderr)
            sys.exit(1)
        frames, page_name = fetch_via_api(file_key, node_id, token)
        # 只有要输出 raw 清单（给 LLM 判断归属）时才批量拉文字；--classify 纯渲染不需要 texts
        if need_raw:
            texts_map = fetch_texts_via_api(file_key, [f["id"] for f in frames], token)
            for f in frames:
                f["texts"] = texts_map.get(f["id"], [])
    elif args.json:
        frames, page_name = fetch_via_json(args.json)
    else:  # args.frames
        frames, page_name = load_frames_from_raw(args.frames), ""

    if args.shots:
        if file_key is None or not token:
            print("错误: --shots 需要 --url 模式", file=sys.stderr)
            sys.exit(1)
        fetch_screenshots(file_key, frames, token, args.shots)

    prd_text = None
    if args.prd:
        with open(args.prd, encoding="utf-8") as f:
            prd_text = f.read()

    if args.extract:
        emit_raw(frames, args.shots, args.extract, prd_text)

    if args.classify:
        with open(args.classify, encoding="utf-8") as f:
            classification = json.load(f)
        render_manifest(frames, classification, args.out)

    if not args.extract and not args.classify:
        # 默认：仅输出 raw 清单
        emit_raw(frames, args.shots, args.out, prd_text)


if __name__ == "__main__":
    main()
