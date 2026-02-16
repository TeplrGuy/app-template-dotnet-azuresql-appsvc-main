#!/bin/sh
# Substitute environment variables into nginx config at startup
# BACKEND_URL defaults to http://localhost:3000 for local dev
export BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
