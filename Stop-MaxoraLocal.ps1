$ports = @(3001,8787)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($connection in $connections) {
        Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "Maxora Local Servers stopped." -ForegroundColor Green
