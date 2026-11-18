$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$logs = Join-Path $root "local-logs"
New-Item -ItemType Directory -Force -Path $logs | Out-Null

$wrangler = Join-Path $env:LOCALAPPDATA "npm-cache\_npx\3ff0d5ec0aa752e6\node_modules\.bin\wrangler.cmd"
$config = Join-Path $root "cloudflare\wrangler.local.toml"
$admin = Join-Path $root "maxora-admin"

if (-not (Test-Path $wrangler)) { throw "Wrangler পাওয়া যায়নি।" }
if (-not (Test-Path (Join-Path $admin "node_modules"))) { throw "Admin dependencies পাওয়া যায়নি।" }

$workerRunning = Get-NetTCPConnection -State Listen -LocalPort 8787 -ErrorAction SilentlyContinue
$adminRunning = Get-NetTCPConnection -State Listen -LocalPort 3001 -ErrorAction SilentlyContinue

if (-not $workerRunning) {
    $workerCommand = "Set-Location '$root'; & '$wrangler' dev --local --config '$config' --ip 127.0.0.1 --port 8787 *> '$logs\worker.log'"
    Start-Process powershell.exe -WindowStyle Hidden -ArgumentList @("-NoProfile","-ExecutionPolicy","Bypass","-Command",$workerCommand)
}

if (-not $adminRunning) {
    $adminCommand = "Set-Location '$admin'; & '.\node_modules\.bin\vite.cmd' --host 127.0.0.1 --port 3001 --strictPort *> '$logs\admin.log'"
    Start-Process powershell.exe -WindowStyle Hidden -ArgumentList @("-NoProfile","-ExecutionPolicy","Bypass","-Command",$adminCommand)
}

Write-Host "Maxora Local Servers starting. Wait 10 seconds, then open http://127.0.0.1:3001/" -ForegroundColor Green
