#!/bin/bash
# Inicializa el replica set rs0 de MongoDB
# Uso: docker-compose exec mongo bash /scripts/init-replicaset.sh
# O via docker: docker cp scripts/init-replicaset.sh mongo:/ && docker exec mongo bash /init-replicaset.sh

set -e

# Detectar si rs0 ya está configurado
if mongosh --quiet --eval "rs.status().ok" 2>/dev/null; then
  echo "El replica set rs0 ya está inicializado."
  mongosh --quiet --eval "rs.status().members.forEach(m => print(m.name, m.stateStr))"
  exit 0
fi

echo "Inicializando replica set rs0..."

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

mongosh --quiet --eval "
  rs.initiate({
    _id: 'rs0',
    members: [$MEMBERS]
  })
"

echo ""
echo "Estado del replica set:"
mongosh --quiet --eval "rs.status().members.forEach(m => print(m.name, m.stateStr))"
