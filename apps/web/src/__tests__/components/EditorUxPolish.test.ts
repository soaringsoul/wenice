/// <reference types="node" />

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexCss = readFileSync("src/index.css", "utf8");
const appCss = readFileSync("src/App.css", "utf8");
const appTsx = readFileSync("src/App.tsx", "utf8");
const fileSidebarCss = readFileSync(
  "src/components/Sidebar/FileSidebar.css",
  "utf8",
);
const historyPanelCss = readFileSync(
  "src/components/History/HistoryPanel.css",
  "utf8",
);
const sidebarFooterCss = readFileSync(
  "src/components/Sidebar/SidebarFooter.css",
  "utf8",
);
const errorBoundaryCss = readFileSync(
  "src/components/ErrorBoundary/ErrorBoundary.css",
  "utf8",
);
const updateModalCss = readFileSync(
  "src/components/UpdateModal/UpdateModal.css",
  "utf8",
);

const relativeLuminance = (hex: string) => {
  const channels = hex
    .replace("#", "")
    .match(/.{2}/g)!
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4),
    );

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (foreground: string, background: string) => {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
};

describe("编辑器 UX 视觉校准", () => {
  it("亮色模式主色是地图帮品牌橙，旧强调名只做别名", () => {
    const lightTheme = indexCss.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1];

    expect(lightTheme).toContain("--brand: #fa8c16;");
    expect(lightTheme).toContain("--ui-accent-primary: var(--brand);");
    expect(lightTheme).toContain("--ui-accent-hover: var(--brand-hover);");
    expect(lightTheme).toContain("--ui-accent-active: var(--brand-dark);");
    expect(lightTheme).toContain("--ui-on-accent: #ffffff;");
    // 白底小字橙文本必须用 --brand-heavy 才达 AA
    expect(contrastRatio("#ad4e00", "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("暗色模式只覆盖中性令牌，品牌橙与前景色不变", () => {
    const darkTheme = indexCss.match(
      /\[data-ui-theme="dark"\]\s*\{([\s\S]*?)\n\}/,
    )?.[1];

    expect(darkTheme).not.toContain("--ui-accent-primary");
    expect(darkTheme).not.toContain("--brand:");
    expect(darkTheme).toContain("--surface: #1f1f1f;");
    expect(darkTheme).toContain("--muted: rgba(255, 255, 255, 0.45);");
    expect(contrastRatio("#ffffff", "#1f1f1f")).toBeGreaterThanOrEqual(4.5);
    expect(appTsx).toContain('secondary: "var(--on-accent)"');
  });

  it("强调按钮始终使用主题定义的前景色", () => {
    expect(errorBoundaryCss).toMatch(
      /\.error-boundary-btn\.primary\s*\{[\s\S]*?color:\s*var\(--on-accent, #fff\);/,
    );
    expect(errorBoundaryCss).toMatch(
      /\.error-boundary-btn\.primary:hover\s*\{[\s\S]*?color:\s*var\(--on-accent, #fff\);/,
    );
    expect(updateModalCss).toMatch(
      /\.update-modal-btn\.primary\s*\{[\s\S]*?color:\s*var\(--on-accent, #fff\);/,
    );
    expect(updateModalCss).toMatch(
      /\.update-modal-btn\.primary:hover\s*\{[\s\S]*?color:\s*var\(--on-accent, #fff\);/,
    );
  });

  it("文件栏显隐按钮固定在窗口左侧中线", () => {
    expect(appCss).toMatch(
      /\.history-toggle\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?left:\s*12px;[\s\S]*?top:\s*50%;[\s\S]*?width:\s*28px;[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent;[\s\S]*?box-shadow:\s*none;[\s\S]*?transform:\s*translateY\(-50%\);/,
    );
    expect(appTsx).toContain("ChevronLeft");
    expect(appTsx).toContain("ChevronRight");
    expect(appCss).toMatch(
      /\.history-toggle:focus-visible\s*\{[\s\S]*?box-shadow:\s*var\(--focus-ring\);/,
    );
  });

  it("文件栏关键操作保留清晰的键盘焦点", () => {
    expect(fileSidebarCss).toMatch(
      /\.fs-workspace-info:focus-visible,[\s\S]*?\.fs-sort-option:focus-visible\s*\{[\s\S]*?box-shadow:\s*var\(--focus-ring\);/,
    );
    expect(fileSidebarCss).toMatch(
      /\.fs-quick-actions\s*\{[\s\S]*?justify-content:\s*space-between;/,
    );
  });

  it("车间态侧栏：白底描边容器，选中项浅橙底 + 右缘橙条而不是描边卡片", () => {
    expect(appCss).toMatch(
      /\.history-pane__content\s*\{[\s\S]*?background:\s*var\(--surface\);[\s\S]*?border:\s*1px solid var\(--line\);/,
    );
    expect(fileSidebarCss).toMatch(
      /\.fs-item\.active,[\s\S]*?\.fs-folder\.active\s*\{[\s\S]*?border-color:\s*transparent;[\s\S]*?background:\s*var\(--brand-soft\);[\s\S]*?color:\s*var\(--brand-dark\);[\s\S]*?box-shadow:\s*inset -2px 0 0 var\(--brand\);/,
    );
    expect(historyPanelCss).toMatch(
      /\.history-item\.active\s*\{[\s\S]*?background:\s*var\(--brand-soft\);[\s\S]*?border-color:\s*transparent;[\s\S]*?box-shadow:\s*inset -2px 0 0 var\(--brand\);/,
    );
    expect(sidebarFooterCss).toMatch(
      /\.sidebar-footer\s*\{[\s\S]*?border-top:\s*1px solid var\(--line\);/,
    );
    // 编辑器 / 预览容器：描边卡片，不做 hover 加影
    expect(appCss).toMatch(
      /\.editor-pane,\s*\.preview-pane\s*\{[\s\S]*?border-radius:\s*var\(--radius-md\);[\s\S]*?border:\s*1px solid var\(--line\);/,
    );
    expect(appCss).not.toMatch(/\.editor-pane:hover/);
  });

  it("文件列表滚动条在未悬停时保持可见", () => {
    expect(appCss).toMatch(
      /\.fs-list,[\s\S]*?\.history-list\s*\{[\s\S]*?scrollbar-gutter:\s*stable;[\s\S]*?scrollbar-color:\s*color-mix\(/,
    );
    expect(appCss).toMatch(
      /\.fs-list::-webkit-scrollbar-thumb,[\s\S]*?\.history-list::-webkit-scrollbar-thumb\s*\{[\s\S]*?background:\s*color-mix\(/,
    );
  });

  it("全局反馈提示右上角、卡片圆角、无毛玻璃", () => {
    expect(appTsx).toContain('position="top-right"');
    expect(appTsx).toContain('borderRadius: "var(--radius-md)"');
    expect(appTsx).not.toContain("backdropFilter");
    expect(appTsx).not.toContain('borderRadius: "50px"');
  });
});
