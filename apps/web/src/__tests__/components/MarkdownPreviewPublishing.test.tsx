import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownPreview } from "../../components/Preview/MarkdownPreview";
import { useEditorStore } from "../../store/editorStore";
import { usePublishingStore } from "../../store/publishingStore";
import { useThemeStore } from "../../store/themeStore";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}));

describe("MarkdownPreview 发稿顶栏", () => {
  beforeEach(() => {
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
    useEditorStore.setState({ markdown: "## 总量榜 vs 密度榜\n\n正文" });
    usePublishingStore.setState({
      title: "咖啡地图",
      columnId: "hangye",
      issue: "第12期",
    });
    useThemeStore.getState().selectTheme("ditubang");
  });

  afterEach(() => {
    usePublishingStore.getState().reset();
    useThemeStore.getState().selectTheme("default");
    vi.unstubAllGlobals();
  });

  it("给定栏目时预览有 kicker，不注入标题 h1，源码不含栏名", async () => {
    render(<MarkdownPreview />);

    await waitFor(() => {
      expect(document.querySelector(".column-kicker")?.textContent).toBe(
        "一张地图看行业｜第12期",
      );
    });

    expect(document.querySelector(".preview-stage")).toHaveAttribute(
      "data-device",
      "phone",
    );
    expect(document.querySelector("h1 .content")?.textContent).not.toBe(
      "咖啡地图",
    );
    const kicker = document.querySelector(".column-kicker") as HTMLElement;
    expect(kicker.hasAttribute("data-wemd-source-start")).toBe(false);
    const mdSource = useEditorStore.getState().markdown;
    expect(mdSource).not.toContain("一张地图看行业");
    expect(mdSource).not.toContain("咖啡地图");
    expect(mdSource).not.toMatch(/^# /m);
  });

  it("切换栏目后预览色跟随栏目主色", async () => {
    render(<MarkdownPreview />);
    await waitFor(() => {
      expect(
        document.querySelector(".preview-content style")?.textContent,
      ).toContain("#1b1b21");
    });

    act(() => {
      usePublishingStore.getState().setColumn("xinsoucun");
    });

    await waitFor(() => {
      expect(
        document.querySelector(".preview-content style")?.textContent,
      ).toContain("#ff7b00");
      expect(document.querySelector(".column-kicker")?.textContent).toBe(
        "地图新手村｜第12期",
      );
    });
  });

  it("预览区可在手机与电脑画布之间切换", async () => {
    render(<MarkdownPreview />);

    await waitFor(() => {
      expect(document.querySelector(".preview-stage")).toHaveAttribute(
        "data-device",
        "phone",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "电脑预览" }));
    expect(document.querySelector(".preview-stage")).toHaveAttribute(
      "data-device",
      "desktop",
    );
    expect(screen.getByRole("button", { name: "电脑预览" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "手机预览" }));
    expect(document.querySelector(".preview-stage")).toHaveAttribute(
      "data-device",
      "phone",
    );
  });
});
