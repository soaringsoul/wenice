export type PreviewDevice = "phone" | "desktop";

export const PREVIEW_DEVICE_STORAGE_KEY = "wemd-preview-device";
/** Raphael 手机预览宽度：模拟微信阅读画布 */
export const PREVIEW_PHONE_WIDTH = 480;
/** 电脑预览画布上限，接近公众号后台正文栏 */
export const PREVIEW_DESKTOP_MAX_WIDTH = 720;

export function isPreviewDevice(value: string | null): value is PreviewDevice {
  return value === "phone" || value === "desktop";
}

export function loadPreviewDevice(): PreviewDevice {
  try {
    const stored = window.localStorage.getItem(PREVIEW_DEVICE_STORAGE_KEY);
    if (isPreviewDevice(stored)) return stored;
  } catch {
    /* 忽略读取失败 */
  }
  return "phone";
}

export function savePreviewDevice(device: PreviewDevice) {
  try {
    window.localStorage.setItem(PREVIEW_DEVICE_STORAGE_KEY, device);
  } catch {
    /* 忽略写入失败 */
  }
}
