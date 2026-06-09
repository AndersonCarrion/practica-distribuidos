# Inicializa el replica set rs0 de MongoDB
# Uso: .\scripts\init-replicaset.ps1
# Ejecutar desde la raíz del proyecto (donde está docker-compose.yml y .env)

$ErrorActionPreference = "Stop"

Write-Host "Verificando estado actual del replica set..." -ForegroundColor Cyan
try {
    $status = docker-compose exec -T mongo mongosh --quiet --eval "rs.status().ok" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "El replica set rs0 ya está inicializado." -ForegroundColor Green
        docker-compose exec mongo mongosh --quiet --eval "rs.status().members.forEach(m => print(m.name, m.stateStr))"
        exit 0
    }
} catch {
    # Si falla, es porque no está inicializado — continuamos
}

# Leer .env
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Error "No se encuentra .env en la raíz del proyecto"
    exit 1
}

Write-Host "Inicializando replica set rs0..." -ForegroundColor Cyan

$ips = @()
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^MAQUINA(\d+)_IP=(.+)$') {
        $ip = $matches[2].Trim()
        # Quitar comentarios inline
        if ($ip -match '^([^#]+)') {
            $ip = $matches[1].Trim()
        }
        if ($ip -ne '') {
            $ips += $ip
        }
    }
}

if ($ips.Count -eq 0) {
    Write-Error "No hay MAQUINAX_IP definidas en .env"
    exit 1
}

$members = @()
for ($i = 0; $i -lt $ips.Count; $i++) {
    $members += "{ _id: $i, host: '$($ips[$i]):27017' }"
}
$membersStr = $members -join ", "

Write-Host "Miembros del replica set:" -ForegroundColor Yellow
$ips | ForEach-Object { Write-Host "  $_ :27017" }

$command = "rs.initiate({ _id: 'rs0', members: [ $membersStr ] })"
Write-Host "Ejecutando: $command" -ForegroundColor DarkGray

docker-compose exec mongo mongosh --quiet --eval $command

Write-Host "" -ForegroundColor Yellow
Write-Host "Estado del replica set:" -ForegroundColor Cyan
docker-compose exec mongo mongosh --quiet --eval "rs.status().members.forEach(m => print(m.name, m.stateStr))"
