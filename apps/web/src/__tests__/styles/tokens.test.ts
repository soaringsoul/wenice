/// <reference types="node" />

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexCss = readFileSync("src/index.css", "utf8");
const globalCss = readFileSync("src/styles/global.css", "utf8");

const rootBlock = (css: string, selector: string) => {
  const start = css.indexOf(`${selector} {`);
  expect(start, `${selector} 块不存在`).toBeGreaterThan(-1);
  const end = css.indexOf("\n}", start);
  return css.slice(start, end);
};

describe("地图帮设计令牌（02 册）", () => {
  const root = rootBlock(indexCss, ":root");
  const dark = rootBlock(indexCss, '[data-ui-theme="dark"]');

  it("品牌橙走 Ant orange 阶梯", () => {
    expect(root).toMatch(/--brand:\s*#fa8c16;/);
    expect(root).toMatch(/--brand-hover:\s*#ffa940;/);
    expect(root).toMatch(/--brand-dark:\s*#d46b08;/);
    expect(root).toMatch(/--brand-heavy:\s*#ad4e00;/);
    expect(root).toMatch(/--brand-soft:\s*#fff7e6;/);
    expect(root).toMatch(/--brand-line:\s*#ffd591;/);
    expect(root).toMatch(/--brand-rgb:\s*250,\s*140,\s*22;/);
  });

  it("中性色、圆角、控件高走 Ant 刻度", () => {
    expect(root).toMatch(/--ink:\s*rgba\(0,\s*0,\s*0,\s*0?\.88\);/);
    expect(root).toMatch(/--border:\s*#d9d9d9;/);
    expect(root).toMatch(/--line:\s*#f0f0f0;/);
    expect(root).toMatch(/--surface:\s*#ffffff;/);
    expect(root).toMatch(/--surface-soft:\s*#fafafa;/);
    expect(root).toMatch(/--layout-bg:\s*#f5f5f5;/);
    expect(root).toMatch(/--radius-sm:\s*6px;/);
    expect(root).toMatch(/--radius-md:\s*8px;/);
    expect(root).toMatch(/--radius-lg:\s*12px;/);
    expect(root).toMatch(/--control-h:\s*32px;/);
    expect(root).toMatch(
      /--focus-ring:\s*0 0 0 2px rgba\(250,\s*140,\s*22,\s*0?\.2\);/,
    );
    expect(root).toMatch(/--z-modal:\s*1050;/);
  });

  it("功能色是 Ant 四件套", () => {
    expect(root).toMatch(/--success:\s*#52c41a;/);
    expect(root).toMatch(/--danger:\s*#ff4d4f;/);
    expect(root).toMatch(/--warning:\s*#faad14;/);
    expect(root).toMatch(/--info:\s*#1677ff;/);
  });

  it("翡翠绿、品牌渐变、辉光全部退役", () => {
    for (const css of [indexCss, globalCss]) {
      expect(css).not.toMatch(
        /#047857|#006d3d|#13a072|#15966a|#10b981|#ef4444/i,
      );
      expect(css).not.toMatch(/linear-gradient\(/);
      expect(css).not.toMatch(/gradient-text/);
    }
  });

  it("存量别名只在 :root 指向规范令牌", () => {
    expect(root).toMatch(/--accent-primary:\s*var\(--brand\);/);
    expect(root).toMatch(/--accent-gradient:\s*var\(--brand\);/);
    expect(root).toMatch(/--text-primary:\s*var\(--ink\);/);
    expect(root).toMatch(/--bg-hover:\s*var\(--surface-soft\);/);
    expect(root).toMatch(/--border-light:\s*var\(--line\);/);
    // global.css 不再自己声明一套别名
    expect(globalCss).not.toMatch(
      /--accent-primary:\s*var\(--ui-accent-primary\)/,
    );
  });

  it("暗色只覆盖令牌值，品牌橙不变", () => {
    expect(dark).toMatch(/--layout-bg:\s*#141414;/);
    expect(dark).toMatch(/--surface:\s*#1f1f1f;/);
    expect(dark).toMatch(/--surface-soft:\s*#262626;/);
    expect(dark).toMatch(/--ink:\s*rgba\(255,\s*255,\s*255,\s*0?\.85\);/);
    expect(dark).toMatch(/--border:\s*#424242;/);
    expect(dark).toMatch(/--line:\s*#303030;/);
    expect(dark).not.toMatch(/--brand:/);
    expect(dark).not.toMatch(/--accent-primary:/);
    expect(dark).not.toMatch(/--radius/);
  });

  it("字体是系统栈，不再依赖 Space Grotesk", () => {
    expect(root).toMatch(
      /--font-sans:[^;]*"PingFang SC"[^;]*"Microsoft YaHei"/,
    );
    expect(globalCss).not.toMatch(/Space Grotesk/);
  });

  it("焦点用 --focus-ring 而不是裸删 outline", () => {
    expect(globalCss).not.toMatch(/button\s*\{[^}]*outline:\s*none/);
    expect(globalCss).toMatch(/:focus-visible\s*\{[^}]*var\(--focus-ring\)/);
  });
});
