/**
 * 微信复制 DOM 容器规范化
 * 处理微信公众号编辑器对粘贴 HTML 的清洗兼容问题：
 * - 连续背景保留 root section，其余场景转换为 div
 * - 元数据属性清理
 * - 无连续背景时将根节点 padding 迁移到内层元素
 * - 无连续背景时将背景色下沉到子块
 */
import { materializeCodeLineBreaksForWechat } from "./wechatCodeBlockCompat";
import {
  hasExplicitBackgroundImage,
  prepareRootBackgroundCanvasForWechat,
} from "./wechatBackgroundCanvas";

// ── 颜色透明度判断 ──────────────────────────────────

const parseAlpha = (token: string): number | null => {
  const trimmed = token.trim();
  if (!trimmed) return null;

  if (trimmed.endsWith("%")) {
    const percent = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isFinite(percent) ? percent / 100 : null;
  }

  const value = Number.parseFloat(trimmed);
  return Number.isFinite(value) ? value : null;
};

const getFunctionalColorAlpha = (normalized: string): number | null => {
  const match = normalized.match(/^(rgba?|hsla?)\((.*)\)$/);
  if (!match) return null;

  const fnName = match[1];
  const body = match[2].trim();

  if (body.includes("/")) {
    const slashIndex = body.lastIndexOf("/");
    const alphaToken = body.slice(slashIndex + 1);
    return parseAlpha(alphaToken);
  }

  if (fnName === "rgba" || fnName === "hsla") {
    const commaParts = body.split(",");
    if (commaParts.length === 4) {
      return parseAlpha(commaParts[3]);
    }
  }

  return null;
};

const isTransparentBackground = (value: string): boolean => {
  const normalized = value.replace(/\s+/g, "").toLowerCase();
  if (normalized === "transparent" || normalized.startsWith("transparent")) {
    return true;
  }

  // #RGBA / #RRGGBBAA
  if (/^#[0-9a-f]{4}$/.test(normalized)) {
    return normalized[4] === "0";
  }
  if (/^#[0-9a-f]{8}$/.test(normalized)) {
    return normalized.slice(6, 8) === "00";
  }

  const alpha = getFunctionalColorAlpha(normalized);
  return alpha !== null && alpha <= 0;
};

const DEFAULT_COPY_TEXT_COLOR = "#1a1a1a";

const isUnresolvedColorValue = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;

  if (
    normalized === "inherit" ||
    normalized === "initial" ||
    normalized === "unset" ||
    normalized === "revert" ||
    normalized === "revert-layer" ||
    normalized === "currentcolor"
  ) {
    return true;
  }

  return (
    normalized.includes("var(") ||
    normalized.includes("color-mix(") ||
    normalized.includes("oklch(") ||
    normalized.includes("oklab(") ||
    normalized.includes("lab(") ||
    normalized.includes("lch(")
  );
};

const hasDirectTextContent = (element: HTMLElement): boolean => {
  return Array.from(element.childNodes).some((node) => {
    return node.nodeType === Node.TEXT_NODE && (node.textContent || "").trim();
  });
};

const materializeTextColorForWechat = (container: HTMLElement): void => {
  const root = container.firstElementChild;
  if (!(root instanceof HTMLElement)) return;

  const rootColorRaw = root.style.getPropertyValue("color").trim();
  const baseColor = isUnresolvedColorValue(rootColorRaw)
    ? DEFAULT_COPY_TEXT_COLOR
    : rootColorRaw;

  const walk = (node: HTMLElement, inheritedColor: string) => {
    const ownColorRaw = node.style.getPropertyValue("color").trim();
    const ownColor = isUnresolvedColorValue(ownColorRaw) ? null : ownColorRaw;
    const effectiveColor = ownColor || inheritedColor;

    if (hasDirectTextContent(node) && ownColor !== effectiveColor) {
      node.style.setProperty("color", effectiveColor);
    }

    const children = Array.from(node.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    children.forEach((child) => walk(child, effectiveColor));
  };

  walk(root, baseColor);
};

// ── 间距工具函数 ────────────────────────────────────

const isZeroSpacing = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === "0" || normalized === "0px" || normalized === "0%") {
    return true;
  }
  return normalized.split(/\s+/).every((token) => {
    return token === "0" || token === "0px" || token === "0%";
  });
};

