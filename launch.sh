#!/usr/bin/env bash
# 地图帮排版台（WeMD / wenice）本地 Web 服务
#
# 用法：
#   ./launch.sh              启动（同 start）
#   ./launch.sh start        启动 Vite 开发服务，默认 http://127.0.0.1:5173/
#   ./launch.sh stop         停止
#   ./launch.sh restart      重启
#   ./launch.sh status       查看状态
#
# 端口可用环境变量覆盖：WEMD_PORT=5180 ./launch.sh start

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

WEB_PORT="${WEMD_PORT:-5173}"
WEB_HOST="${WEMD_HOST:-0.0.0.0}"
PID_FILE="$SCRIPT_DIR/.wenice-web.pid"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/web.log"
NAME="地图帮排版台"

print_urls() {
  echo "[$NAME] 本机    http://127.0.0.1:${WEB_PORT}/"
  ifconfig 2>/dev/null | awk '/inet / {print $2}' | while read -r ip; do
    case "$ip" in
      "" | 127.* | 169.254.* | 198.18.*) continue ;;
    esac
    echo "[$NAME] 局域网  http://${ip}:${WEB_PORT}/"
  done
}

usage() {
  cat <<EOF
用法:
  ./launch.sh              启动 Web 开发服务（局域网可访问）
  ./launch.sh start        同上
  ./launch.sh preview      先构建再托管静态包，适合局域网长期用
  ./launch.sh deploy       构建并发布到 192.168.1.59
  ./launch.sh stop         停止
  ./launch.sh restart      重启
  ./launch.sh status       查看状态与访问地址

同一 Wi-Fi / 局域网里的手机、电脑打开「局域网」那一行地址即可。
复制到公众号在 http 局域网下一般仍可用；若浏览器拦截剪贴板，改用本机 http://127.0.0.1:${WEB_PORT}/。

环境变量:
  WEMD_PORT        端口，默认 5173
  WEMD_HOST        监听地址，默认 0.0.0.0（对局域网开放）
  WEMD_DEPLOY      远程 SSH，默认 soaringsoul@192.168.1.59
  WEMD_DEPLOY_DIR  远程目录，默认 ~/apps/wenice
EOF
}

port_pids() {
  lsof -tiTCP:"$WEB_PORT" -sTCP:LISTEN 2>/dev/null || true
}

is_listening() {
  local pids
  pids="$(port_pids)"
  [ -n "$pids" ]
}

ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    return 0
  fi
  if command -v corepack >/dev/null 2>&1; then
    echo "[$NAME] 启用 corepack pnpm …"
    corepack enable >/dev/null 2>&1 || true
    if command -v pnpm >/dev/null 2>&1; then
      return 0
    fi
  fi
  echo "[$NAME] 找不到 pnpm。请先安装 Node.js 20+ 与 pnpm 9。"
  exit 1
}

ensure_deps() {
  if [ ! -d "$SCRIPT_DIR/node_modules" ] || [ ! -d "$SCRIPT_DIR/apps/web/node_modules" ]; then
    echo "[$NAME] 安装依赖（pnpm install）…"
    pnpm install
  fi
}

wait_ready() {
  local i
  for i in $(seq 1 40); do
    if curl -fsS "http://127.0.0.1:${WEB_PORT}/" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done
  return 1
}

cmd_status() {
  local pids
  pids="$(port_pids)"
  if [ -n "$pids" ]; then
    echo "[$NAME] 运行中  (PID: $(echo "$pids" | tr '\n' ' '))"
    print_urls
    return 0
  fi
  echo "[$NAME] 未运行"
  return 1
}

cmd_stop() {
  local pids pid
  pids="$(port_pids)"
  if [ -z "$pids" ]; then
    echo "[$NAME] 未运行"
    rm -f "$PID_FILE"
    return 0
  fi

  echo "[$NAME] 正在停止 (PID: $(echo "$pids" | tr '\n' ' '))…"
  echo "$pids" | while read -r pid; do
    [ -n "$pid" ] || continue
    kill -TERM "$pid" 2>/dev/null || true
  done

  local waited=0
  while is_listening && [ "$waited" -lt 8 ]; do
    sleep 1
    waited=$((waited + 1))
  done

  pids="$(port_pids)"
  if [ -n "$pids" ]; then
    echo "$pids" | while read -r pid; do
      [ -n "$pid" ] || continue
      kill -KILL "$pid" 2>/dev/null || true
    done
  fi

  rm -f "$PID_FILE"
  echo "[$NAME] 已停止"
}

