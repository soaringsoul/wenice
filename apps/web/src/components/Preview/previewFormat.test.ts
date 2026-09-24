import { describe, expect, it } from "vitest";
import {
  applyBlockType,
  applyHighlight,
  applyInlineStyle,
  detectBlockKind,
  hsvToRgb,
  rgbToHex,
  toggleBold,
} from "./previewFormat";

const unique = "只有这个词会出现一次：琥珀金\n";

describe("previewFormat", () => {
  it("加粗把唯一选中词写成 Markdown **", () => {
    const next = toggleBold(unique, { plain: "琥珀金" });
    expect(next).toBe("只有这个词会出现一次：**琥珀金**\n");
  });

  it("再点一次加粗会拆掉 **", () => {
    const next = toggleBold("只有这个词会出现一次：**琥珀金**\n", {
      plain: "琥珀金",
    });
    expect(next).toBe("只有这个词会出现一次：琥珀金\n");
  });

  it("把段落切成二级标题", () => {
    const next = applyBlockType(unique, 0, 1, "h2");
    expect(next?.trimStart().startsWith("## ")).toBe(true);
    expect(next).toContain("琥珀金");
  });

  it("从二级标题识别块类型", () => {
    expect(detectBlockKind("## 小节")).toBe("h2");
    expect(detectBlockKind("正文一句")).toBe("p");
  });

  it("颜色写成 span style", () => {
    const next = applyInlineStyle(
      unique,
      { plain: "琥珀金" },
      {
        color: "rgb(41, 41, 232)",
      },
    );
    expect(next).toContain(
      '<span style="color:rgb(41, 41, 232)">琥珀金</span>',
    );
  });

  it("高亮写成 ==标记==", () => {
    const next = applyHighlight(unique, { plain: "琥珀金" });
    expect(next).toBe("只有这个词会出现一次：==琥珀金==\n");
  });

  it("HSV 能算出可写进 hex 的颜色", () => {
    const [r, g, b] = hsvToRgb(240, 1, 0.91);
    expect(rgbToHex(r, g, b)).toMatch(/^#[0-9a-f]{6}$/);
  });
});
