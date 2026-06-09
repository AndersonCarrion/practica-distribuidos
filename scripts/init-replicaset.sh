#!/bin/bash
# Inicializa el replica set rs0 de MongoDB
# Uso: docker-compose exec mongo bash /scripts/init-replicaset.sh
#   con FORCE=true reconfigura si ya existe
#   FORCE=true docker-compose exec mongo bash /scripts/init-replicaset.sh

set -e

# Construye array members a partir de environment variables
MEMBERS=""
i=0
for var in MAQUINA1_IP MAQUINA2_IP MAQUINA3_IP; do
  ip="${!var}"
  if [ -n "$ip" ]; then
    [ -n "$MEMBERS" ] && MEMBERS="$MEMBERS,"
    MEMBERS="$MEMBERS{ _id: $i, host: '$ip:27017' }"
    i=$((i + 1))
  fi
done

if [ $i -eq 0 ]; then
  echo "ERROR: Ninguna MAQUINAX_IP definida en el environment."
  exit 1
fi

# Verificar si ya está inicializado
if mongosh --quiet --eval "rs.status().ok" 2>/dev/null | grep -q '^1$'; then
  if [ "${FORCE:-false}" != "true" ]; then
    echo "El replica set rs0 ya está inicializado. Usa FORCE=true para reconfigurar."
    mongosh --quiet --eval "rs.status().members.forEach(m => print(m.name, m.stateStr))"
    exit 0
  fi
  echo "Reconfigurando replica set con IPs del environment..."
  mongosh --quiet --eval "
    cfg = rs.conf();
    cfg.members = [$MEMBERS];
    rs.reconfig(cfg, {force: true})
  "
else
  echo "Inicializando replica set rs0..."
  mongosh --quiet --eval "
    rs.initiate({
      _id: 'rs0',
      members: [$MEMBERS]
    })
  "
fi

echo ""
echo "Estado del replica set:"
mongosh --quiet --eval "rs.status().members.forEach(m => print(m.name, m.stateStr))"
