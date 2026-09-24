import {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useEditorStore } from "../../store/editorStore";
import "./Header.css";

const ThemePanel = lazy(() =>
  import("../Theme/ThemePanel").then((m) => ({ default: m.ThemePanel })),
);
const StorageModeSelector = lazy(() =>
  import("../StorageModeSelector/StorageModeSelector").then((m) => ({
    default: m.StorageModeSelector,
  })),
);
const ImageHostSettings = lazy(() =>
  import("../Settings/ImageHostSettings").then((m) => ({
    default: m.ImageHostSettings,
  })),
);
const AiSettings = lazy(() =>
  import("../Settings/AiSettings").then((m) => ({
    default: m.AiSettings,
  })),
);
import {
  Layers,
  Palette,
  Send,
  Code,
  ImageIcon,
  Sun,
  Moon,
  ChevronsUp,
  ChevronsDown,
  MoreHorizontal,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useUITheme } from "../../hooks/useUITheme";
import { useWindowControls } from "../../hooks/useWindowControls";
import { resolveAppAssetPath } from "../../utils/assetPath";
import { Modal, FloatingToolbarButton, WindowControls } from "../common";
import { AI_SETTINGS_OPEN_EVENT } from "../../services/ai/aiConfig";
import {
  PublishingColumnSelect,
  PublishingHeaderTools,
} from "./PublishingStrip";

interface HeaderProps {
  showPreviewToggle?: boolean;
  previewOnly?: boolean;
  onTogglePreview?: () => void;
}

type PanelId = "storage" | "imageHost" | "theme" | "ai";

interface NavItem {
  id: PanelId;
  label: string;
  icon: typeof Layers;
  webOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "theme", label: "文章主题", icon: Palette },
  { id: "imageHost", label: "图床设置", icon: ImageIcon },
  { id: "ai", label: "AI 优化", icon: Sparkles },
  { id: "storage", label: "存储模式", icon: Layers, webOnly: true },
];

/** 把异步动作包成带 loading 的按钮状态；进行中重复点击直接忽略（防连点） */
function useBusyAction(action: () => void | Promise<void>) {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const run = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await action();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [action]);
  return [busy, run] as const;
}

