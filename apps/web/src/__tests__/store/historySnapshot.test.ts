import { describe, expect, it } from "vitest";
import { hasChanges, isSameSnapshot } from "../../store/historyStore";
import type { HistorySnapshot } from "../../store/historyTypes";

const base = (overrides: Partial<HistorySnapshot> = {}): HistorySnapshot => ({
  id: "1",
  markdown: "## 总量榜 vs 密度榜",
  title: "咖啡地图",
  theme: "ditubang",
  themeName: "地图帮",
  customCSS: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  savedAt: "2026-01-01T00:00:00.000Z",
  columnId: "hangye",
  issue: "第12期",
  ...overrides,
});

describe("HistorySnapshot 发稿字段", () => {
  it("栏目或期号变化视为不同快照", () => {
    const snapshot = base();
    expect(
      isSameSnapshot(snapshot, {
        markdown: snapshot.markdown,
        title: snapshot.title,
        theme: snapshot.theme,
        themeName: snapshot.themeName,
        customCSS: snapshot.customCSS,
        columnId: "hangye",
        issue: "第12期",
      }),
    ).toBe(true);
    expect(
      isSameSnapshot(snapshot, {
        markdown: snapshot.markdown,
        title: snapshot.title,
        theme: snapshot.theme,
        themeName: snapshot.themeName,
        customCSS: snapshot.customCSS,
        columnId: "xinsoucun",
        issue: "第12期",
      }),
    ).toBe(false);
    expect(hasChanges(snapshot, { issue: "第13期" })).toBe(true);
    expect(hasChanges(snapshot, { columnId: "hangye", issue: "第12期" })).toBe(
      false,
    );
  });
});
