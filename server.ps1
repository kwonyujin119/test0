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
    '.m4v' = 'video/mp4'; '.mov' = 'video/quicktime'; '.ogv' = 'video/ogg'; '.ogg' = 'audio/ogg'; '.m4a' = 'audio/mp4'
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
# 큰 파일(동영상 등): 통째로 읽지 않고 흘려보냄. 원하는 구간만 보내기(Range)를 지원 → 재생 위치 이동·구간 재생이 됨.
# 보내는 일은 뒤에서 하고 바로 다음 요청을 받음 → 동영상을 틀어 놓아도 저장·다른 화면이 멈추지 않음.
$script:Sending = New-Object System.Collections.ArrayList
function Close-Sending($s) {
    try { $s.fs.Close() } catch { }
    try { $s.res.Close() } catch { try { $s.res.Abort() } catch { } }
}
function Sweep-Sending {
    for ($i = $script:Sending.Count - 1; $i -ge 0; $i--) {
        $s = $script:Sending[$i]
        if ($s.task.IsCompleted) { Close-Sending $s; $script:Sending.RemoveAt($i) }
    }
    while ($script:Sending.Count -gt 24) { $s = $script:Sending[0]; try { $s.res.Abort() } catch { }; try { $s.fs.Close() } catch { }; $script:Sending.RemoveAt(0) }   # 멈춰 선 연결이 쌓이지 않게
}
function Send-File($ctx, [string]$full, [string]$type, [long]$len, [string]$range, [bool]$headOnly) {
    $res = $ctx.Response
    [long]$start = 0; [long]$end = $len - 1; $partial = $false
    if ($range -match '^\s*bytes=(\d*)-(\d*)\s*$') {
        $a = $Matches[1]; $b = $Matches[2]
        if ($a -ne '') { $start = [long]$a; if ($b -ne '') { $end = [Math]::Min([long]$b, $len - 1) } }
        elseif ($b -ne '') { $start = [Math]::Max([long]0, $len - [long]$b) }
        if ($a -eq '' -and $b -eq '') { $start = 0 }
        elseif ($start -gt $end -or $start -ge $len) {
            $res.StatusCode = 416; $res.Headers['Content-Range'] = "bytes */$len"; $res.Close(); return
        }
        else { $partial = $true }
    }
    [long]$count = $end - $start + 1
    if ($count -gt 1MB -and $end -lt ($len - 1)) { $end = $len - 1; $count = $end - $start + 1 }   # 큰 구간은 끝까지 흘려보냄
    $res.StatusCode = $(if ($partial) { 206 } else { 200 })
    $res.ContentType = $type
    $res.Headers['Accept-Ranges'] = 'bytes'
    $res.Headers['Cache-Control'] = 'no-store'
    if ($partial) { $res.Headers['Content-Range'] = "bytes $start-$end/$len" }
    $res.ContentLength64 = $count
    if ($headOnly -or $count -le 0) { $res.Close(); return }
    $share = [System.IO.FileShare]::ReadWrite -bor [System.IO.FileShare]::Delete
    $fs = New-Object System.IO.FileStream($full, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, $share, 81920, $true)
    [void]$fs.Seek($start, [System.IO.SeekOrigin]::Begin)
    if ($count -le 1MB) {
        try {
            $buf = New-Object byte[] $count; $n = 0
            while ($n -lt $count) { $r = $fs.Read($buf, $n, $count - $n); if ($r -le 0) { break }; $n += $r }
            $res.OutputStream.Write($buf, 0, $n)
        } finally { $fs.Close(); try { $res.OutputStream.Close() } catch { } }
        return
    }
    $task = $fs.CopyToAsync($res.OutputStream, 81920)
    [void]$script:Sending.Add(@{ task = $task; fs = $fs; res = $res })
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
    $n = $name   # 주소는 Handle-Request 에서 이미 한 번 풀었음 (두 번 풀면 '50%50' 같은 제목이 다른 이름이 됨)
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
    $path = [Uri]::UnescapeDataString(($req.RawUrl -split '\?')[0])   # 보낸 주소 그대로를 한 번만 풂 (Url.AbsolutePath 는 %25 를 미리 풀어 '50%50' 같은 이름이 깨짐)
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
    if (-not ($full + '\').StartsWith($Root.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) { Send-Text $ctx 403 'text/plain' 'forbidden'; return }
    if (Test-Path $full -PathType Container) { $full = Join-Path $full 'index.html' }
    if (-not (Test-Path $full -PathType Leaf)) { Send-Text $ctx 404 'text/plain; charset=utf-8' "404: $path"; return }
    $ext = [System.IO.Path]::GetExtension($full).ToLower()
    $type = $Mime[$ext]; if (-not $type) { $type = 'application/octet-stream' }
    $len = (New-Object System.IO.FileInfo($full)).Length
    $range = $req.Headers['Range']
    if ($len -lt 1MB -and -not $range) { Send-Bytes $ctx 200 $type ([System.IO.File]::ReadAllBytes($full)); return }
    Send-File $ctx $full $type $len $range ($method -eq 'HEAD')
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
        while (-not $task.Wait(250)) { Sweep-Sending }   # Ctrl+C 를 받을 수 있도록 짧게 대기 · 다 보낸 큰 파일 정리
        $ctx = $task.Result
        try { Handle-Request $ctx }
        catch {
            Write-Host ("[오류] " + $ctx.Request.HttpMethod + ' ' + $ctx.Request.Url.AbsolutePath + ' : ' + $_.Exception.Message) -ForegroundColor Yellow
            try { Send-Text $ctx 500 'text/plain; charset=utf-8' ("server error: " + $_.Exception.Message) } catch { }
        }
        Sweep-Sending
    }
} finally {
    foreach ($s in @($script:Sending)) { Close-Sending $s }
    $listener.Stop()
    $listener.Close()
}