const mergeHorizontalPadding = (
  existingPadding: string,
  rootPadding: string,
): string => {
  const normalized = existingPadding.trim().toLowerCase();
  if (
    normalized === "auto" ||
    normalized === "inherit" ||
    normalized === "initial" ||
    normalized === "unset" ||
    normalized === "revert" ||
    normalized === "revert-layer"
  ) {
    // 这些关键字无法与长度通过 calc 相加，回退为根节点留白值。
    return rootPadding;
  }
  if (isZeroSpacing(existingPadding)) {
    return rootPadding;
  }
  return `calc(${existingPadding} + ${rootPadding})`;
};

const isAutoMargin = (value: string): boolean => {
  return value.trim().toLowerCase() === "auto";
};

const hasAutoHorizontalMargin = (node: HTMLElement): boolean => {
  const marginLeft = node.style.getPropertyValue("margin-left");
  const marginRight = node.style.getPropertyValue("margin-right");
  if (isAutoMargin(marginLeft) || isAutoMargin(marginRight)) {
    return true;
  }

  const margin = node.style.getPropertyValue("margin").trim().toLowerCase();
  if (!margin) return false;
  const tokens = margin.split(/\s+/);

  if (tokens.length === 1) {
    return tokens[0] === "auto";
  }
  if (tokens.length === 2 || tokens.length === 3) {
    return tokens[1] === "auto";
  }
  return tokens[1] === "auto" || tokens[3] === "auto";
};

// ── DOM 变换 ────────────────────────────────────────

const transformWemdRootSectionToDiv = (container: HTMLElement): void => {
  const root = container.firstElementChild;
  if (
    !(root instanceof HTMLElement) ||
    root.tagName !== "SECTION" ||
    root.id !== "wemd" ||
    container.childElementCount !== 1
  ) {
    return;
  }

  const wrapper = document.createElement("div");
  Array.from(root.attributes).forEach((attr) => {
    wrapper.setAttribute(attr.name, attr.value);
  });
  while (root.firstChild) {
    wrapper.appendChild(root.firstChild);
  }
  container.replaceChildren(wrapper);
};

export const stripCopyMetadata = (container: HTMLElement): void => {
  const root = container.firstElementChild;
  if (root instanceof HTMLElement && root.id === "wemd") {
    root.removeAttribute("id");
  }

  container.querySelectorAll<HTMLElement>("[data-tool]").forEach((node) => {
    node.removeAttribute("data-tool");
  });

  container
    .querySelectorAll<HTMLElement>("[data-wemd-counter-generated]")
    .forEach((node) => {
      node.removeAttribute("data-wemd-counter-generated");
    });
};

// ── Padding 迁移 ───────────────────────────────────

const isHeadingElement = (node: HTMLElement): boolean => {
  const tagName = node.tagName;
  return (
    tagName === "H1" ||
    tagName === "H2" ||
    tagName === "H3" ||
    tagName === "H4" ||
    tagName === "H5" ||
    tagName === "H6"
  );
};

/**
 * 判断元素是否应使用 margin 而非 padding 迁移水平留白。
 * 含 border / background 的块级元素（标题、引用、代码块、提示块）需用 margin，
 * 否则 padding 只会把内容往里推，边框和背景仍贴在容器边缘。
 */
const shouldUseMarginForHorizontalOffset = (node: HTMLElement): boolean => {
  if (isHeadingElement(node)) return true;
  const tagName = node.tagName;
  if (tagName === "BLOCKQUOTE") return true;
  if (tagName === "PRE") return true;
  if (tagName === "HR") return true;
  if (node.classList.contains("callout")) return true;
  if (node.classList.contains("table-container")) return true;
  return false;
};

