#!/bin/sh
set -e

envsubst '${MAQUINA1_IP} ${MAQUINA2_IP} ${MAQUINA3_IP}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
