# practica-distribuidos

Demo educativa de sistema distribuido: 3 máquinas en LAN, cada una con Nginx + Node.js/Express + MongoDB (replica set). El frontend tiene failover del lado del cliente entre los 3 backends.

## Arquitectura

```
┌─ Cliente ──────────────────────────────────┐
│  Frontend React (build estático)           │
│  api.js prueba 3 IPs hasta encontrar una   │
└──────────┬──────────┬──────────┬───────────┘
           │          │          │
     ┌─────▼──┐ ┌─────▼──┐ ┌─────▼──┐
     │ MÁQ 1  │ │ MÁQ 2  │ │ MÁQ 3  │
     │  :80   │ │  :80   │ │  :80   │
     │ nginx  │ │ nginx  │ │ nginx  │
     │  └─dist│ │  └─dist│ │  └─dist│
     │        │ │        │ │        │
     │ bck:3000│ │ bck:3000│ │ bck:3000│
     │        │ │        │ │        │
     │ mongo  │ │ mongo  │ │ mongo  │
     └───┬────┘ └───┬────┘ └───┬────┘
         └──────────┼──────────┘
                    │
            Replica Set rs0
           (replicación TCP)
```

| Capa | Tecnología | Puerto |
|---|---|---|
| Frontend | React + Vite (build estático) | `:80` — Nginx sirve `dist/` |
| API | Express + Mongoose | `:3000` — cada backend expone su API |
| DB | MongoDB 7.0 | `:27017` — replica set `rs0` entre las 3 máquinas |

## Despliegue por máquina

Cada máquina ejecuta el mismo `docker-compose.yml` diferenciado por `.env`:

```bash
# 1. Clonar el repo en cada máquina
# 2. Crear .env (copiar desde .env.template)

# Máquina 1 (192.168.1.10)
NODE_NAME=Nodo-A-3001
MAQUINA1_IP=192.168.1.10
MAQUINA2_IP=192.168.1.20
MAQUINA3_IP=192.168.1.30

# Máquina 2 (192.168.1.20)
NODE_NAME=Nodo-B-3002
# ... mismas MAQUINA_IPs

# 3. Build frontend y levantar
cd frontend && npm install && npm run build
cd .. && docker-compose up --build
```

## Inicializar replica set (1 vez, desde cualquier nodo)

```bash
docker-compose exec mongo mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: '192.168.1.10:27017' },
    { _id: 1, host: '192.168.1.20:27017' },
    { _id: 2, host: '192.168.1.30:27017' }
  ]
})
"
```

## Failover (client-side)

El frontend (`frontend/src/api.js`) contiene las 3 IPs de los backends. Cada llamada `fetch()` prueba en orden:
1. `http://192.168.1.10:3000/api/...`
2. `http://192.168.1.20:3000/api/...`
3. `http://192.168.1.30:3000/api/...`

Si falla el primero, pasa al siguiente. Esto permite que el sistema funcione aunque 2 de las 3 máquinas estén caídas.

## Tolerancia a fallos

| Fallo | Comportamiento |
|---|---|
| Cae Máquina 1 | Usuario abre Máquina 2 o 3. Frontend prueba IPs hasta encontrar backend vivo. |
| Cae backend2 | Frontend salta a backend1 o backend3. Replica set mantiene datos. |
| Cae mongo2 | Replica set sigue con mongo1 + mongo3. Se re-sincroniza al recuperarse. |

## Modo desarrollo local

```bash
# Backend (requiere MongoDB local)
cd backend; npm install; NODE_NAME=Nodo-Local node server.js

# Frontend (dev mode con proxy a localhost:3000)
cd frontend; npm install; npm run dev
```