/**
 * 微信编辑器会清理粘贴内容最外层元素的 padding。
 * 复制前将根节点 padding 迁移到内层包裹元素，确保页面左右留白生效。
 */
const relocateRootPaddingToInnerWrapper = (container: HTMLElement): void => {
  const root = container.firstElementChild;
  if (!(root instanceof HTMLElement)) return;

  const paddingLeft = root.style.getPropertyValue("padding-left").trim();
  const paddingRight = root.style.getPropertyValue("padding-right").trim();
  const paddingTop = root.style.getPropertyValue("padding-top").trim();
  const paddingBottom = root.style.getPropertyValue("padding-bottom").trim();

  const hasHorizontalPadding =
    !isZeroSpacing(paddingLeft) || !isZeroSpacing(paddingRight);
  const hasVerticalPadding =
    !isZeroSpacing(paddingTop) || !isZeroSpacing(paddingBottom);

  if (!hasHorizontalPadding && !hasVerticalPadding) {
    return;
  }

  const elementChildren = Array.from(root.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );

  // 左右留白优先下沉到一级内容块，避免微信清洗外层容器 padding。
  if (hasHorizontalPadding && elementChildren.length > 0) {
    elementChildren.forEach((child) => {
      const useMarginForHorizontalOffset =
        shouldUseMarginForHorizontalOffset(child);
      const keepHrAutoMargins =
        child.tagName === "HR" && hasAutoHorizontalMargin(child);
      if (!isZeroSpacing(paddingLeft)) {
        if (useMarginForHorizontalOffset) {
          const existingMarginLeft = child.style
            .getPropertyValue("margin-left")
            .trim();
          // HR 的胶囊样式使用 margin:auto 居中，不能被页边距迁移覆盖。
          if (!keepHrAutoMargins) {
            child.style.setProperty(
              "margin-left",
              mergeHorizontalPadding(existingMarginLeft, paddingLeft),
            );
          }
        } else {
          const existingPaddingLeft = child.style
            .getPropertyValue("padding-left")
            .trim();
          child.style.setProperty(
            "padding-left",
            mergeHorizontalPadding(existingPaddingLeft, paddingLeft),
          );
        }
      }
      if (!isZeroSpacing(paddingRight)) {
        if (useMarginForHorizontalOffset) {
          const existingMarginRight = child.style
            .getPropertyValue("margin-right")
            .trim();
          // HR 的胶囊样式使用 margin:auto 居中，不能被页边距迁移覆盖。
          if (!keepHrAutoMargins) {
            child.style.setProperty(
              "margin-right",
              mergeHorizontalPadding(existingMarginRight, paddingRight),
            );
          }
        } else {
          const existingPaddingRight = child.style
            .getPropertyValue("padding-right")
            .trim();
          child.style.setProperty(
            "padding-right",
            mergeHorizontalPadding(existingPaddingRight, paddingRight),
          );
        }
      }
    });
  }

  // 仅当存在垂直 padding 时，才额外包一层承接上下留白。
  if (hasVerticalPadding) {
    const innerWrapper = document.createElement("div");
    innerWrapper.style.display = "block";
    innerWrapper.style.width = "100%";
    innerWrapper.style.boxSizing = "border-box";

    if (!isZeroSpacing(paddingTop)) {
      innerWrapper.style.setProperty("padding-top", paddingTop);
    }
    if (!isZeroSpacing(paddingBottom)) {
      innerWrapper.style.setProperty("padding-bottom", paddingBottom);
    }

    while (root.firstChild) {
      innerWrapper.appendChild(root.firstChild);
    }
    root.appendChild(innerWrapper);
  }

  root.style.removeProperty("padding");
  root.style.removeProperty("padding-left");
  root.style.removeProperty("padding-right");
  root.style.removeProperty("padding-top");
  root.style.removeProperty("padding-bottom");
};

// ── 背景色下沉 ─────────────────────────────────────

