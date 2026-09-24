export type FormatContext = {
  plain: string;
  before?: string;
  after?: string;
};

export type BlockKind = "p" | "h2" | "h3" | "h4";

export function escapeRe(value: string): string {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function injectAround(
  md: string,
  plain: string,
  html: string,
  before?: string,
  after?: string,
): string | null {
  if (!plain) return null;
  if (before || after) {
    const needle = `${before ?? ""}${plain}${after ?? ""}`;
    const index = md.indexOf(needle);
    if (index >= 0 && md.indexOf(needle, index + 1) < 0) {
      const start = index + (before ?? "").length;
      return md.slice(0, start) + html + md.slice(start + plain.length);
    }
  }
  const hits: number[] = [];
  let cursor = 0;
  while ((cursor = md.indexOf(plain, cursor)) >= 0) {
    hits.push(cursor);
    cursor += plain.length;
  }
  if (hits.length !== 1) return null;
  return md.slice(0, hits[0]) + html + md.slice(hits[0] + plain.length);
}

function unwrapOnce(md: string, wrapped: string, inner: string): string | null {
  const hits: number[] = [];
  let cursor = 0;
  while ((cursor = md.indexOf(wrapped, cursor)) >= 0) {
    hits.push(cursor);
    cursor += wrapped.length;
  }
  if (hits.length !== 1) return null;
  return md.slice(0, hits[0]) + inner + md.slice(hits[0] + wrapped.length);
}

export function toggleBold(md: string, ctx: FormatContext): string | null {
  const plain = ctx.plain;
  if (!plain.trim()) return null;
  const wrapped = `**${plain}**`;
  return (
    unwrapOnce(md, wrapped, plain) ??
    injectAround(md, plain, wrapped, ctx.before, ctx.after)
  );
}

export function applyHighlight(md: string, ctx: FormatContext): string | null {
  const plain = ctx.plain;
  if (!plain.trim()) return null;
  const wrapped = `==${plain}==`;
  return (
    unwrapOnce(md, wrapped, plain) ??
    injectAround(md, plain, wrapped, ctx.before, ctx.after)
  );
}

function parseStyle(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  String(raw || "")
    .split(";")
    .forEach((part) => {
      const index = part.indexOf(":");
      if (index < 0) return;
      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      if (key && value) out[key] = value;
    });
  return out;
}

function styleToString(style: Record<string, string>): string {
  return ["color", "font-size", "background", "font-weight"]
    .map((key) => (style[key] ? `${key}:${style[key]}` : ""))
    .filter(Boolean)
    .join(";");
}

export function applyInlineStyle(
  md: string,
  ctx: FormatContext,
  style: Record<string, string>,
): string | null {
  const plain = ctx.plain;
  if (!plain.trim()) return null;
  const re = new RegExp(`<span style="([^"]*)">${escapeRe(plain)}</span>`);
  const match = md.match(re);
  const merged = Object.assign(match ? parseStyle(match[1]) : {}, style);
  const html = `<span style="${styleToString(merged)}">${plain}</span>`;
  if (match) return md.replace(re, html);
  return injectAround(md, plain, html, ctx.before, ctx.after);
}

export function clearInlineFormat(
  md: string,
  ctx: FormatContext,
): string | null {
  const plain = ctx.plain;
  if (!plain.trim()) return null;
  const span = new RegExp(`<span style="[^"]*">${escapeRe(plain)}</span>`);
  if (span.test(md)) return md.replace(span, plain);
  return (
    unwrapOnce(md, `==${plain}==`, plain) ??
    unwrapOnce(md, `**${plain}**`, plain)
  );
}

export function detectBlockKind(line: string): BlockKind {
  if (/^\s*####\s/.test(line)) return "h4";
  if (/^\s*###\s/.test(line)) return "h3";
  if (/^\s*##\s/.test(line)) return "h2";
  return "p";
}

function stripBlockPrefix(line: string): string {
  return line.replace(/^\s*#{1,6}\s+/, "").replace(/^\s*>+\s?/, "");
}

export function applyBlockType(
  md: string,
  lineStart: number,
  lineEnd: number,
  kind: BlockKind,
): string | null {
  const lines = md.split("\n");
  const prefixes: Record<BlockKind, string> = {
    p: "",
    h2: "## ",
    h3: "### ",
    h4: "#### ",
  };
  let changed = false;
  const end = Math.min(lineEnd, lines.length);
  for (let i = lineStart; i < end; i += 1) {
    if (!lines[i].trim()) continue;
    lines[i] = `${prefixes[kind]}${stripBlockPrefix(lines[i])}`;
    changed = true;
    break;
  }
  if (!changed) return null;
  return lines.join("\n");
}

export function hsvToRgb(
  h: number,
  s: number,
  v: number,
): [number, number, number] {
  const hue = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const raw = String(hex || "")
    .replace("#", "")
    .trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export function rgbToHsv(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; v: number } {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === rr) h = 60 * ((gg - bb) / d);
    else if (max === gg) h = 60 * ((bb - rr) / d + 2);
    else h = 60 * ((rr - gg) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max ? d / max : 0, v: max };
}

export function selectionContext(range: Range): FormatContext {
  const plain = range.toString();
  const node =
    range.commonAncestorContainer.nodeType === 1
      ? (range.commonAncestorContainer as Element)
      : range.commonAncestorContainer.parentElement;
  const host = node?.closest("p, li, h2, h3, h4, blockquote, td, section");
  const full = host?.textContent ?? "";
  const pos = full.indexOf(plain);
  return {
    plain,
    before: pos >= 0 ? full.slice(Math.max(0, pos - 12), pos) : "",
    after:
      pos >= 0 ? full.slice(pos + plain.length, pos + plain.length + 12) : "",
  };
}

export function sourceBlockRange(node: Node | null): {
  start: number;
  end: number;
  kind: BlockKind;
} | null {
  const el =
    node && node.nodeType === 1
      ? (node as Element)
      : (node?.parentElement ?? null);
  const host = el?.closest("[data-wemd-source-start]");
  if (!host) return null;
  const start = Number(host.getAttribute("data-wemd-source-start"));
  const end = Number(host.getAttribute("data-wemd-source-end"));
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const tag = host.tagName;
  const kind: BlockKind =
    tag === "H2" ? "h2" : tag === "H3" ? "h3" : tag === "H4" ? "h4" : "p";
  return { start, end, kind };
}
