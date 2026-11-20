#!/usr/bin/env python3
"""Gemini 이미지 커넥터 — Claude 에서 Google Gemini 이미지 모델(Nano Banana 계열)을 부르는 MCP 서버.

표준 라이브러리만 쓴다(pip 설치 불필요).

  MCP 서버로:  python3 tools/gemini-image/server.py          (.mcp.json 이 이렇게 띄운다)
  바로 시험:   python3 tools/gemini-image/server.py --cli "고양이 수채화" [--aspect 16:9] [--res 2K]

환경 변수
  GEMINI_API_KEY      Google AI Studio API 키. 필수(클라우드에서는 프록시가 넣어 준다).
  GEMINI_IMAGE_MODEL  기본 gemini-3.1-flash-image
  GEMINI_IMAGE_OUT_DIR 저장 폴더. 기본 ./generated-images
"""
import base64
import json
import mimetypes
import os
import ssl
import sys
import time
import urllib.error
import urllib.request

BASE = os.environ.get("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image")
OUT_DIR = os.environ.get("GEMINI_IMAGE_OUT_DIR", os.path.join(os.getcwd(), "generated-images"))
EXT = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}

TOOL = {
    "name": "gemini_generate_image",
    "description": "Google Gemini 이미지 모델로 그림을 만들어 저장하고, 저장 경로와 미리보기를 돌려준다.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "prompt": {"type": "string", "description": "만들 그림 설명(한국어 가능)"},
            "aspect_ratio": {"type": "string", "default": "1:1",
                             "description": "1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 21:9 등"},
            "resolution": {"type": "string", "description": "512px · 1K(기본) · 2K · 4K — 클수록 비싸다. 2K/4K 는 flash-image·pro, 512px 는 flash·flash-lite"},
            "reference_images": {"type": "array", "items": {"type": "string"},
                                 "description": "참고 이미지 파일 경로들(flash·pro 최대 14장, lite 3장). 캐릭터·스타일 유지, 합성, 번역"},
            "thinking_level": {"type": "string", "enum": ["minimal", "low", "high"],
                               "description": "flash-image·pro 의 사전 구상 강도. 복잡한 구도·인포그래픽은 high"},
            "google_search": {"type": "boolean", "default": False,
                              "description": "구글 검색으로 실제 사물·장소·최신 정보 근거 잡기(flash-image·pro)"},
            "model": {"type": "string", "description": "생략하면 기본 모델. 예: gemini-3.1-flash-image, gemini-3-pro-image"},
            "filename": {"type": "string", "description": "파일 이름 앞부분(확장자 없이). 생략하면 시각으로"},
        },
        "required": ["prompt"],
    },
}


def _ssl_context():
    cafile = os.environ.get("SSL_CERT_FILE") or os.environ.get("REQUESTS_CA_BUNDLE")
    return ssl.create_default_context(cafile=cafile) if cafile else ssl.create_default_context()