/**
 * 提取根元素的背景色并从根元素上移除。
 * 微信会清洗最外层容器样式，因此背景色需要下沉到子块。
 * 返回有效（非透明）的背景色字符串，无则返回 null。
 */
const extractRootBackgroundColor = (container: HTMLElement): string | null => {
  const root = container.firstElementChild;
  if (!(root instanceof HTMLElement)) return null;

  const background = root.style.getPropertyValue("background");
  const backgroundColor = root.style.getPropertyValue("background-color");

  // 找出有效的非透明背景色
  let effectiveBg: string | null = null;
  if (backgroundColor && !isTransparentBackground(backgroundColor)) {
    effectiveBg = backgroundColor;
  } else if (background && !isTransparentBackground(background)) {
    effectiveBg = background;
  }

  // 清理根元素上的背景属性
  if (background) root.style.removeProperty("background");
  if (backgroundColor) root.style.removeProperty("background-color");

  if (root.style.length === 0 && root.hasAttribute("style")) {
    root.removeAttribute("style");
  }

  return effectiveBg;
};

/**
 * 检查元素是否位于一个拥有显式背景色的祖先元素内（root 以下）。
 * 如果是，则不应覆盖其背景色，因为祖先的背景色是主题有意为之。
 */
const hasAncestorWithExplicitBackground = (
  node: HTMLElement,
  root: HTMLElement,
): boolean => {
  let current = node.parentElement;
  while (current && current !== root) {
    const bg = current.style.getPropertyValue("background");
    const bgColor = current.style.getPropertyValue("background-color");
    const bgImage = current.style.getPropertyValue("background-image");
    if (
      (bg && !isTransparentBackground(bg)) ||
      (bgColor && !isTransparentBackground(bgColor)) ||
      hasExplicitBackgroundImage(bgImage)
    ) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
};

const normalizeBlockBackgroundForWechat = (
  container: HTMLElement,
  rootBgColor: string | null,
): void => {
  const root = container.firstElementChild as HTMLElement | null;
  const blocks = container.querySelectorAll<HTMLElement>(
    "p,h1,h2,h3,h4,h5,h6,ul,ol,li,section,figure,figcaption",
  );

  blocks.forEach((node) => {
    const background = node.style.getPropertyValue("background");
    const backgroundColor = node.style.getPropertyValue("background-color");
    const backgroundImage = node.style.getPropertyValue("background-image");
    const hasExplicitBackground =
      (background && !isTransparentBackground(background)) ||
      (backgroundColor && !isTransparentBackground(backgroundColor)) ||
      hasExplicitBackgroundImage(backgroundImage);

    if (hasExplicitBackground) return;

    // 祖先元素（如 blockquote）已有显式背景色时，不覆盖子元素的背景
    if (root && hasAncestorWithExplicitBackground(node, root)) return;

    // Formula SVGs use currentColor for dark mode, so their wrapper must not
    // block WeChat's color/background overrides with !important.
    const priority = node.classList.contains("block-equation")
      ? undefined
      : "important";
    if (rootBgColor) {
      node.style.setProperty("background-color", rootBgColor, priority);
    } else {
      node.style.setProperty("background", "transparent", priority);
      node.style.setProperty("background-color", "transparent", priority);
    }
    node.style.setProperty("background-image", "none", priority);
  });
};

const getTextDirection = (node: HTMLElement): "ltr" | "rtl" => {
  let current: HTMLElement | null = node;
  while (current) {
    const direction = (
      current.style.direction ||
      current.getAttribute("dir") ||
      ""
    ).toLowerCase();
    if (direction === "ltr" || direction === "rtl") return direction;
    current = current.parentElement;
  }
  return "ltr";
};

const wechatBoldWeight = (value: string): string | null => {
  const weight = value.trim().toLowerCase();
  if (weight === "bold" || weight === "bolder") return "bold";
  const numeric = Number.parseInt(weight, 10);
  return Number.isFinite(numeric) && numeric >= 600 ? "bold" : null;
};

const promoteCalloutTitleWeight = (container: HTMLElement): void => {
  container.querySelectorAll<HTMLElement>(".callout-title").forEach((title) => {
    const weight =
      wechatBoldWeight(title.style.fontWeight) ||
      wechatBoldWeight(window.getComputedStyle(title).fontWeight);
    if (!weight) return;
    title.style.fontWeight = weight;
    title.querySelectorAll<HTMLElement>("span").forEach((span) => {
      if (span.classList.contains("callout-icon")) return;
      if (span.closest("strong")) return;
      const strong = document.createElement("strong");
      while (span.firstChild) strong.appendChild(span.firstChild);
      span.replaceWith(strong);
    });
  });
};

/** jsdom 的标题字号常是 `1.5em`；微信会把无单位行高当 px，必须乘真实 px 字号。 */
const resolveFontSizePx = (node: HTMLElement, depth = 0): number => {
  if (depth > 16) return 16;

  const inline = node.style.fontSize.trim();
  if (inline.endsWith("px")) {
    const pixels = Number.parseFloat(inline);
    if (Number.isFinite(pixels) && pixels > 0) return pixels;
  }

  const computed = window.getComputedStyle(node).fontSize.trim();
  if (computed.endsWith("px")) {
    const pixels = Number.parseFloat(computed);
    if (Number.isFinite(pixels) && pixels > 0) return pixels;
  }

  if (inline.endsWith("%") || computed.endsWith("%")) {
    const percent = Number.parseFloat(inline || computed);
    const parent = node.parentElement;
    const parentPx = parent ? resolveFontSizePx(parent, depth + 1) : 16;
    if (Number.isFinite(percent) && percent > 0)
      return (percent / 100) * parentPx;
  }

  if (computed.endsWith("rem") || inline.endsWith("rem")) {
    const rem = Number.parseFloat(computed.endsWith("rem") ? computed : inline);
    if (Number.isFinite(rem) && rem > 0) return rem * 16;
  }

  if (
    (computed.endsWith("em") && !computed.endsWith("rem")) ||
    (inline.endsWith("em") && !inline.endsWith("rem"))
  ) {
    const em = Number.parseFloat(
      computed.endsWith("em") && !computed.endsWith("rem") ? computed : inline,
    );
    const parent = node.parentElement;
    const parentPx = parent ? resolveFontSizePx(parent, depth + 1) : 16;
    if (Number.isFinite(em) && em > 0) return em * parentPx;
  }

  return 16;
};

const WECHAT_TEXT_BLOCKS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "SECTION",
  "BLOCKQUOTE",
  "LI",
  "TD",
  "TH",
  "PRE",
  "FIGCAPTION",
]);

