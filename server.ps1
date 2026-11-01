# 교안 작업장 로컬 서버
# - 정적 파일 서빙 (index.html, editor.html, present.html, decks/, assets/ ...)
# - 저장 API: 교안(JSON) 저장/삭제/목록, 이미지 업로드
# 실행: start.cmd  또는  powershell -ExecutionPolicy Bypass -File server.ps1
param(
    [int]$Port = 8787,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$DecksDir = Join-Path $Root 'decks'
$AssetsDir = Join-Path $Root 'assets'
$TrashDir = Join-Path $DecksDir '.trash'
foreach ($d in @($DecksDir, $AssetsDir)) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null } }

$Mime = @{
    '.html' = 'text/html; charset=utf-8'; '.htm' = 'text/html; charset=utf-8'
    '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
    '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
    '.md' = 'text/markdown; charset=utf-8'; '.txt' = 'text/plain; charset=utf-8'
    '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.gif' = 'image/gif'
    '.svg' = 'image/svg+xml'; '.webp' = 'image/webp'; '.ico' = 'image/x-icon'; '.bmp' = 'image/bmp'
    '.mp4' = 'video/mp4'; '.webm' = 'video/webm'; '.mp3' = 'audio/mpeg'; '.wav' = 'audio/wav'
    '.woff' = 'font/woff'; '.woff2' = 'font/woff2'; '.ttf' = 'font/ttf'; '.otf' = 'font/otf'
    '.pdf' = 'application/pdf'; '.webmanifest' = 'application/manifest+json'
}

function Send-Bytes($ctx, [int]$status, [string]$type, [byte[]]$bytes) {
    $res = $ctx.Response
    $res.StatusCode = $status
    $res.ContentType = $type
    $res.Headers['Cache-Control'] = 'no-store'
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
    $res.OutputStream.Close()
}
function Send-Text($ctx, [int]$status, [string]$type, [string]$text) {
    Send-Bytes $ctx $status $type ([System.Text.Encoding]::UTF8.GetBytes($text))
}
function Send-Json($ctx, $obj, [int]$status = 200) {
    Send-Text $ctx $status 'application/json; charset=utf-8' (ConvertTo-Json -InputObject $obj -Depth 10 -Compress)
}
function Read-Body($ctx) {
    $ms = New-Object System.IO.MemoryStream
    $ctx.Request.InputStream.CopyTo($ms)
    return $ms.ToArray()
}
function Get-SafeName([string]$name) {
    # 교안 이름: 경로 구분자/제어문자 제거, 확장자 제거
    $n = [Uri]::UnescapeDataString($name)
    $n = $n -replace '\.json$', ''
    $n = $n -replace '[\\/:*?"<>|\x00-\x1f]', '_'
    $n = $n.Trim().Trim('.')
    if ($n.Length -eq 0 -or $n -eq '.trash') { return $null }
    return $n
}
function Get-DeckList {
    $list = @()
    Get-ChildItem -Path $DecksDir -Filter '*.json' -File | Sort-Object LastWriteTime -Descending | ForEach-Object {
        $title = $_.BaseName; $count = 0; $theme = ''
        try {
            $raw = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
            $deck = ConvertFrom-Json $raw
            if ($deck.title) { $title = [string]$deck.title }
            if ($deck.slides) { $count = @($deck.slides).Count }
            if ($deck.theme) { $theme = [string]$deck.theme }
        } catch { }
        $list += [ordered]@{
            name = $_.BaseName; title = $title; slides = $count; theme = $theme
            modified = $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm'); size = $_.Length
        }
    }
    return ,$list
}

