import { describe, expect, it } from "vitest";
import { buildDitubangThemeCss, ditubangTheme } from "../themes";

describe("ditubang theme", () => {
  it("默认皮肤面向微信复制：无 CSS 变量、段首不缩进", () => {
    expect(ditubangTheme).toContain("#wemd p");
    expect(ditubangTheme).toContain("text-indent: 0");
    expect(ditubangTheme).toContain("#wemd .column-kicker");
    expect(ditubangTheme).toContain("#wemd h2 .content");
    expect(ditubangTheme).not.toContain("var(--");
    expect(ditubangTheme).toContain("#ff7b00");
    expect(ditubangTheme).not.toMatch(/line-height:\s*\d+(?:\.\d+)?\s*;/);
    expect(ditubangTheme).not.toMatch(/#wemd h1 \{[^}]*border-bottom/);
    expect(ditubangTheme).not.toMatch(/#wemd h2 \{[^}]*border-bottom/);
    expect(ditubangTheme).not.toContain("border-left: 3px solid");
    expect(ditubangTheme).not.toMatch(
      /#wemd h3 \.content,\s*#wemd h3 span \{[^}]*border-left:\s*4px/,
    );
    expect(ditubangTheme).not.toMatch(
      /#wemd blockquote \{[^}]*border-left:\s*4px/,
    );
    expect(ditubangTheme).toMatch(/#wemd \.multiquote-1 \{[^}]*border:\s*none/);
    expect(ditubangTheme).not.toMatch(
      /#wemd table tr th,\s*#wemd table tr td \{[^}]*border:\s*1px solid/,
    );
  });

  it("可按栏目色生成已解析的 hex", () => {
    const css = buildDitubangThemeCss({
      primary: "#1b1b21",
      primaryDark: "#111114",
      tagBg: "#E8E8EC",
      quoteBg: "#F4F4F6",
      quoteBorder: "#D8D8DE",
    });
    expect(css).toContain("#1b1b21");
    expect(css).toContain("#E8E8EC");
    expect(css).not.toContain("#ff7b00");
    expect(css).not.toContain("var(--");
  });
});
