import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useEditorStore } from "../../store/editorStore";
import {
  applyBlockType,
  applyHighlight,
  applyInlineStyle,
  clearInlineFormat,
  hexToRgb,
  hsvToRgb,
  rgbToHex,
  rgbToHsv,
  selectionContext,
  sourceBlockRange,
  toggleBold,
  type BlockKind,
} from "./previewFormat";
import "./PreviewFormatBar.css";

const SWATCHES = [
  "#1b1b21",
  "#5b5b66",
  "#ff7b00",
  "#b5443a",
  "#1e5a8a",
  "#f0900f",
  "#16a34a",
  "#6d4fc2",
  "#0e9494",
  "#FFFFFF",
];

interface PreviewFormatBarProps {
  previewRoot: RefObject<HTMLDivElement | null>;
}

function placeFloat(el: HTMLElement, left: number, top: number) {
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  const nextLeft = Math.max(8, Math.min(left, window.innerWidth - width - 8));
  const nextTop = Math.max(8, Math.min(top, window.innerHeight - height - 8));
  el.style.left = `${nextLeft}px`;
  el.style.top = `${nextTop}px`;
}

export function PreviewFormatBar({ previewRoot }: PreviewFormatBarProps) {
  const setMarkdown = useEditorStore((state) => state.setMarkdown);
  const [visible, setVisible] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteMode, setPaletteMode] = useState<"color" | "bg">("color");
  const [blockKind, setBlockKind] = useState<BlockKind>("p");
  const [hue, setHue] = useState(24);
  const [sat, setSat] = useState(1);
  const [val, setVal] = useState(1);
  const [hex, setHex] = useState("ff7b00");
  const hsvRef = useRef({ h: 24, s: 1, v: 1 });
  hsvRef.current = { h: hue, s: sat, v: val };
  const lastRange = useRef<Range | null>(null);
  const interacting = useRef(false);
  const barRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const pickerHex = rgbToHex(...hsvToRgb(hue, sat, val));
  const pickerRgb = hsvToRgb(hue, sat, val);

  const restoreRange = () => {
    if (!lastRange.current) return;
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(lastRange.current);
  };

  const commit = (next: string | null) => {
    if (!next) return;
    const prev = useEditorStore.getState().markdown;
    if (next === prev) return;
    setMarkdown(next);
  };

  const withSelection = (run: (range: Range) => void) => {
    restoreRange();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return;
    run(sel.getRangeAt(0));
  };

  const showAt = useCallback((range: Range) => {
    lastRange.current = range.cloneRange();
    setVisible(true);
    const block = sourceBlockRange(range.commonAncestorContainer);
    if (block) setBlockKind(block.kind);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const bar = barRef.current;
    const range = lastRange.current;
    if (!bar || !range) return;
    const rect =
      typeof range.getBoundingClientRect === "function"
        ? range.getBoundingClientRect()
        : { top: 8, bottom: 40, left: 8, width: 80, height: 20 };
    let top = rect.top - bar.offsetHeight - 8;
    if (top < 8) top = rect.bottom + 8;
    placeFloat(bar, rect.left + rect.width / 2 - bar.offsetWidth / 2, top);
  }, [visible, blockKind]);

  useEffect(() => {
    let hideTimer = 0;
    const onSel = () => {
      const root = previewRoot.current;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || sel.isCollapsed || !root) {
        if (!interacting.current) {
          window.clearTimeout(hideTimer);
          hideTimer = window.setTimeout(() => {
            if (!interacting.current) {
              setVisible(false);
              setPaletteOpen(false);
            }
          }, 120);
        }
        return;
      }
      const range = sel.getRangeAt(0);
      const node =
        range.commonAncestorContainer.nodeType === 1
          ? (range.commonAncestorContainer as Node)
          : range.commonAncestorContainer.parentElement;
      if (!node || !root.contains(node)) {
        if (!interacting.current) {
          window.clearTimeout(hideTimer);
          hideTimer = window.setTimeout(() => {
            if (!interacting.current) {
              setVisible(false);
              setPaletteOpen(false);
            }
          }, 120);
        }
        return;
      }
      const element = node instanceof Element ? node : node.parentElement;
      if (element?.closest(".column-kicker")) {
        if (!interacting.current) {
          window.clearTimeout(hideTimer);
          hideTimer = window.setTimeout(() => {
            if (!interacting.current) {
              setVisible(false);
              setPaletteOpen(false);
            }
          }, 120);
        }
        return;
      }
      window.clearTimeout(hideTimer);
      lastRange.current = range.cloneRange();
      showAt(range);
    };
    document.addEventListener("selectionchange", onSel);
    const root = previewRoot.current;
    root?.addEventListener("mouseup", onSel);
    return () => {
      window.clearTimeout(hideTimer);
      document.removeEventListener("selectionchange", onSel);
      root?.removeEventListener("mouseup", onSel);
    };
  }, [previewRoot, showAt]);

  const applyColor = (color: string, mode = paletteMode) => {
    withSelection((range) => {
      const ctx = selectionContext(range);
      const md = useEditorStore.getState().markdown;
      commit(
        applyInlineStyle(
          md,
          ctx,
          mode === "color" ? { color } : { background: color },
        ),
      );
    });
  };
  const applyColorRef = useRef(applyColor);
  applyColorRef.current = applyColor;

  const syncHexFromHsv = (
    nextHue: number,
    nextSat: number,
    nextVal: number,
  ) => {
    const [r, g, b] = hsvToRgb(nextHue, nextSat, nextVal);
    setHex(rgbToHex(r, g, b).slice(1));
  };

  const setFromHex = (raw: string, write: boolean) => {
    const rgb = hexToRgb(raw);
    if (!rgb) return;
    const hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
    setHue(hsv.h);
    setSat(hsv.s);
    setVal(hsv.v);
    setHex(rgbToHex(rgb[0], rgb[1], rgb[2]).slice(1));
    if (write) applyColor(rgbToHex(rgb[0], rgb[1], rgb[2]));
  };

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const read = (event: PointerEvent) => {
      const box = board.getBoundingClientRect();
      const nextSat = Math.max(
        0,
        Math.min(1, (event.clientX - box.left) / box.width),
      );
      const nextVal = Math.max(
        0,
        Math.min(1, 1 - (event.clientY - box.top) / box.height),
      );
      setSat(nextSat);
      setVal(nextVal);
      hsvRef.current = { h: hsvRef.current.h, s: nextSat, v: nextVal };
      syncHexFromHsv(hsvRef.current.h, nextSat, nextVal);
    };
    const onDown = (event: PointerEvent) => {
      event.preventDefault();
      board.setPointerCapture(event.pointerId);
      read(event);
      const onMove = (move: PointerEvent) => read(move);
      const onUp = () => {
        board.removeEventListener("pointermove", onMove);
        board.removeEventListener("pointerup", onUp);
        const latest = hsvRef.current;
        applyColorRef.current(
          rgbToHex(...hsvToRgb(latest.h, latest.s, latest.v)),
        );
      };
      board.addEventListener("pointermove", onMove);
      board.addEventListener("pointerup", onUp);
    };
    board.addEventListener("pointerdown", onDown);
    return () => board.removeEventListener("pointerdown", onDown);
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    const palette = paletteRef.current;
    if (!visible || !paletteOpen || !bar || !palette) return;
    const rect = bar.getBoundingClientRect();
    placeFloat(palette, rect.left, rect.bottom + 8);
  }, [visible, paletteOpen, hue, sat, val]);

  return (
    <>
      <div
        className={`preview-sel-bar${visible ? " show" : ""}`}
        id="previewSelBar"
        ref={barRef}
        style={{ ["--sel-color" as string]: pickerHex }}
        onMouseDown={(event) => {
          interacting.current = true;
          const target = event.target as HTMLElement;
          if (target.closest("select") || target.closest("input")) return;
          event.preventDefault();
        }}
        onMouseUp={() => {
          window.setTimeout(() => {
            interacting.current = false;
          }, 0);
        }}
      >
        <select
          id="previewSelBlock"
          title="段落样式"
          value={blockKind}
          onChange={(event) => {
            const kind = event.target.value as BlockKind;
            setBlockKind(kind);
            withSelection((range) => {
              const block = sourceBlockRange(range.commonAncestorContainer);
              if (!block) return;
              commit(
                applyBlockType(
                  useEditorStore.getState().markdown,
                  block.start,
                  block.end,
                  kind,
                ),
              );
            });
          }}
        >
          <option value="p">正文</option>
          <option value="h2">二级标题</option>
          <option value="h3">三级标题</option>
          <option value="h4">四级标题</option>
        </select>
        <button
          type="button"
          id="previewSelBold"
          title="加粗"
          onClick={() => {
            withSelection((range) => {
              commit(
                toggleBold(
                  useEditorStore.getState().markdown,
                  selectionContext(range),
                ),
              );
            });
          }}
        >
          B
        </button>
        <button
          type="button"
          className="sel-a"
          id="previewSelColor"
          title="文字颜色"
          onClick={() => {
            interacting.current = true;
            setPaletteMode("color");
            setPaletteOpen((open) => !(open && paletteMode === "color"));
          }}
        >
          A
        </button>
        <button
          type="button"
          id="previewSelBg"
          title="背景高亮"
          onClick={() => {
            withSelection((range) => {
              commit(
                applyHighlight(
                  useEditorStore.getState().markdown,
                  selectionContext(range),
                ),
              );
            });
          }}
        >
          高亮
        </button>
        <select
          id="previewSelFs"
          title="字号（px）"
          defaultValue=""
          onChange={(event) => {
            const px = event.target.value;
            if (!px) return;
            withSelection((range) => {
              commit(
                applyInlineStyle(
                  useEditorStore.getState().markdown,
                  selectionContext(range),
                  { "font-size": `${parseInt(px, 10)}px` },
                ),
              );
            });
            event.target.selectedIndex = 0;
          }}
        >
          <option value="" disabled>
            字号
          </option>
          {["12", "13", "14", "15", "16", "18", "20", "22", "24"].map((px) => (
            <option key={px} value={px}>
              {px}px
            </option>
          ))}
        </select>
        <button
          type="button"
          id="previewSelClear"
          title="清除格式"
          onClick={() => {
            withSelection((range) => {
              commit(
                clearInlineFormat(
                  useEditorStore.getState().markdown,
                  selectionContext(range),
                ),
              );
            });
          }}
        >
          清除
        </button>
      </div>
      <div
        className={`preview-sel-palette${paletteOpen ? " show" : ""}`}
        id="previewSelPalette"
        ref={paletteRef}
        onMouseDown={(event) => {
          interacting.current = true;
          const target = event.target as HTMLElement;
          if (target.closest("input, select, textarea, .preview-sv-board"))
            return;
          event.preventDefault();
        }}
      >
        <div className="preview-sel-picker-head">
          <div className="preview-sel-mode-label" id="previewSelModeLabel">
            {paletteMode === "color" ? "正文颜色" : "背景颜色"}
          </div>
          <button
            type="button"
            id="previewSelPickerClose"
            aria-label="关闭"
            onClick={() => setPaletteOpen(false)}
          >
            ×
          </button>
        </div>
        <div
          className="preview-sv-board"
          id="previewSvBoard"
          ref={boardRef}
          style={{
            background: `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${hue},100%,50%))`,
          }}
        >
          <i
            className="preview-sv-thumb"
            id="previewSvThumb"
            style={{
              left: `${sat * 100}%`,
              top: `${(1 - val) * 100}%`,
            }}
          />
        </div>
        <input
          className="hue"
          type="range"
          id="previewHueBar"
          min={0}
          max={360}
          value={Math.round(hue)}
          onChange={(event) => {
            const next = parseFloat(event.target.value) || 0;
            setHue(next);
            syncHexFromHsv(next, sat, val);
          }}
          onMouseUp={() => applyColor(pickerHex)}
        />
        <div className="preview-hex-row">
          <i
            className="preview-hex-chip"
            id="previewSelChip"
            style={{ background: pickerHex }}
          />
          #
          <input
            id="previewSelHex"
            value={hex}
            maxLength={6}
            spellCheck={false}
            onChange={(event) => setHex(event.target.value.replace("#", ""))}
            onBlur={(event) => setFromHex(event.target.value, true)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setFromHex((event.target as HTMLInputElement).value, true);
              }
            }}
          />
          <span>RGB</span>
          <span id="previewSelRgb">
            {pickerRgb[0]}, {pickerRgb[1]}, {pickerRgb[2]}
          </span>
        </div>
        <div className="preview-sel-swatches" id="previewSelSwatches">
          {SWATCHES.map((color) => (
            <div
              key={color}
              className="sw"
              data-c={color}
              style={{ background: color }}
              title={color}
              onClick={() => {
                setFromHex(color, true);
                setPaletteOpen(false);
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