cmd_start() {
  if is_listening; then
    local pids
    pids="$(port_pids)"
    echo "$pids" | awk 'NF{print; exit}' >"$PID_FILE"
    echo "[$NAME] 已在运行  (PID: $(echo "$pids" | tr '\n' ' '))"
    print_urls
    return 0
  fi

  ensure_pnpm
  ensure_deps
  mkdir -p "$LOG_DIR"

  echo "[$NAME] 正在启动 ${WEB_HOST}:${WEB_PORT} …"
  # 新会话拉起，避免启动脚本退出时把 Vite 一起带走
  /usr/bin/python3 - "$WEB_HOST" "$WEB_PORT" "$LOG_FILE" "$PID_FILE" "$SCRIPT_DIR" <<'PY'
import os
import subprocess
import sys

host, port, log_file, pid_file, cwd = sys.argv[1:6]
os.chdir(cwd)
with open(log_file, "ab", buffering=0) as log:
    proc = subprocess.Popen(
        [
            "pnpm",
            "--filter",
            "@wemd/web",
            "exec",
            "vite",
            "--host",
            host,
            "--port",
            port,
        ],
        stdin=subprocess.DEVNULL,
        stdout=log,
        stderr=log,
        cwd=cwd,
        start_new_session=True,
        env=os.environ.copy(),
    )
with open(pid_file, "w", encoding="utf-8") as handle:
    handle.write(str(proc.pid))
PY

  if wait_ready; then
    echo "[$NAME] 启动成功"
    print_urls
    echo "[$NAME] 日志  $LOG_FILE"
  else
    echo "[$NAME] 启动超时，请查看日志: $LOG_FILE"
    return 1
  fi
}

cmd_preview() {
  if is_listening; then
    echo "[$NAME] ${WEB_PORT} 已被占用，请先 ./launch.sh stop，再 preview"
    cmd_status || true
    return 1
  fi
  ensure_pnpm
  ensure_deps
  mkdir -p "$LOG_DIR"
  echo "[$NAME] 正在构建静态包…"
  pnpm --filter @wemd/web build
  echo "[$NAME] 正在托管静态包 ${WEB_HOST}:${WEB_PORT} …"
  /usr/bin/python3 - "$WEB_HOST" "$WEB_PORT" "$LOG_FILE" "$PID_FILE" "$SCRIPT_DIR" <<'PY'
import os
import subprocess
import sys

host, port, log_file, pid_file, cwd = sys.argv[1:6]
os.chdir(cwd)
with open(log_file, "ab", buffering=0) as log:
    proc = subprocess.Popen(
        [
            "pnpm",
            "--filter",
            "@wemd/web",
            "exec",
            "vite",
            "preview",
            "--host",
            host,
            "--port",
            port,
        ],
        stdin=subprocess.DEVNULL,
        stdout=log,
        stderr=log,
        cwd=cwd,
        start_new_session=True,
        env=os.environ.copy(),
    )
with open(pid_file, "w", encoding="utf-8") as handle:
    handle.write(str(proc.pid))
PY
  if wait_ready; then
    echo "[$NAME] 静态托管成功"
    print_urls
    echo "[$NAME] 日志  $LOG_FILE"
  else
    echo "[$NAME] 启动超时，请查看日志: $LOG_FILE"
    return 1
  fi
}

cmd_deploy() {
  local remote="${WEMD_DEPLOY:-soaringsoul@192.168.1.59}"
  local remote_dir="${WEMD_DEPLOY_DIR:-apps/wenice}"
  ensure_pnpm
  ensure_deps
  echo "[$NAME] 正在构建静态包…"
  pnpm --filter @wemd/web exec vite build
  if [ ! -d "$SCRIPT_DIR/apps/web/dist" ]; then
    echo "[$NAME] 构建失败：找不到 apps/web/dist"
    return 1
  fi
  echo "[$NAME] 同步到 ${remote}:${remote_dir} …"
  ssh "$remote" "mkdir -p ~/${remote_dir}"
  rsync -az --delete "$SCRIPT_DIR/apps/web/dist/" "$remote:~/${remote_dir}/dist/"
  rsync -az "$SCRIPT_DIR/deploy/lan/serve.py" "$SCRIPT_DIR/deploy/lan/launch.sh" "$remote:~/${remote_dir}/"
  ssh "$remote" "chmod +x ~/${remote_dir}/launch.sh ~/${remote_dir}/serve.py && cd ~/${remote_dir} && ./launch.sh restart"
  echo "[$NAME] 已发布  http://192.168.1.59:${WEB_PORT}/"
}

CMD="${1:-start}"
case "$CMD" in
  start | run)
    cmd_start
    ;;
  preview)
    cmd_preview
    ;;
  deploy)
    cmd_deploy
    ;;
  stop)
    cmd_stop
    ;;
  restart)
    cmd_stop
    cmd_start
    ;;
  status)
    cmd_status
    ;;
  -h | --help | help)
    usage
    ;;
  *)
    echo "未知命令：$CMD"
    usage
    exit 1
    ;;
esac
