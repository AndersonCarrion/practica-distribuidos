# Inicializa el replica set rs0 de MongoDB
# Uso: .\scripts\init-replicaset.ps1 [-Force]
#   -Force: si ya existe, reconfigura con las IPs del .env (rs.reconfig)

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

function Get-MaquinaIPs {
    param([string]$EnvFile = ".env")
    $ips = @()
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^MAQUINA(\d+)_IP=(.+)$') {
            $ip = ($matches[2].Trim() -replace '#.*', '').Trim()
            if ($ip) { $ips += $ip }
        }
    }
    return $ips
}

function Build-MembersStr {
    param([string[]]$Ips)
    $members = @()
    for ($i = 0; $i -lt $Ips.Count; $i++) {
        $members += "{ _id: $i, host: '$($Ips[$i]):27017' }"
    }
    return $members -join ", "
}

$ips = Get-MaquinaIPs
if ($ips.Count -eq 0) {
    Write-Error "No hay MAQUINAX_IP definidas en .env"
    exit 1
}

$membersStr = Build-MembersStr $ips

Write-Host "Miembros del replica set:" -ForegroundColor Yellow
$ips | ForEach-Object { Write-Host "  $_ :27017" }

# Verificar si ya está inicializado capturando la salida real
Write-Host "`nVerificando estado actual del replica set..." -ForegroundColor Cyan
try {
    $statusOutput = docker-compose exec -T mongo mongosh --quiet --eval "rs.status().ok" 2>&1
    if ($statusOutput -match '^\s*1\s*$') {
        if (-not $Force) {
            Write-Host "El replica set rs0 ya está inicializado. Usa -Force para reconfigurar." -ForegroundColor Green
            docker-compose exec mongo mongosh --quiet --eval "rs.status().members.forEach(m => print(m.name, m.stateStr))"
            exit 0
        }
        Write-Host "Reconfigurando replica set con IPs del .env..." -ForegroundColor Cyan
        $command = "cfg = rs.conf(); cfg.members = [ $membersStr ]; rs.reconfig(cfg, {force: true})"
        Write-Host "Ejecutando: $command" -ForegroundColor DarkGray
        docker-compose exec mongo mongosh --quiet --eval $command
    } else {
        # No inicializado — hacer initiate
        Write-Host "Inicializando replica set rs0..." -ForegroundColor Cyan
        $command = "rs.initiate({ _id: 'rs0', members: [ $membersStr ] })"
        Write-Host "Ejecutando: $command" -ForegroundColor DarkGray
        docker-compose exec mongo mongosh --quiet --eval $command
    }
} catch {
    # Si falla el comando, asumimos que no está inicializado
    Write-Host "Inicializando replica set rs0 (no detectado)..." -ForegroundColor Cyan
    $command = "rs.initiate({ _id: 'rs0', members: [ $membersStr ] })"
    Write-Host "Ejecutando: $command" -ForegroundColor DarkGray
    docker-compose exec mongo mongosh --quiet --eval $command
}

Write-Host "`nEstado del replica set:" -ForegroundColor Cyan
docker-compose exec mongo mongosh --quiet --eval "rs.status().members.forEach(m => print(m.name, m.stateStr))"
