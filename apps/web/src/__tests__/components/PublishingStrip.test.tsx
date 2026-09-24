import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublishingStrip } from "../../components/Header/PublishingStrip";
import { useEditorStore } from "../../store/editorStore";
import { usePublishingStore } from "../../store/publishingStore";
import { useThemeStore } from "../../store/themeStore";

const persistActiveSnapshot = vi.fn();
const saveSnapshot = vi.fn();
const setActiveId = vi.fn();

vi.mock("../../store/historyStore", () => ({
  useHistoryStore: Object.assign(
    (selector?: (state: Record<string, unknown>) => unknown) => {
      const state = {
        persistActiveSnapshot,
        saveSnapshot,
        setActiveId,
        activeId: "article-1",
      };
      return selector ? selector(state) : state;
    },
    {
      getState: () => ({
        persistActiveSnapshot,
        saveSnapshot,
        setActiveId,
        activeId: "article-1",
      }),
    },
  ),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("PublishingStrip", () => {
  beforeEach(() => {
    persistActiveSnapshot.mockReset();
    saveSnapshot.mockReset();
    setActiveId.mockReset();
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
    usePublishingStore.getState().reset();
    useEditorStore.setState({ markdown: "已有正文" });
    useThemeStore.getState().selectTheme("default");
  });

  afterEach(() => {
    usePublishingStore.getState().reset();
    vi.unstubAllGlobals();
  });

  it("只有栏目和期号，没有单独的标题输入", () => {
    render(<PublishingStrip />);
    expect(screen.getByLabelText("栏目")).toBeInTheDocument();
    expect(screen.getByLabelText("期号")).toBeInTheDocument();
    expect(screen.queryByLabelText("标题")).not.toBeInTheDocument();
  });

  it("选栏目会切到地图帮主题", () => {
    render(<PublishingStrip />);
    fireEvent.change(screen.getByLabelText("栏目"), {
      target: { value: "hangye" },
    });
    expect(usePublishingStore.getState().columnId).toBe("hangye");
    expect(useThemeStore.getState().themeId).toBe("ditubang");
  });

  it("排骨架写入正文且不含一级标题，弹窗也没有主标题", async () => {
    render(<PublishingStrip />);
    fireEvent.click(screen.getByRole("button", { name: "排骨架" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getAllByRole("combobox")[0], {
      target: { value: "hangye" },
    });
    expect(
      within(dialog).queryByPlaceholderText("预览里的 H1，不进 Markdown"),
    ).not.toBeInTheDocument();
    expect(within(dialog).queryByText("主标题")).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "覆盖当前" }));

    await waitFor(() => {
      expect(useEditorStore.getState().markdown).toContain(
        "## 总量榜 vs 密度榜",
      );
    });
    expect(useEditorStore.getState().markdown).not.toMatch(/^# /m);
    expect(useThemeStore.getState().themeId).toBe("ditubang");
  });

  it("桌面预览按钮可切换", () => {
    const onTogglePreview = vi.fn();
    render(
      <PublishingStrip
        showPreviewToggle
        previewOnly={false}
        onTogglePreview={onTogglePreview}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "预览" }));
    expect(onTogglePreview).toHaveBeenCalled();
  });
});
