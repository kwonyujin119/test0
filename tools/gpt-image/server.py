#!/usr/bin/env python3
"""GPT 이미지 커넥터 — Claude(Opus)에서 OpenAI 이미지 모델을 부르는 MCP 서버.

표준 라이브러리만 쓴다(pip 설치 불필요).

  MCP 서버로:  python3 tools/gpt-image/server.py            (.mcp.json 이 이렇게 띄운다)
  바로 시험:   python3 tools/gpt-image/server.py --cli "고양이 수채화" [--size 1536x864] [--ref 그림.png]

참고 이미지(reference_images)를 주면 /images/edits 로 보내 편집·스타일 유지·캐릭터 유지를 한다.

환경 변수
  OPENAI_API_KEY      OpenAI API 키(ChatGPT 구독과 별개, 이미지당 과금). 필수.
  OPENAI_IMAGE_MODEL  기본 gpt-image-2.6-sunburst
  GPT_IMAGE_OUT_DIR   저장 폴더. 기본 ./generated-images
"""
import base64
import json
import mimetypes
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.request

BASE = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
MODEL = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-2.6-sunburst")
OUT_DIR = os.environ.get("GPT_IMAGE_OUT_DIR", os.path.join(os.getcwd(), "generated-images"))
# gpt-image-2 계열: 가로·세로 16의 배수, 긴 변 < 3840, 비율 ≤ 3:1, 655,360 ≤ 픽셀 수 ≤ 8,294,400 (2560x1440 초과는 실험적)
SIZE_EXAMPLES = "1024x1024 · 1536x1024(가로) · 1024x1536(세로) · 1536x864(16:9) · 864x1536(9:16) · 2560x1440(2K) · auto"
QUALITIES = ["low", "medium", "high", "xhigh", "max", "auto"]

TOOL = {
    "name": "gpt_generate_image",
    "description": "OpenAI GPT 이미지 모델로 그림을 만들어 PNG 로 저장하고, 저장 경로와 미리보기를 돌려준다.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "prompt": {"type": "string", "description": "만들 그림 설명(한국어 가능)"},
            "size": {"type": "string", "default": "1024x1024", "description": "WxH 또는 auto. 예: " + SIZE_EXAMPLES},
            "quality": {"type": "string", "enum": QUALITIES, "default": "low",
                        "description": "low < medium < high < xhigh < max 순으로 비싸다"},
            "model": {"type": "string", "description": "생략하면 기본 모델. 예: gpt-image-2.6-sunburst, gpt-image-2.6-flare, gpt-image-2"},
            "n": {"type": "integer", "minimum": 1, "maximum": 4, "default": 1},
            "background": {"type": "string", "enum": ["auto", "transparent", "opaque"], "default": "auto",
                           "description": "transparent 는 png/webp 에서만"},
            "output_format": {"type": "string", "enum": ["png", "webp", "jpeg"], "default": "png"},
            "reference_images": {"type": "array", "items": {"type": "string"},
                                 "description": "참고 이미지 파일 경로들. 주면 편집 모드(스타일·캐릭터 유지, 합성, 번역). 프롬프트에서 Image 1, Image 2 로 부른다"},
            "input_fidelity": {"type": "string", "enum": ["low", "high"],
                               "description": "편집 시 원본 보존 강도. gpt-image-2 계열은 쓰지 않는다(기본이 고충실도)"},
            "filename": {"type": "string", "description": "파일 이름 앞부분(확장자 없이). 생략하면 시각으로"},
        },
        "required": ["prompt"],
    },
}


def _ssl_context():
    cafile = os.environ.get("SSL_CERT_FILE") or os.environ.get("REQUESTS_CA_BUNDLE")
    return ssl.create_default_context(cafile=cafile) if cafile else ssl.create_default_context()