function Handle-Request($ctx) {
    $req = $ctx.Request
    $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
    $method = $req.HttpMethod

    # ---------- API ----------
    if ($path -eq '/api/ping') { Send-Json $ctx @{ ok = $true; root = $Root }; return }

    if ($path -eq '/api/decks') {
        if ($method -eq 'GET') { Send-Json $ctx (Get-DeckList); return }
    }
    if ($path -like '/api/decks/*') {
        $name = Get-SafeName ($path.Substring('/api/decks/'.Length))
        if (-not $name) { Send-Json $ctx @{ error = 'bad name' } 400; return }
        $file = Join-Path $DecksDir ($name + '.json')
        switch ($method) {
            'GET' {
                if (-not (Test-Path $file)) { Send-Json $ctx @{ error = 'not found' } 404; return }
                Send-Bytes $ctx 200 'application/json; charset=utf-8' ([System.IO.File]::ReadAllBytes($file)); return
            }
            'PUT' {
                $bytes = Read-Body $ctx
                $text = [System.Text.Encoding]::UTF8.GetString($bytes)
                try { $null = ConvertFrom-Json $text } catch { Send-Json $ctx @{ error = 'invalid json' } 400; return }
                # 직전 버전을 .bak 으로 보관
                if (Test-Path $file) { Copy-Item $file ($file + '.bak') -Force }
                [System.IO.File]::WriteAllText($file, $text, (New-Object System.Text.UTF8Encoding $false))
                Send-Json $ctx @{ ok = $true; name = $name }; return
            }
            'DELETE' {
                if (-not (Test-Path $file)) { Send-Json $ctx @{ error = 'not found' } 404; return }
                if (-not (Test-Path $TrashDir)) { New-Item -ItemType Directory -Path $TrashDir | Out-Null }
                $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
                Move-Item $file (Join-Path $TrashDir ("$name-$stamp.json")) -Force
                if (Test-Path ($file + '.bak')) { Remove-Item ($file + '.bak') -Force }
                Send-Json $ctx @{ ok = $true; trashed = $true }; return
            }
        }
    }
    if ($path -eq '/api/assets') {
        if ($method -eq 'GET') {
            $files = @(Get-ChildItem -Path $AssetsDir -File | Sort-Object LastWriteTime -Descending | ForEach-Object {
                [ordered]@{ name = $_.Name; src = 'assets/' + $_.Name; size = $_.Length }
            })
            Send-Json $ctx $files; return
        }
        if ($method -eq 'POST') {
            $qs = [System.Web.HttpUtility]::ParseQueryString($req.Url.Query)
            $orig = $qs['name']; if (-not $orig) { $orig = 'image.png' }
            $orig = [System.IO.Path]::GetFileName($orig) -replace '[^\w\.\-가-힣]', '_'
            $ext = [System.IO.Path]::GetExtension($orig); $base = [System.IO.Path]::GetFileNameWithoutExtension($orig)
            if ($base.Length -gt 40) { $base = $base.Substring(0, 40) }
            $fname = $base + $ext; $i = 1
            while (Test-Path (Join-Path $AssetsDir $fname)) { $fname = "$base-$i$ext"; $i++ }
            $bytes = Read-Body $ctx
            [System.IO.File]::WriteAllBytes((Join-Path $AssetsDir $fname), $bytes)
            Send-Json $ctx @{ ok = $true; src = 'assets/' + $fname; name = $fname }; return
        }
    }
    if ($path -like '/api/*') { Send-Json $ctx @{ error = 'unknown api' } 404; return }

    # ---------- 정적 파일 ----------
    if ($method -ne 'GET' -and $method -ne 'HEAD') { Send-Text $ctx 405 'text/plain' 'method not allowed'; return }
    $rel = $path.TrimStart('/') -replace '/', '\'
    if ($rel -eq '') { $rel = 'index.html' }
    $full = [System.IO.Path]::GetFullPath((Join-Path $Root $rel))
    if (-not $full.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase)) { Send-Text $ctx 403 'text/plain' 'forbidden'; return }
    if (Test-Path $full -PathType Container) { $full = Join-Path $full 'index.html' }
    if (-not (Test-Path $full -PathType Leaf)) { Send-Text $ctx 404 'text/plain; charset=utf-8' "404: $path"; return }
    $ext = [System.IO.Path]::GetExtension($full).ToLower()
    $type = $Mime[$ext]; if (-not $type) { $type = 'application/octet-stream' }
    Send-Bytes $ctx 200 $type ([System.IO.File]::ReadAllBytes($full))
}

Add-Type -AssemblyName System.Web
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() } catch {
    Write-Host "포트 $Port 를 열 수 없습니다. 이미 실행 중이거나 다른 프로그램이 사용 중입니다." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
Write-Host ""
Write-Host "  교안 작업장 서버 실행 중:  http://localhost:$Port/" -ForegroundColor Green
Write-Host "  폴더: $Root"
Write-Host "  종료: 이 창에서 Ctrl+C  (또는 창 닫기)"
Write-Host ""
if (-not $NoBrowser) { Start-Process "http://localhost:$Port/" }

try {
    while ($listener.IsListening) {
        $task = $listener.GetContextAsync()
        while (-not $task.Wait(250)) { }   # Ctrl+C 를 받을 수 있도록 짧게 대기
        $ctx = $task.Result
        try { Handle-Request $ctx }
        catch {
            Write-Host ("[오류] " + $ctx.Request.HttpMethod + ' ' + $ctx.Request.Url.AbsolutePath + ' : ' + $_.Exception.Message) -ForegroundColor Yellow
            try { Send-Text $ctx 500 'text/plain; charset=utf-8' ("server error: " + $_.Exception.Message) } catch { }
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
