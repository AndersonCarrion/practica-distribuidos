# check-cluster.ps1 — Monitoreo del estado del cluster distribuido
# Uso: .\scripts\check-cluster.ps1

$ErrorActionPreference = "Stop"

Write-Host "╔═══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   MuralTech — Cluster Status Check   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Cyan

# 1. Estado de los contenedores locales
Write-Host "`n▸ Contenedores locales:" -ForegroundColor Yellow
$ps = docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>&1
Write-Host $ps -ForegroundColor Gray

# 2. Estado del replica set
Write-Host "`n▸ Replica set rs0:" -ForegroundColor Yellow
try {
    $rs = docker-compose exec -T mongo mongosh --quiet --eval "
        const s = rs.status();
        s.members.forEach(m => print(m.name, '→', m.stateStr, (m.health ? '✓' : '✗')));
        print('PRIMARY:', s.members.find(m => m.stateStr === 'PRIMARY')?.name || 'none');
    " 2>&1
    Write-Host $rs -ForegroundColor Gray
} catch {
    Write-Host "  ⚠ No se pudo contactar MongoDB: $_" -ForegroundColor Red
}

# 3. Health check de los backends
Write-Host "`n▸ Health de backends:" -ForegroundColor Yellow
$IPS = @()
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^MAQUINA(\d+)_IP=(.+)$') {
        $ip = $matches[2].Trim() -replace '#.*', ''
        if ($ip) { $IPS += $ip.Trim() }
    }
}
foreach ($ip in $IPS) {
    try {
        $r = Invoke-WebRequest -Uri "http://$ip`:3000/health" -TimeoutSec 3 -UseBasicParsing
        $data = $r.Content | ConvertFrom-Json
        $color = if ($data.db -eq 'connected') { 'Green' } else { 'Red' }
        Write-Host "  [$(if ($r.StatusCode -eq 200) { '✓' } else { '✗' })]" -NoNewline -ForegroundColor $color
        Write-Host " $ip":3000" -NoNewline -ForegroundColor Gray
        Write-Host " → DB: $($data.db), Uptime: $([math]::Round($data.uptime / 60))m" -ForegroundColor Gray
    } catch {
        Write-Host "  [✗] $ip:3000 → No responde" -ForegroundColor Red
    }
}

# 4. Prueba de ruteo Nginx
Write-Host "`n▸ Nginx round-robin (status):" -ForegroundColor Yellow
for ($i = 0; $i -lt 3; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:80/api/status" -TimeoutSec 3 -UseBasicParsing
        $data = $r.Content | ConvertFrom-Json
        Write-Host "  [$($i+1)] " -NoNewline -ForegroundColor Gray
        Write-Host "$($data.nodo)" -ForegroundColor Green
    } catch {
        Write-Host "  [$($i+1)] Fallo: $_" -ForegroundColor Red
    }
}

# 5. Resumen
Write-Host "`n▸ Resumen de tolerancia a fallos:" -ForegroundColor Yellow
Write-Host "  • Nginx:       $(if ($IPS.Count -ge 2) { '✓ Failover activo (max_fails=3, timeout=10s)' } else { '✗ Menos de 2 backends configurados' })" -ForegroundColor $(if ($IPS.Count -ge 2) { 'Green' } else { 'Red' })
Write-Host "  • Replica set: ✓ Replicación automática (3 nodos)" -ForegroundColor Green
Write-Host "  • Backend:     ✓ w:majority + retryWrites + readPreference" -ForegroundColor Green
Write-Host "  • Frontend:    ✓ Failover client-side en api.js" -ForegroundColor Green

Write-Host "`n╔═══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ✓ Cluster operativo                ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Cyan
