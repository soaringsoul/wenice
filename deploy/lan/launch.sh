#!/usr/bin/env bash
# 在 192.168.1.59 上启停静态托管（由本机 ./launch.sh deploy 同步过来）
set -u
cd "$(cd "$(dirname "$0")" && pwd)" || exit 1

WEB_PORT="${WEMD_PORT:-5173}"
PID_FILE=".wenice-web.pid"
LOG_FILE="web.log"
NAME="地图帮排版台"

port_pids() {
  ss -lptn "sport = :$WEB_PORT" 2>/dev/null | awk -Fpid= 'NR>1{split($2,a,","); print a[1]}' | tr -d ')'
  fuser "${WEB_PORT}/tcp" 2>/dev/null || true
}

is_listening() {
  ss -lnt "sport = :$WEB_PORT" 2>/dev/null | grep -q ":${WEB_PORT}"
}

cmd_start() {
  if is_listening; then
    echo "[$NAME] 已在运行  http://192.168.1.59:${WEB_PORT}/"
    return 0
  fi
  if [ ! -d dist ]; then
    echo "[$NAME] 缺少 dist/，请先在开发机执行 ./launch.sh deploy"
    return 1
  fi
  setsid python3 serve.py >>"$LOG_FILE" 2>&1 </dev/null &
  echo $! >"$PID_FILE"
  sleep 0.8
  if is_listening; then
    echo "[$NAME] 启动成功  http://192.168.1.59:${WEB_PORT}/"
  else
    echo "[$NAME] 启动失败，见 $LOG_FILE"
    return 1
  fi
}

cmd_stop() {
  if [ -f "$PID_FILE" ]; then
    kill "$(cat "$PID_FILE")" 2>/dev/null || true
    rm -f "$PID_FILE"
  fi
  fuser -k "${WEB_PORT}/tcp" 2>/dev/null || true
  echo "[$NAME] 已停止"
}

CMD="${1:-start}"
case "$CMD" in
  start) cmd_start ;;
  stop) cmd_stop ;;
  restart) cmd_stop; cmd_start ;;
  status)
    if is_listening; then echo "[$NAME] 运行中  http://192.168.1.59:${WEB_PORT}/"
    else echo "[$NAME] 未运行"; fi
    ;;
  *) echo "用法: ./launch.sh start|stop|restart|status"; exit 1 ;;
esac