def _check_size(size):
    if size == "auto":
        return
    m = re.fullmatch(r"(\d+)x(\d+)", size or "")
    if not m:
        raise ValueError(f"size 는 'WxH' 또는 auto. 예: {SIZE_EXAMPLES}")
    w, h = int(m[1]), int(m[2])
    probs = []
    if w % 16 or h % 16:
        probs.append("가로·세로는 16의 배수")
    if max(w, h) >= 3840:
        probs.append("긴 변은 3840 미만")
    if max(w, h) > 3 * min(w, h):
        probs.append("비율은 3:1 이하")
    if not 655_360 <= w * h <= 8_294_400:
        probs.append("픽셀 수 655,360~8,294,400")
    if probs:
        raise ValueError(f"size {size} 불가: " + ", ".join(probs))


def _multipart(fields, files):
    boundary = "----gptimage" + os.urandom(8).hex()
    out = []
    for k, v in fields.items():
        out.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for k, path in files:
        mime = mimetypes.guess_type(path)[0] or "image/png"
        with open(path, "rb") as f:
            data = f.read()
        out.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"; filename="{os.path.basename(path)}"\r\n'
                   f'Content-Type: {mime}\r\n\r\n'.encode() + data + b"\r\n")
    out.append(f"--{boundary}--\r\n".encode())
    return b"".join(out), f"multipart/form-data; boundary={boundary}"


def generate(prompt, size="1024x1024", quality="low", n=1, background="auto", filename=None, model=None,
             output_format="png", reference_images=None, input_fidelity=None):
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY 가 없습니다. platform.openai.com 에서 API 키를 만들어 환경 변수로 넣어 주세요.")
    _check_size(size)
    if quality not in QUALITIES:
        raise ValueError(f"quality 는 {QUALITIES} 중 하나")
    if background == "transparent" and output_format == "jpeg":
        raise ValueError("투명 배경은 png 또는 webp 로만")
    body = {"model": model or MODEL, "prompt": prompt, "size": size, "quality": quality,
            "n": max(1, min(int(n), 4)), "background": background, "output_format": output_format}
    refs = [os.path.expanduser(r) for r in (reference_images or [])]
    for r in refs:
        if not os.path.isfile(r):
            raise ValueError(f"참고 이미지가 없습니다: {r}")
    if refs:
        if input_fidelity:
            body["input_fidelity"] = input_fidelity
        data, ctype = _multipart(body, [("image[]", r) for r in refs])
        url = BASE + "/images/edits"
    else:
        data, ctype = json.dumps(body).encode(), "application/json"
        url = BASE + "/images/generations"
    req = urllib.request.Request(url, data=data, method="POST",
                                 headers={"Authorization": f"Bearer {key}", "Content-Type": ctype})
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
        ext = {"jpeg": "jpg"}.get(output_format, output_format)
        path = os.path.join(OUT_DIR, f"{stem}{'' if i == 0 else f'-{i + 1}'}.{ext}")
        with open(path, "wb") as f:
            f.write(base64.b64decode(b64))
        paths.append(path)
        previews.append(b64)
    if not paths:
        raise RuntimeError(f"이미지가 오지 않았습니다: {json.dumps(data)[:500]}")
    return paths, previews, data.get("usage"), "image/" + output_format


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
            paths, previews, usage, mime = generate(**(params.get("arguments") or {}))
            text = "저장: " + ", ".join(paths) + (f"\n사용량: {json.dumps(usage)}" if usage else "")
            content = [{"type": "text", "text": text}] + [
                {"type": "image", "data": b, "mimeType": mime} for b in previews]
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
    p.add_argument("--size", default="1024x1024")
    p.add_argument("--quality", default="low", choices=QUALITIES)
    p.add_argument("--n", type=int, default=1)
    p.add_argument("--filename")
    p.add_argument("--model")
    p.add_argument("--format", default="png", choices=["png", "webp", "jpeg"])
    p.add_argument("--background", default="auto")
    p.add_argument("--ref", action="append", help="참고 이미지(여러 번 가능)")
    a = p.parse_args(argv)
    paths, _, usage, _ = generate(a.prompt, a.size, a.quality, a.n, a.background, a.filename, a.model,
                                  a.format, a.ref)
    print("\n".join(paths))
    if usage:
        print("usage:", json.dumps(usage), file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--cli":
        cli(sys.argv[2:])
    else:
        serve()