export function Header({
  showPreviewToggle = true,
  previewOnly = false,
  onTogglePreview,
}: HeaderProps) {
  const { copyToWechat, copyAsHtml } = useEditorStore();
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const [copyingWechat, runCopyToWechat] = useBusyAction(copyToWechat);
  const [copyingHtml, runCopyAsHtml] = useBusyAction(copyAsHtml);

  useEffect(() => {
    const open = () => setActivePanel("ai");
    window.addEventListener(AI_SETTINGS_OPEN_EVENT, open);
    return () => window.removeEventListener(AI_SETTINGS_OPEN_EVENT, open);
  }, []);

  // 「更多」下拉：点外面 / Esc 关闭
  useEffect(() => {
    if (!moreOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  const uiTheme = useUITheme((state) => state.theme);
  const setTheme = useUITheme((state) => state.setTheme);
  const { isElectron, isWindows, platform } = useWindowControls();
  const logoSrc = resolveAppAssetPath(
    uiTheme === "dark" ? "favicon-light.svg" : "favicon-dark.svg",
  );

  // 自动隐藏标题栏状态
  const [autoHide, setAutoHide] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("wemd-header-autohide") === "true";
    } catch {
      return false;
    }
  });

  // 保存状态到 localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("wemd-header-autohide", String(autoHide));
    } catch {
      // 忽略存储不可用的场景（如隐私模式）
    }
  }, [autoHide]);

  const handleHideHeader = () => {
    setAutoHide(true);
  };

  const openPanel = (id: PanelId) => {
    setMoreOpen(false);
    setActivePanel(id);
  };
  const closePanel = () => setActivePanel(null);

  const navItems = NAV_ITEMS.filter((item) => !(item.webOnly && isElectron));

  // Mac 平台使用内联样式强制避让
  const headerStyle =
    platform === "darwin" ? { paddingLeft: "80px" } : undefined;

  const themeToggleLabel =
    uiTheme === "dark" ? "切换到亮色模式" : "切换到暗色模式";

  return (
    <>
      {/* 隐藏状态下的浮动工具栏 */}
      {autoHide && (
        <div
          className={`floating-toolbar ${isWindows ? "floating-toolbar-win" : ""}`}
        >
          <FloatingToolbarButton
            icon={<ChevronsUp size={18} strokeWidth={2} />}
            label="显示标题栏"
            onClick={() => setAutoHide(false)}
            highlight
          />
          <FloatingToolbarButton
            icon={
              uiTheme === "dark" ? (
                <Sun size={18} strokeWidth={2} />
              ) : (
                <Moon size={18} strokeWidth={2} />
              )
            }
            label={uiTheme === "dark" ? "亮色模式" : "暗色模式"}
            onClick={() => setTheme(uiTheme === "dark" ? "default" : "dark")}
          />
          {!isElectron && (
            <FloatingToolbarButton
              icon={<Layers size={18} strokeWidth={2} />}
              label="存储模式"
              onClick={() => openPanel("storage")}
            />
          )}
          <FloatingToolbarButton
            icon={<ImageIcon size={18} strokeWidth={2} />}
            label="图床设置"
            onClick={() => openPanel("imageHost")}
          />
          <FloatingToolbarButton
            icon={<Palette size={18} strokeWidth={2} />}
            label="主题管理"
            onClick={() => openPanel("theme")}
          />
          <FloatingToolbarButton
            icon={<Code size={18} strokeWidth={2} />}
            label="复制 HTML"
            onClick={() => void runCopyAsHtml()}
          />
          <FloatingToolbarButton
            icon={<Send size={18} strokeWidth={2} />}
            label="复制到公众号"
            onClick={() => void runCopyToWechat()}
            primary
          />
        </div>
      )}

      {/* 隐藏标题栏由拖拽区与 Windows 窗控共同布局，避免两个命中区域重叠 */}
      {isElectron && (
        <div className={`hidden-titlebar ${autoHide ? "is-active" : ""}`}>
          <div className="hidden-titlebar-drag-region" aria-hidden="true" />
          {autoHide && isWindows && <WindowControls variant="compact" />}
        </div>
      )}

      <header
        className={`app-header ${autoHide ? "header-auto-hide" : ""}`}
        style={headerStyle}
      >
        <div className="header-left">
          <div className="logo" aria-label="地图帮排版台">
            <img className="logo-mark" src={logoSrc} alt="地图帮" />
            <span className="logo-copy">
              <strong>地图帮</strong>
              <small>排版台</small>
            </span>
          </div>
          <span className="header-divider" aria-hidden="true" />
          <nav className="header-nav" aria-label="编辑器设置">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`header-nav-button ${
                  activePanel === item.id ? "is-active" : ""
                }`}
                aria-pressed={activePanel === item.id}
                onClick={() => openPanel(item.id)}
              >
                {item.label}
              </button>
            ))}
            <div className="header-more" ref={moreRef}>
              <button
                type="button"
                className={`header-nav-button header-more__trigger ${
                  moreOpen ? "is-open" : ""
                }`}
                aria-label="更多"
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((open) => !open)}
              >
                <MoreHorizontal size={16} strokeWidth={2} />
                <span>更多</span>
              </button>
              {moreOpen && (
                <div className="header-more__menu" role="menu">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        className={`header-more__item ${
                          activePanel === item.id ? "is-active" : ""
                        }`}
                        onClick={() => openPanel(item.id)}
                      >
                        <Icon size={16} strokeWidth={2} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <PublishingColumnSelect />
          </nav>
        </div>

        <div className="header-actions">
          <div className="header-right">
            <PublishingHeaderTools
              showPreviewToggle={showPreviewToggle}
              previewOnly={previewOnly}
              onTogglePreview={onTogglePreview}
            />
            <button
              type="button"
              className="btn-icon-only header-theme-toggle"
              onClick={() => setTheme(uiTheme === "dark" ? "default" : "dark")}
              aria-label={themeToggleLabel}
              data-tooltip={themeToggleLabel}
            >
              {uiTheme === "dark" ? (
                <Sun size={18} strokeWidth={2} />
              ) : (
                <Moon size={18} strokeWidth={2} />
              )}
            </button>
            <button
              type="button"
              className={`btn-secondary header-action-button header-action-secondary ${
                copyingHtml ? "is-loading" : ""
              }`}
              onClick={() => void runCopyAsHtml()}
              disabled={copyingHtml}
              aria-busy={copyingHtml}
              aria-label="复制 HTML"
            >
              {copyingHtml ? (
                <Loader2 className="animate-spin" size={16} strokeWidth={2} />
              ) : (
                <Code size={16} strokeWidth={2} />
              )}
              <span>复制 HTML</span>
            </button>

            <button
              type="button"
              className={`btn-primary header-action-button header-action-primary ${
                copyingWechat ? "is-loading" : ""
              }`}
              onClick={() => void runCopyToWechat()}
              disabled={copyingWechat}
              aria-busy={copyingWechat}
              aria-label="复制到公众号"
            >
              {copyingWechat ? (
                <Loader2 className="animate-spin" size={16} strokeWidth={2} />
              ) : (
                <Send size={16} strokeWidth={2} />
              )}
              <span>{copyingWechat ? "复制中…" : "复制到公众号"}</span>
            </button>

            <button
              type="button"
              className="btn-ghost"
              onClick={handleHideHeader}
              aria-label="隐藏标题栏"
              data-tooltip="隐藏标题栏"
            >
              <ChevronsDown size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Windows 自定义标题栏按钮 */}
          {isWindows && <WindowControls />}
        </div>
      </header>

      <Suspense fallback={null}>
        <ThemePanel open={activePanel === "theme"} onClose={closePanel} />
      </Suspense>

      <Modal
        open={activePanel === "storage"}
        onClose={closePanel}
        title="存储模式"
        description="选择文章保存在浏览器中，或直接读写本地文件夹"
      >
        <Suspense fallback={<div className="modal-loading">加载中…</div>}>
          <StorageModeSelector />
        </Suspense>
      </Modal>

      <Modal
        open={activePanel === "ai"}
        onClose={closePanel}
        title="AI 优化"
        description="配置模型后，在编辑器中选中文字即可润色、精简或改写"
      >
        <Suspense fallback={<div className="modal-loading">加载中…</div>}>
          <AiSettings onClose={closePanel} />
        </Suspense>
      </Modal>

      <Modal
        open={activePanel === "imageHost"}
        onClose={closePanel}
        title="图床设置"
        description="选择上传服务并管理连接配置"
        className="modal-narrow image-host-modal"
      >
        <Suspense fallback={<div className="modal-loading">加载中…</div>}>
          <ImageHostSettings />
        </Suspense>
      </Modal>
    </>
  );
}