const UNITLESS_NUMBER = /^(?:\d+(?:\.\d+)?|\.\d+)$/;

const skipWechatLineHeightFix = (node: HTMLElement): boolean => {
  const tag = node.tagName;
  if (tag === "SUB" || tag === "SUP") return true;
  if (node.classList.contains("mac-sign")) return true;
  return false;
};

const toPx = (value: number): string => `${Math.round(value * 1000) / 1000}px`;

const materializeInlineFontSizePx = (node: HTMLElement): number => {
  const inline = node.style.fontSize.trim();
  const pixels = resolveFontSizePx(node);
  if (
    pixels > 0 &&
    inline &&
    !inline.endsWith("px") &&
    (inline.endsWith("em") || inline.endsWith("rem") || inline.endsWith("%"))
  ) {
    node.style.fontSize = toPx(pixels);
  }
  return pixels;
};

const materializeWechatLineHeight = (node: HTMLElement): void => {
  if (skipWechatLineHeightFix(node)) return;

  const fontSize = materializeInlineFontSizePx(node);
  const raw = node.style.lineHeight.trim();
  const isTextBlock = WECHAT_TEXT_BLOCKS.has(node.tagName);
  const fallback = fontSize > 0 ? Math.max(fontSize, fontSize * 1.6) : 0;

  if (UNITLESS_NUMBER.test(raw)) {
    const multiplier = Number.parseFloat(raw);
    if (
      Number.isFinite(fontSize) &&
      fontSize > 0 &&
      Number.isFinite(multiplier)
    ) {
      node.style.lineHeight = toPx(Math.max(fontSize, fontSize * multiplier));
    }
    return;
  }

  if (raw.endsWith("em") || raw.endsWith("rem")) {
    const em = Number.parseFloat(raw);
    const base = raw.endsWith("rem") ? 16 : fontSize;
    if (Number.isFinite(em) && em > 0 && base > 0) {
      node.style.lineHeight = toPx(Math.max(fontSize, em * base));
    }
    return;
  }

  if (raw.endsWith("px")) {
    const lineHeight = Number.parseFloat(raw);
    if (
      isTextBlock &&
      Number.isFinite(lineHeight) &&
      lineHeight > 0 &&
      lineHeight < fontSize
    ) {
      node.style.lineHeight = toPx(fallback);
    }
    return;
  }

  // 公众号会剥掉最外层行高。引用块等只继承 1.6 时会被当成 1.6px。
  if (isTextBlock && fallback > 0) {
    node.style.lineHeight = toPx(fallback);
  }
};

