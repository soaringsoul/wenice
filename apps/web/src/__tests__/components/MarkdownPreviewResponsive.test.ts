/// <reference types="node" />

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const previewCss = readFileSync(
  "src/components/Preview/MarkdownPreview.css",
  "utf8",
);

describe("MarkdownPreview responsive layout", () => {
  it("桌面预览用 Raphael 式白圆角卡片，手机画布 480px", () => {
    expect(previewCss).toContain(".preview-stage");
    expect(previewCss).not.toContain("preview-phone__island");
    expect(previewCss).not.toContain("preview-phone__home");
    expect(previewCss).toMatch(
      /\.preview-stage\[data-device=["']phone["']\]\s*\{[\s\S]*?width:\s*min\(480px,\s*100%\);/,
    );
    expect(previewCss).toMatch(
      /\.preview-stage\s*\{[\s\S]*?border-radius:\s*24px;/,
    );
    expect(previewCss).toMatch(
      /\.preview-stage\s*\{[\s\S]*?background:\s*#fff;/,
    );
  });

  it("电脑预览把卡片拉到可用宽度，上限 720px", () => {
    expect(previewCss).toMatch(
      /\.preview-stage\[data-device=["']desktop["']\]\s*\{[\s\S]*?width:\s*min\(720px,\s*100%\);/,
    );
  });

  it("预留稳定的竖向滚动条槽，避免画布在输入时左右抖动", () => {
    expect(previewCss).toMatch(
      /\.preview-stage__screen\s*\{[\s\S]*?scrollbar-gutter:\s*stable\s+both-edges;/,
    );
  });

  it("手机屏内正文宽度足够阅读", () => {
    expect(previewCss).toMatch(
      /\.preview-content\s*\{[\s\S]*?padding:\s*32px\s+28px\s+56px;/,
    );
    expect(480 - 28 * 2).toBeGreaterThanOrEqual(420);
  });

  it("仅移动布局使用容器宽度", () => {
    expect(previewCss).toMatch(
      /@media\s*\(max-width:\s*768px\)[\s\S]*?\.app\[data-layout-mode=["']mobile["']\]\s+\.preview-content\s*\{[\s\S]*?width:\s*100%;/,
    );
  });
});
