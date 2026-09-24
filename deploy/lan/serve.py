#!/usr/bin/env python3
"""Serve WeMD static dist on the LAN. SPA fallback + no-cache for service worker."""

from __future__ import annotations

import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "dist"
HOST = os.environ.get("WEMD_HOST", "0.0.0.0")
PORT = int(os.environ.get("WEMD_PORT", "5173"))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        name = Path(self.path.split("?", 1)[0]).name
        if name in {"sw.js", "registerSW.js"}:
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_GET(self) -> None:  # noqa: N802
        req = Path(self.path.split("?", 1)[0])
        target = (ROOT / req.as_posix().lstrip("/")).resolve()
        try:
            target.relative_to(ROOT)
        except ValueError:
            self.send_error(403)
            return
        if not target.exists() and "." not in req.name:
            self.path = "/index.html"
        super().do_GET()

    def log_message(self, format: str, *args) -> None:
        print("[%s] %s" % (self.log_date_time_string(), format % args), flush=True)


if __name__ == "__main__":
    if not ROOT.is_dir():
        raise SystemExit(f"dist 不存在: {ROOT}")
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"地图帮排版台 {ROOT} -> http://{HOST}:{PORT}/", flush=True)
    httpd.serve_forever()
