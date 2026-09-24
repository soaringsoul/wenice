import { readFileSync } from "node:fs";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownPreview } from "../../components/Preview/MarkdownPreview";

const editorState = {
  markdown: "只有这个词会出现一次：琥珀金\n",
  setMarkdown: vi.fn(),
};

vi.mock("../../store/editorStore", () => ({
  useEditorStore: Object.assign(
    (selector?: (state: typeof editorState) => unknown) =>
      selector ? selector(editorState) : editorState,
    { getState: () => editorState },
  ),
}));

const themeState = {
  themeId: "default",
  customCSS: "",
  customThemes: [],
  getThemeCSS: () => "#wemd p { color: #333; }",
  getAllThemes: () => [],
};

vi.mock("../../store/themeStore", () => ({
  useThemeStore: (selector?: (state: typeof themeState) => unknown) =>
    selector ? selector(themeState) : themeState,
}));

vi.mock("../../hooks/useUITheme", () => ({
  useUITheme: (selector: (state: { theme: string }) => unknown) =>
    selector({ theme: "light" }),
}));

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}));

describe("预览划词条", () => {
  beforeEach(() => {
    editorState.setMarkdown.mockReset();
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, String(value));
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("DOM 里有正文下拉、加粗、色盘 hex", () => {
    render(<MarkdownPreview />);
    expect(document.getElementById("previewSelBlock")).not.toBeNull();
    expect(document.getElementById("previewSelBold")).not.toBeNull();
    expect(document.getElementById("previewSelHex")).not.toBeNull();
    expect(document.getElementById("previewSvBoard")).not.toBeNull();
  });

  it("划词条是浅色底", () => {
    const css = readFileSync(
      "src/components/Preview/PreviewFormatBar.css",
      "utf8",
    );
    expect(css).toMatch(/\.preview-sel-bar[\s\S]*?background:\s*#fff/);
  });

  it("划中琥珀金后点加粗写回 **", async () => {
    render(<MarkdownPreview />);
    await act(async () => {
      const walker = document.createTreeWalker(
        document.querySelector(".preview-content") as Node,
        NodeFilter.SHOW_TEXT,
      );
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.nodeValue ?? "";
        const i = text.indexOf("琥珀金");
        if (i < 0) continue;
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 3);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.dispatchEvent(new Event("selectionchange"));
        break;
      }
    });
    const bar = document.getElementById("previewSelBar");
    expect(bar?.classList.contains("show")).toBe(true);
    await act(async () => {
      document.getElementById("previewSelBold")?.click();
    });
    expect(editorState.setMarkdown).toHaveBeenCalled();
    const md = editorState.setMarkdown.mock.calls.at(-1)?.[0] as string;
    expect(md).toContain("**琥珀金**");
  });
});
