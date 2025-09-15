#!/bin/bash
set -euo pipefail

APP_NAME="gestor-pxtalk"
PORT=9595

install_deps() {
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
}

case "${1:-}" in
  start)
    install_deps
    NODE_ENV=production npm run build
    pm2 start "npm run preview -- --port ${PORT} --host 0.0.0.0 --strictPort" --name "${APP_NAME}"
    pm2 save
    ;;
  restart)
    install_deps
    NODE_ENV=production npm run build
    pm2 flush "${APP_NAME}" || true
    pm2 restart "${APP_NAME}" --update-env
    ;;
  stop)
    pm2 stop "${APP_NAME}" || true
    ;;
  delete)
    pm2 delete "${APP_NAME}" || true
    ;;
  logs)
    pm2 logs "${APP_NAME}"
    ;;
  *)
    echo "Uso: $0 {start|restart|stop|delete|logs}"
    exit 1
    ;;
esac