const normalizeWechatSpecRules = (container: HTMLElement): void => {
  container.querySelectorAll<HTMLElement>("*").forEach((node) => {
    const textAlign = node.style.textAlign.trim().toLowerCase();
    if (textAlign === "start" || textAlign === "end") {
      const rtl = getTextDirection(node) === "rtl";
      const normalized =
        textAlign === "start"
          ? rtl
            ? "right"
            : "left"
          : rtl
            ? "left"
            : "right";
      node.style.setProperty("text-align", normalized);
    }

    materializeWechatLineHeight(node);

    // 文章展示不需要控制编辑光标，交给公众号编辑器使用默认值。
    node.style.removeProperty("caret-color");
    if (node.style.length === 0) node.removeAttribute("style");
  });
  container.querySelectorAll<HTMLElement>("pre > code").forEach((code) => {
    code.style.whiteSpace = "pre-wrap";
    code.style.minWidth = "0";
    code.style.overflowWrap = "anywhere";
    code.style.wordBreak = "break-word";
  });

  container.querySelectorAll<SVGElement>("[begin]").forEach((node) => {
    if (
      !["animate", "animatetransform", "animatemotion"].includes(
        node.localName.toLowerCase(),
      )
    ) {
      return;
    }

    const begin = node.getAttribute("begin") || "";
    if (/\btouchstart\b/i.test(begin) && !/\bclick\b/i.test(begin)) {
      node.setAttribute("begin", `${begin}; click`);
    }
  });

  container.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
    if (!image.hasAttribute("data-w") && image.naturalWidth > 0) {
      image.setAttribute("data-w", String(image.naturalWidth));
    }
  });

  promoteCalloutTitleWeight(container);
};

// ── 对外入口 ────────────────────────────────────────

export interface WechatCopyNormalizationResult {
  /** 连续背景依赖完整根 section，剪贴板传输不能交给浏览器剥离根容器。 */
  requiresExactHtmlTransport: boolean;
}

export const normalizeCopyContainer = (
  container: HTMLElement,
): WechatCopyNormalizationResult => {
  materializeCodeLineBreaksForWechat(container);
  const preserveRootBackgroundCanvas =
    prepareRootBackgroundCanvasForWechat(container);
  if (!preserveRootBackgroundCanvas) {
    transformWemdRootSectionToDiv(container);
  }
  stripCopyMetadata(container);
  const rootBgColor = preserveRootBackgroundCanvas
    ? null
    : extractRootBackgroundColor(container);
  if (!preserveRootBackgroundCanvas) {
    relocateRootPaddingToInnerWrapper(container);
  }
  normalizeBlockBackgroundForWechat(container, rootBgColor);
  materializeTextColorForWechat(container);
  normalizeWechatSpecRules(container);

  return {
    requiresExactHtmlTransport: preserveRootBackgroundCanvas,
  };
};
