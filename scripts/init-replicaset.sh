#!/bin/bash
# Inicializa el replica set rs0 de MongoDB de forma automática
set -e

echo "[init-rs] Esperando a que MongoDB responda..."
until mongosh --quiet --eval "db.runCommand('ping').ok" &>/dev/null; do
  sleep 2
done

# Detectar si rs0 ya está configurado
if mongosh --quiet --eval "rs.status().ok" 2>/dev/null; then
  echo "[init-rs] El replica set rs0 ya está inicializado. Verificando configuración..."
  # Si el replica set existe pero las IPs cambiaron, el backend no podrá conectar
  # Aquí se podría añadir lógica de rs.reconfig() si fuera necesario.
  mongosh --quiet --eval "rs.conf().members.forEach(m => print('Miembro actual:', m.host))"
  exit 0
fi

echo "[init-rs] Inicializando replica set rs0 con IPs: $MAQUINA1_IP, $MAQUINA2_IP, $MAQUINA3_IP"

# Construye array members a partir de environment variables pasadas al contenedor
MEMBERS=""
[ -n "$MAQUINA1_IP" ] && MEMBERS="$MEMBERS { _id: 0, host: '$MAQUINA1_IP:27017' }"
[ -n "$MAQUINA2_IP" ] && [ -n "$MEMBERS" ] && MEMBERS="$MEMBERS,"
[ -n "$MAQUINA2_IP" ] && MEMBERS="$MEMBERS { _id: 1, host: '$MAQUINA2_IP:27017' }"
[ -n "$MAQUINA3_IP" ] && [ -n "$MEMBERS" ] && MEMBERS="$MEMBERS,"
[ -n "$MAQUINA3_IP" ] && MEMBERS="$MEMBERS { _id: 2, host: '$MAQUINA3_IP:27017' }"

if [ -z "$MEMBERS" ]; then
  echo "[init-rs] ERROR: No se detectaron IPs (MAQUINA1_IP, etc.)"
  exit 1
fi

mongosh --quiet --eval "
  try {
    rs.initiate({
      _id: 'rs0',
      members: [$MEMBERS]
    });
    print('[init-rs] Configuración enviada exitosamente.');
  } catch (e) {
    print('[init-rs] Error al inicializar: ' + e.message);
  }
"

# Esperar un poco a que se elija un PRIMARY
sleep 5
echo "[init-rs] Estado actual del replica set:"
mongosh --quiet --eval "rs.status().members.forEach(m => print(m.name + ' [' + m.stateStr + ']'))"
