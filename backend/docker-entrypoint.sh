#!/bin/sh
set -e

echo "[entrypoint] Verificando conexion a MongoDB..."

# URI con directConnection=true para forzar modo standalone
# (sin esto, el driver Node.js v6+ detecta isreplicaset:true y cambia a topologia RS,
#  pero como rs0 no esta iniciado, no encuentra PRIMARY y server selection falla)
DIRECT_URI="mongodb://mongo:27017/muraltech?directConnection=true"

# ========== Inicializar replica set si no existe ==========
node -e "
  const mongoose = require('mongoose');
  async function init() {
    try {
      await mongoose.connect('$DIRECT_URI', { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
      const admin = mongoose.connection.db.admin();
      try {
        await admin.command({ replSetGetStatus: 1 });
        console.log('[entrypoint] Replica set ya inicializado.');
        process.exit(0);
      } catch (e) {
        if (e.codeName === 'NotYetInitialized' || e.codeName === 'NoReplicationEnabled') {
          // ── Paso 1: Iniciar con solo el nodo local ──
          const membersStr = '$REPLICA_MEMBERS';
          const allHosts = membersStr.split(',').filter(function(h) { return h.trim() !== ''; });
          const localHost = allHosts[0];
          console.log('[entrypoint] Inicializando rs0 con nodo local:', localHost);
          try {
            await admin.command({
              replSetInitiate: {
                _id: 'rs0',
                members: [{ _id: 0, host: localHost.trim() }]
              }
            });
            console.log('[entrypoint] rs.initiate() local ejecutado.');
          } catch (e2) {
            if (e2.codeName === 'AlreadyInitialized') {
              console.log('[entrypoint] Replica set ya inicializado (por otro nodo).');
              process.exit(0);
            }
            throw e2;
          }
          // ── Paso 2: Agregar miembros remotos uno por uno ──
          // rs.add() es un helper de mongosh; desde el driver se usa replSetReconfig
          for (var i = 1; i < allHosts.length; i++) {
            var host = allHosts[i].trim();
            if (!host) continue;
            try {
              var cfg = await admin.command({ replSetGetConfig: 1 });
              var nextId = cfg.config.members.length;
              cfg.config.members.push({ _id: nextId, host: host });
              cfg.config.version = (cfg.config.version || 0) + 1;
              await admin.command({ replSetReconfig: cfg.config, force: true });
              console.log('[entrypoint] Miembro agregado:', host);
            } catch (e3) {
              console.log('[entrypoint] No se pudo agregar ' + host + ':', e3.message.split('\\n')[0]);
            }
          }
          process.exit(0);
        } else if (e.codeName === 'AlreadyInitialized') {
          console.log('[entrypoint] Replica set ya inicializado (por otro nodo).');
          process.exit(0);
        } else {
          throw e;
        }
      }
      process.exit(0);
    } catch (err) {
      console.log('[entrypoint] No se pudo inicializar replica set:', err.message.split('\\n')[0]);
      process.exit(1);
    }
  }
  init();
" 2>&1 || echo "[entrypoint] Advertencia: No se pudo inicializar el replica set (otro nodo pudo haberlo iniciado)."

# ========== Esperar a que haya un PRIMARY ==========
echo "[entrypoint] Esperando a que MongoDB replica set este listo..."
MAX_RETRIES=30
RETRY_INTERVAL=2

i=0
while [ $i -lt $MAX_RETRIES ]; do
  if node -e "
    const mongoose = require('mongoose');
    async function check() {
      try {
        await mongoose.connect('$DIRECT_URI', { serverSelectionTimeoutMS: 3000, connectTimeoutMS: 5000 });
        const admin = mongoose.connection.db.admin();
        const status = await admin.command({ replSetGetStatus: 1 });
        const primary = status.members.find(function(m) { return m.stateStr === 'PRIMARY'; });
        if (primary) {
          console.log('PRIMARY encontrado:', primary.name);
          process.exit(0);
        } else {
          console.log('Replica set presente, pero sin PRIMARY aun');
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
  echo "[entrypoint] ADVERTENCIA: No se detecto PRIMARY en MongoDB. Iniciando de todas formas..."
fi

exec node server.js