def generate(prompt, aspect_ratio="1:1", resolution=None, model=None, filename=None,
             reference_images=None, thinking_level=None, google_search=False):
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY 가 없습니다. aistudio.google.com 에서 API 키를 만들어 환경 변수로 넣어 주세요.")
    image_config = {"aspectRatio": aspect_ratio}
    if resolution:
        image_config["imageSize"] = resolution
    parts = [{"text": prompt}]
    for r in reference_images or []:
        r = os.path.expanduser(r)
        if not os.path.isfile(r):
            raise ValueError(f"참고 이미지가 없습니다: {r}")
        with open(r, "rb") as f:
            parts.append({"inlineData": {"mimeType": mimetypes.guess_type(r)[0] or "image/png",
                                         "data": base64.b64encode(f.read()).decode()}})
    gen = {"responseModalities": ["TEXT", "IMAGE"], "imageConfig": image_config}
    if thinking_level:
        gen["thinkingConfig"] = {"thinkingLevel": thinking_level}
    body = {"contents": [{"parts": parts}], "generationConfig": gen}
    if google_search:
        body["tools"] = [{"googleSearch": {}}]
    url = f"{BASE}/models/{model or MODEL}:generateContent"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"x-goog-api-key": key, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300, context=_ssl_context()) as r:
            data = json.loads(r.read())
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:800]
        hint = {400: " (요청 거절 — 비율·해상도·키 확인)",
                403: " (키 권한 없음 — PC 에서는 GEMINI_API_KEY, 클라우드에서는 환경의 비밀값 확인)",
                404: " (모델 이름 확인)", 429: " (무료 한도 초과 또는 결제 미설정 — AI Studio 에서 결제 연결)"}.get(e.code, "")
        raise RuntimeError(f"Gemini 오류 {e.code}{hint}: {detail}") from None

    os.makedirs(OUT_DIR, exist_ok=True)
    stem = "".join(c for c in (filename or "") if c.isalnum() or c in "-_ ").strip() or time.strftime("gemini-%Y%m%d-%H%M%S")
    paths, previews, texts = [], [], []
    for cand in data.get("candidates", []):
        for part in (cand.get("content") or {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                mime = inline.get("mimeType") or inline.get("mime_type") or "image/png"
                n = len(paths)
                path = os.path.join(OUT_DIR, f"{stem}{'' if n == 0 else f'-{n + 1}'}.{EXT.get(mime, 'png')}")
                with open(path, "wb") as f:
                    f.write(base64.b64decode(inline["data"]))
                paths.append(path)
                previews.append((inline["data"], mime))
            elif part.get("text") and not part.get("thought"):
                texts.append(part["text"])
    if not paths:
        reason = (data.get("promptFeedback") or {}).get("blockReason") or \
                 ((data.get("candidates") or [{}])[0].get("finishReason"))
        raise RuntimeError(f"이미지가 오지 않았습니다(사유: {reason}). 응답: {' '.join(texts)[:300] or json.dumps(data)[:300]}")
    return paths, previews, data.get("usageMetadata"), " ".join(texts).strip()


# ---------- MCP (stdio, JSON-RPC 한 줄씩) ----------

def _send(msg):
    sys.stdout.write(json.dumps(msg, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def _handle(req):
    method, rid, params = req.get("method"), req.get("id"), req.get("params") or {}
    if rid is None:
        return
    if method == "initialize":
        result = {"protocolVersion": params.get("protocolVersion", "2025-06-18"),
                  "capabilities": {"tools": {}},
                  "serverInfo": {"name": "gemini-image", "version": "1.0.0"}}
    elif method == "ping":
        result = {}
    elif method == "tools/list":
        result = {"tools": [TOOL]}
    elif method == "tools/call":
        if params.get("name") != TOOL["name"]:
            return _send({"jsonrpc": "2.0", "id": rid, "error": {"code": -32602, "message": "알 수 없는 도구"}})
        try:
            paths, previews, usage, note = generate(**(params.get("arguments") or {}))
            text = "저장: " + ", ".join(paths) + (f"\n모델 메모: {note}" if note else "") + \
                   (f"\n사용량: {json.dumps(usage)}" if usage else "")
            content = [{"type": "text", "text": text}] + [
                {"type": "image", "data": b, "mimeType": m} for b, m in previews]
            result = {"content": content}
        except Exception as e:
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
    p = argparse.ArgumentParser(description="Gemini 이미지 한 장 만들기")
    p.add_argument("prompt")
    p.add_argument("--aspect", default="1:1")
    p.add_argument("--res")
    p.add_argument("--model")
    p.add_argument("--filename")
    p.add_argument("--ref", action="append", help="참고 이미지(여러 번 가능)")
    p.add_argument("--thinking", choices=["minimal", "low", "high"])
    p.add_argument("--search", action="store_true")
    a = p.parse_args(argv)
    paths, _, usage, note = generate(a.prompt, a.aspect, a.res, a.model, a.filename, a.ref, a.thinking, a.search)
    print("\n".join(paths))
    if note:
        print("note:", note, file=sys.stderr)
    if usage:
        print("usage:", json.dumps(usage), file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--cli":
        cli(sys.argv[2:])
    else:
        serve()
