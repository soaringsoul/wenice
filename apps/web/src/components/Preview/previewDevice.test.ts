import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isPreviewDevice,
  loadPreviewDevice,
  PREVIEW_DEVICE_STORAGE_KEY,
  savePreviewDevice,
} from "./previewDevice";

describe("previewDevice", () => {
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("只接受手机和电脑两种预览尺寸", () => {
    expect(isPreviewDevice("phone")).toBe(true);
    expect(isPreviewDevice("desktop")).toBe(true);
    expect(isPreviewDevice("tablet")).toBe(false);
    expect(isPreviewDevice(null)).toBe(false);
  });

  it("未设置时默认手机预览，写入后能读回电脑预览", () => {
    expect(loadPreviewDevice()).toBe("phone");
    savePreviewDevice("desktop");
    expect(window.localStorage.getItem(PREVIEW_DEVICE_STORAGE_KEY)).toBe(
      "desktop",
    );
    expect(loadPreviewDevice()).toBe("desktop");
  });
});
