#!/usr/bin/env python3
"""GPT 이미지 커넥터 — Claude(Opus)에서 OpenAI 이미지 모델을 부르는 MCP 서버.

표준 라이브러리만 쓴다(pip 설치 불필요).

  MCP 서버로:  python3 tools/gpt-image/server.py            (.mcp.json 이 이렇게 띄운다)
  바로 시험:   python3 tools/gpt-image/server.py --cli "고양이 수채화" [--size 1024x1024]

환경 변수
  OPENAI_API_KEY      OpenAI API 키(ChatGPT 구독과 별개, 이미지당 과금). 필수.
  OPENAI_IMAGE_MODEL  기본 gpt-image-2.6-sunburst
  GPT_IMAGE_OUT_DIR   저장 폴더. 기본 ./generated-images
"""
import base64
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request

API_URL = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/") + "/images/generations"
MODEL = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-2.6-sunburst")
OUT_DIR = os.environ.get("GPT_IMAGE_OUT_DIR", os.path.join(os.getcwd(), "generated-images"))
SIZES = ["1024x1024", "1536x1024", "1024x1536", "auto"]
QUALITIES = ["low", "medium", "high", "xhigh", "max", "auto"]

TOOL = {
    "name": "gpt_generate_image",
    "description": "OpenAI GPT 이미지 모델로 그림을 만들어 PNG 로 저장하고, 저장 경로와 미리보기를 돌려준다.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "prompt": {"type": "string", "description": "만들 그림 설명(한국어 가능)"},
            "size": {"type": "string", "enum": SIZES, "default": "1024x1024"},
            "quality": {"type": "string", "enum": QUALITIES, "default": "medium",
                        "description": "low < medium < high < xhigh < max 순으로 비싸다"},
            "model": {"type": "string", "description": "생략하면 기본 모델. 예: gpt-image-2.6-sunburst, gpt-image-2.6-flare, gpt-image-2"},
            "n": {"type": "integer", "minimum": 1, "maximum": 4, "default": 1},
            "background": {"type": "string", "enum": ["auto", "transparent", "opaque"], "default": "auto"},
            "filename": {"type": "string", "description": "파일 이름 앞부분(확장자 없이). 생략하면 시각으로"},
        },
        "required": ["prompt"],
    },
}


def _ssl_context():
    cafile = os.environ.get("SSL_CERT_FILE") or os.environ.get("REQUESTS_CA_BUNDLE")
    return ssl.create_default_context(cafile=cafile) if cafile else ssl.create_default_context()


def generate(prompt, size="1024x1024", quality="medium", n=1, background="auto", filename=None, model=None):
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY 가 없습니다. platform.openai.com 에서 API 키를 만들어 환경 변수로 넣어 주세요.")
    if size not in SIZES:
        raise ValueError(f"size 는 {SIZES} 중 하나")
    if quality not in QUALITIES:
        raise ValueError(f"quality 는 {QUALITIES} 중 하나")
    body = {"model": model or MODEL, "prompt": prompt, "size": size, "quality": quality,
            "n": max(1, min(int(n), 4)), "background": background}
    req = urllib.request.Request(
        API_URL, data=json.dumps(body).encode(), method="POST",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300, context=_ssl_context()) as r:
            data = json.loads(r.read())
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:800]
        hint = {401: " (API 키가 없거나 틀림 — PC 에서는 OPENAI_API_KEY 를 설정, 클라우드에서는 환경의 api.openai.com 비밀값 확인)", 403: " (조직 인증 필요 또는 네트워크 차단)",
                429: " (크레딧 부족 또는 한도 초과 — platform.openai.com 결제 화면 확인)", 400: " (요청 거절 — 프롬프트·크기 확인)"}.get(e.code, "")
        raise RuntimeError(f"OpenAI 오류 {e.code}{hint}: {detail}") from None

    os.makedirs(OUT_DIR, exist_ok=True)
    stem = "".join(c for c in (filename or "") if c.isalnum() or c in "-_ ").strip() or time.strftime("gpt-%Y%m%d-%H%M%S")
    paths, previews = [], []
    for i, item in enumerate(data.get("data", [])):
        b64 = item.get("b64_json")
        if not b64:
            continue
        path = os.path.join(OUT_DIR, f"{stem}{'' if i == 0 else f'-{i + 1}'}.png")
        with open(path, "wb") as f:
            f.write(base64.b64decode(b64))
        paths.append(path)
        previews.append(b64)
    if not paths:
        raise RuntimeError(f"이미지가 오지 않았습니다: {json.dumps(data)[:500]}")
    return paths, previews, data.get("usage")


# ---------- MCP (stdio, JSON-RPC 한 줄씩) ----------

def _send(msg):
    sys.stdout.write(json.dumps(msg, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def _handle(req):
    method, rid, params = req.get("method"), req.get("id"), req.get("params") or {}
    if rid is None:  # 알림(notifications/*)은 답하지 않는다
        return
    if method == "initialize":
        result = {"protocolVersion": params.get("protocolVersion", "2025-06-18"),
                  "capabilities": {"tools": {}},
                  "serverInfo": {"name": "gpt-image", "version": "1.0.0"}}
    elif method == "ping":
        result = {}
    elif method == "tools/list":
        result = {"tools": [TOOL]}
    elif method == "tools/call":
        if params.get("name") != TOOL["name"]:
            return _send({"jsonrpc": "2.0", "id": rid, "error": {"code": -32602, "message": "알 수 없는 도구"}})
        try:
            paths, previews, usage = generate(**(params.get("arguments") or {}))
            text = "저장: " + ", ".join(paths) + (f"\n사용량: {json.dumps(usage)}" if usage else "")
            content = [{"type": "text", "text": text}] + [
                {"type": "image", "data": b, "mimeType": "image/png"} for b in previews]
            result = {"content": content}
        except Exception as e:  # 도구 오류는 모델이 읽을 수 있게 결과로 돌려준다
            result = {"content": [{"type": "text", "text": str(e)}], "isError": True}
    else:
        return _send({"jsonrpc": "2.0", "id": rid, "error": {"code": -32601, "message": f"지원 안 함: {method}"}})
    _send({"jsonrpc": "2.0", "id": rid, "result": result})


def serve():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            _handle(json.loads(line))
        except Exception as e:
            _send({"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": str(e)}})


def cli(argv):
    import argparse
    p = argparse.ArgumentParser(description="GPT 이미지 한 장 만들기")
    p.add_argument("prompt")
    p.add_argument("--size", default="1024x1024", choices=SIZES)
    p.add_argument("--quality", default="medium", choices=QUALITIES)
    p.add_argument("--n", type=int, default=1)
    p.add_argument("--filename")
    p.add_argument("--model")
    a = p.parse_args(argv)
    paths, _, usage = generate(a.prompt, a.size, a.quality, a.n, filename=a.filename, model=a.model)
    print("\n".join(paths))
    if usage:
        print("usage:", json.dumps(usage), file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--cli":
        cli(sys.argv[2:])
    else:
        serve()
