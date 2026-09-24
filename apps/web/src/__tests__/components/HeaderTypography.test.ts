/// <reference types="node" />

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const headerCss = readFileSync("src/components/Header/Header.css", "utf8");
const headerSource = readFileSync("src/components/Header/Header.tsx", "utf8");
const stripCss = readFileSync(
  "src/components/Header/PublishingStrip.css",
  "utf8",
);
const themePanelCss = readFileSync(
  "src/components/Theme/ThemePanel.css",
  "utf8",
);

describe("Header 车间态顶栏（03 册 §6）", () => {
  it("56px 白底顶栏，--line 下边线，微影，禁整栏铺橙", () => {
    expect(headerCss).toMatch(
      /\.app-header\s*\{[\s\S]*?height:\s*var\(--topbar-height\);/,
    );
    expect(headerCss).toMatch(
      /\.app-header\s*\{[\s\S]*?background:\s*var\(--surface\);/,
    );
    expect(headerCss).toMatch(
      /\.app-header\s*\{[\s\S]*?border-bottom:\s*1px solid var\(--line\);/,
    );
    expect(headerCss).toMatch(
      /\.app-header\s*\{[\s\S]*?box-shadow:\s*0 1px 2px rgba\(0,\s*0,\s*0,\s*0?\.03\);/,
    );
    expect(headerCss).not.toMatch(/backdrop-filter:\s*blur/);
    expect(headerSource).toContain("<strong>地图帮</strong>");
    expect(headerSource).toContain("<small>排版台</small>");
  });

  it("字标 16px/600，全文件没有 700 字重", () => {
    expect(headerCss).toMatch(
      /\.logo-copy strong\s*\{[\s\S]*?font-size:\s*16px;[\s\S]*?font-weight:\s*600;/,
    );
    expect(headerCss).not.toMatch(/font-weight:\s*(700|800|900|bold)/);
    expect(stripCss).not.toMatch(/font-weight:\s*(700|800|900|bold)/);
  });

  it("一级导航 14px 文字项，hover 中性底，激活态橙字 + 2px 底条", () => {
    expect(headerCss).toMatch(
      /\.header-nav-button\s*\{[\s\S]*?height:\s*var\(--topbar-height\);[\s\S]*?font-size:\s*14px;[\s\S]*?font-weight:\s*400;/,
    );
    expect(headerCss).toMatch(
      /\.header-nav-button:hover[\s\S]*?background:\s*var\(--surface-soft\);/,
    );
    expect(headerCss).toMatch(
      /\.header-nav-button\.is-active\s*\{[\s\S]*?color:\s*var\(--brand-dark\);[\s\S]*?box-shadow:\s*inset 0 -2px 0 var\(--brand\);/,
    );
  });

  it("控件统一 32px 高、6px 圆角，不做 hover/active 位移", () => {
    expect(headerCss).toMatch(
      /\.btn-icon-only,\s*\.btn-ghost\s*\{[\s\S]*?width:\s*var\(--control-h\);[\s\S]*?height:\s*var\(--control-h\);[\s\S]*?border-radius:\s*var\(--radius-sm\);/,
    );
    expect(headerCss).toMatch(
      /\.btn-secondary,\s*\.btn-primary\s*\{[\s\S]*?height:\s*var\(--control-h\);[\s\S]*?border-radius:\s*var\(--radius-sm\);/,
    );
    expect(headerCss).not.toMatch(/transform:\s*translateY\(-?1px\)/);
    expect(headerCss).not.toMatch(/transform:\s*scale\(0?\.9/);
  });

  it("主按钮唯一：品牌橙实心白字，hover 变浅 active 变深；默认钮白底描边", () => {
    expect(headerCss).toMatch(
      /\.btn-primary\s*\{[\s\S]*?border:\s*1px solid var\(--brand\);[\s\S]*?background:\s*var\(--brand\);[\s\S]*?color:\s*#fff;/,
    );
    expect(headerCss).toMatch(
      /\.btn-primary:hover[\s\S]*?background:\s*var\(--brand-hover\);/,
    );
    expect(headerCss).toMatch(
      /\.btn-primary:active[\s\S]*?background:\s*var\(--brand-dark\);/,
    );
    expect(headerCss).toMatch(
      /\.btn-secondary\s*\{[\s\S]*?border:\s*1px solid var\(--border\);[\s\S]*?background:\s*var\(--surface\);[\s\S]*?color:\s*var\(--ink\);/,
    );
    expect(headerCss).toMatch(
      /\.btn-secondary:hover[\s\S]*?border-color:\s*var\(--brand\);[\s\S]*?color:\s*var\(--brand\);/,
    );
    expect(headerCss).not.toMatch(/linear-gradient/);
  });

  it("栏目 / 期号是表单控件：--border 描边，focus 橙边 + 焦点环", () => {
    expect(stripCss).toMatch(
      /\.header-column-select,[\s\S]*?\{[\s\S]*?height:\s*var\(--control-h\);[\s\S]*?border:\s*1px solid var\(--border\);[\s\S]*?border-radius:\s*var\(--radius-sm\);/,
    );
    expect(stripCss).toMatch(
      /:focus-visible\s*\{[\s\S]*?border-color:\s*var\(--brand\);[\s\S]*?box-shadow:\s*var\(--focus-ring\);/,
    );
  });

  it("窄于 992px 时一级设置项收进「更多」下拉，主按钮始终可见", () => {
    expect(headerCss).toMatch(/@media\s*\(max-width:\s*991px\)/);
    expect(headerCss).toMatch(
      /\.header-more__menu\s*\{[\s\S]*?background:\s*var\(--surface\);[\s\S]*?border:\s*1px solid var\(--line\);[\s\S]*?border-radius:\s*var\(--radius-md\);[\s\S]*?box-shadow:\s*var\(--shadow-md\);[\s\S]*?z-index:\s*var\(--z-dropdown\);/,
    );
    expect(headerCss).not.toMatch(
      /\.header-action-primary\s*\{[^}]*display:\s*none/,
    );
  });

  it("主题面板按钮样式不会泄漏并覆盖顶栏操作", () => {
    expect(themePanelCss).not.toMatch(/(?:^|\n)\.btn-(?:secondary|primary)/);
    expect(themePanelCss).toMatch(
      /\.theme-modal \.btn-secondary,\s*\.theme-modal \.btn-primary/,
    );
  });
});
