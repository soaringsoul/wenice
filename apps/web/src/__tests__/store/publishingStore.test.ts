import { describe, expect, it } from "vitest";
import {
  applyPublishingSnapshot,
  usePublishingStore,
} from "../../store/publishingStore";

describe("publishingStore", () => {
  it("切换栏目并水合标题与期号", () => {
    usePublishingStore.getState().reset();
    usePublishingStore.getState().setColumn("hangye");
    usePublishingStore.getState().setTitle("咖啡地图");
    usePublishingStore.getState().setIssue("第12期");

    expect(usePublishingStore.getState().columnId).toBe("hangye");
    expect(usePublishingStore.getState().title).toBe("咖啡地图");
    expect(usePublishingStore.getState().issue).toBe("第12期");

    applyPublishingSnapshot({
      title: "未命名文章",
      columnId: "lunwen",
      issue: "急诊",
    });
    expect(usePublishingStore.getState().title).toBe("");
    expect(usePublishingStore.getState().columnId).toBe("lunwen");
    expect(usePublishingStore.getState().issue).toBe("急诊");

    usePublishingStore.getState().reset();
    expect(usePublishingStore.getState().columnId).toBe("xinsoucun");
  });
});
