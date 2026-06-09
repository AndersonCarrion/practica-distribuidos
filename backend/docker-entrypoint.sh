#!/bin/sh
set -e

echo "[entrypoint] Esperando a que MongoDB replica set estÃ© listo..."
MAX_RETRIES=30
RETRY_INTERVAL=2

i=0
while [ $i -lt $MAX_RETRIES ]; do
  if node -e "
    const mongoose = require('mongoose');
    async function check() {
      try {
        await mongoose.connect('$MONGO_URI', { serverSelectionTimeoutMS: 3000, connectTimeoutMS: 5000 });
        const admin = mongoose.connection.db.admin();
        const status = await admin.command({ replSetGetStatus: 1 });
        const primary = status.members.find(m => m.stateStr === 'PRIMARY');
        if (primary) {
          console.log('PRIMARY encontrado:', primary.name);
          process.exit(0);
        } else {
          console.log('Replica set presente, pero sin PRIMARY aÃºn');
          process.exit(1);
        }
      } catch (err) {
        console.log('Esperando replica set:', err.message.split('\\n')[0]);
        process.exit(1);
      }
    }
    check();
  " 2>&1; then
    echo "[entrypoint] MongoDB replica set listo (PRIMARY elegido). Iniciando backend..."
    break
  fi
  i=$((i + 1))
  sleep $RETRY_INTERVAL
done

if [ $i -eq $MAX_RETRIES ]; then
  echo "[entrypoint] ADVERTENCIA: No se detectÃ³ PRIMARY en MongoDB. Iniciando de todas formas..."
fi

exec node server.js
