import { describe, expect, it } from "vitest";
import {
  DITUBANG_COLUMN_IDS,
  buildSkeleton,
  composeDitubangThemeCss,
  ditubangColumns,
  ditubangThemeCss,
  getDitubangColumn,
  nonWechatImageUrls,
  publishingChromeHtml,
} from "./ditubangColumns";

describe("ditubangColumns", () => {
  it("有八个栏目且主色与排版台一致", () => {
    expect(DITUBANG_COLUMN_IDS).toEqual([
      "xinsoucun",
      "kanshijie",
      "daduzhe",
      "hangye",
      "xuanzhi",
      "jili",
      "shujubao",
      "lunwen",
    ]);
    expect(ditubangColumns.xinsoucun.primary).toBe("#ff7b00");
    expect(ditubangColumns.kanshijie.primary).toBe("#1e5a8a");
    expect(ditubangColumns.daduzhe.primary).toBe("#f0900f");
    expect(ditubangColumns.hangye.primary).toBe("#1b1b21");
    expect(ditubangColumns.xuanzhi.primary).toBe("#16a34a");
    expect(ditubangColumns.jili.primary).toBe("#b5443a");
    expect(ditubangColumns.shujubao.primary).toBe("#6d4fc2");
    expect(ditubangColumns.lunwen.primary).toBe("#0e9494");
    expect(ditubangColumns.hangye.enterprise).toBe(true);
    expect(getDitubangColumn("missing").id).toBe("xinsoucun");
  });

  it("皮肤 CSS 用栏目 hex，不含 var(--", () => {
    const css = ditubangThemeCss(ditubangColumns.hangye);
    expect(css).not.toContain("var(--");
    expect(css).toContain("#wemd");
    expect(css).toContain("text-indent: 0");
    expect(css).toContain(ditubangColumns.hangye.primary);
    expect(css).toContain(ditubangColumns.hangye.tag_bg);
    expect(css).toContain(".column-kicker");
  });

  it("骨架只有正文，不含一级标题、YAML 和栏目名 kicker", () => {
    const md = buildSkeleton({
      columnId: "hangye",
      keyword: "咖啡",
      author: "地图帮",
    });
    expect(md).toContain("## 总量榜 vs 密度榜");
    expect(md).toContain("dtbgis.cn");
    expect(md).toContain("后台回复「企业」");
    expect(md).toContain("后台回复「咖啡」");
    expect(md.trimStart().startsWith("# ")).toBe(false);
    expect(md.trimStart().startsWith("---")).toBe(false);
    expect(md).not.toContain("一张地图看行业｜");
    expect(md.split("\n").some((line) => /^#\s+/.test(line))).toBe(false);
  });

  it("新手村骨架走教程 CTA", () => {
    const md = buildSkeleton({ columnId: "xinsoucun", keyword: "上图" });
    expect(md).toContain("## 动手前先懂这一个");
    expect(md).toContain("cloud.dtbgis.com");
    expect(md).toContain("后台回复「上图」");
    expect(md).not.toContain("后台回复「企业」");
  });

  it("预览顶栏 HTML 只含 kicker，永不注入 h1", () => {
    expect(
      publishingChromeHtml({ columnName: "地图新手村", issue: "第3期" }),
    ).toContain("地图新手村｜第3期");
    expect(
      publishingChromeHtml({
        columnName: "地图新手村",
        title: "从表格到地图",
      }),
    ).not.toContain("<h1>");
    expect(publishingChromeHtml({ columnName: "地图新手村" })).not.toContain(
      "<h1>",
    );
  });

  it("组合后的内置 CSS 仍不含 var(--", () => {
    const css = composeDitubangThemeCss("kanshijie");
    expect(css).toContain("#1e5a8a");
    expect(css).not.toContain("var(--");
    expect(css).toContain("#wemd .hljs");
  });

  it("能挑出非微信图床图片", () => {
    expect(
      nonWechatImageUrls(
        "![a](https://mmbiz.qpic.cn/ok.png) ![b](https://example.com/x.png)",
      ),
    ).toEqual(["https://example.com/x.png"]);
  });
});
