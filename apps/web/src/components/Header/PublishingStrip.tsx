import { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, LayoutTemplate } from "lucide-react";
import { Modal } from "../common";
import { useEditorStore } from "../../store/editorStore";
import { useThemeStore } from "../../store/themeStore";
import { useHistoryStore } from "../../store/historyStore";
import {
  publishingHistoryFields,
  usePublishingStore,
} from "../../store/publishingStore";
import {
  DITUBANG_COLUMN_IDS,
  buildSkeleton,
  ditubangColumns,
  getDitubangColumn,
  type DitubangColumnId,
} from "../../config/ditubangColumns";
import "./PublishingStrip.css";

interface PublishingStripProps {
  showPreviewToggle?: boolean;
  previewOnly?: boolean;
  onTogglePreview?: () => void;
}

function persistMeta() {
  const publishing = usePublishingStore.getState();
  const editorState = useEditorStore.getState();
  const themeState = useThemeStore.getState();
  if (!useHistoryStore.getState().activeId) return;
  void useHistoryStore.getState().persistActiveSnapshot({
    markdown: editorState.markdown,
    theme: themeState.themeId,
    customCSS: themeState.customCSS,
    themeName: themeState.themeName,
    title: publishing.title.trim() || "未命名文章",
    columnId: publishing.columnId,
    issue: publishing.issue,
  });
}

function applyColumn(nextColumnId: string) {
  usePublishingStore.getState().setColumn(nextColumnId);
  useThemeStore.getState().selectTheme("ditubang");
  persistMeta();
}

export function PublishingColumnSelect() {
  const columnId = usePublishingStore((state) => state.columnId);

  return (
    <select
      aria-label="栏目"
      className="header-column-select"
      value={columnId}
      onChange={(event) => applyColumn(event.target.value)}
    >
      {DITUBANG_COLUMN_IDS.map((id) => (
        <option key={id} value={id}>
          {ditubangColumns[id].name}
        </option>
      ))}
    </select>
  );
}

export function PublishingHeaderTools({
  showPreviewToggle = true,
  previewOnly = false,
  onTogglePreview,
}: PublishingStripProps) {
  const issue = usePublishingStore((state) => state.issue);
  const columnId = usePublishingStore((state) => state.columnId);
  const setIssue = usePublishingStore((state) => state.setIssue);
  const setColumn = usePublishingStore((state) => state.setColumn);
  const selectTheme = useThemeStore((state) => state.selectTheme);
  const setMarkdown = useEditorStore((state) => state.setMarkdown);
  const resetDocument = useEditorStore((state) => state.resetDocument);
  const persistActiveSnapshot = useHistoryStore(
    (state) => state.persistActiveSnapshot,
  );
  const saveSnapshot = useHistoryStore((state) => state.saveSnapshot);
  const setActiveId = useHistoryStore((state) => state.setActiveId);
  const markdown = useEditorStore((state) => state.markdown);
  const hasBody = markdown.trim().length > 0;

  const [skeletonOpen, setSkeletonOpen] = useState(false);
  const [skeletonColumn, setSkeletonColumn] =
    useState<DitubangColumnId>(columnId);
  const [skeletonIssue, setSkeletonIssue] = useState(issue);
  const [keyword, setKeyword] = useState("");
  const [author, setAuthor] = useState("地图帮");

  const openSkeleton = () => {
    setSkeletonColumn(columnId);
    setSkeletonIssue(issue);
    setKeyword("");
    setAuthor("地图帮");
    setSkeletonOpen(true);
  };

  const applySkeleton = async (mode: "overwrite" | "create") => {
    const md = buildSkeleton({
      columnId: skeletonColumn,
      keyword,
      author,
    });
    const editorState = useEditorStore.getState();
    const themeState = useThemeStore.getState();
    const previous = publishingHistoryFields();

    if (mode === "create") {
      await persistActiveSnapshot({
        markdown: editorState.markdown,
        theme: themeState.themeId,
        customCSS: themeState.customCSS,
        themeName: themeState.themeName,
        title: previous.title || "未命名文章",
        columnId: previous.columnId,
        issue: previous.issue,
      });
    }

    setColumn(skeletonColumn);
    setIssue(skeletonIssue);
    selectTheme("ditubang");
    const snapshot = {
      markdown: md,
      theme: "ditubang" as const,
      customCSS: useThemeStore.getState().getThemeCSS("ditubang"),
      themeName: "地图帮",
      title: previous.title || "未命名文章",
      columnId: skeletonColumn,
      issue: skeletonIssue,
    };

    if (mode === "create") {
      resetDocument({
        markdown: md,
        theme: "ditubang",
        customCSS: snapshot.customCSS,
        themeName: "地图帮",
      });
      const created = await saveSnapshot(snapshot, { force: true });
      if (created) setActiveId(created.id);
    } else {
      setMarkdown(md);
      await persistActiveSnapshot(snapshot);
    }

    setSkeletonOpen(false);
    toast.success("已写入骨架");
  };

  return (
    <>
      <label className="header-issue-field">
        <span>期号</span>
        <input
          aria-label="期号"
          type="text"
          value={issue}
          placeholder="第12期"
          onChange={(event) => setIssue(event.target.value)}
          onBlur={persistMeta}
        />
      </label>
      <button
        type="button"
        className="btn-secondary header-action-button header-action-secondary"
        onClick={openSkeleton}
      >
        <LayoutTemplate size={16} strokeWidth={2} />
        <span>排骨架</span>
      </button>
      {showPreviewToggle && (
        <button
          type="button"
          className="btn-secondary header-action-button header-action-secondary"
          onClick={onTogglePreview}
          aria-pressed={previewOnly}
          aria-label={previewOnly ? "退出预览" : "预览"}
        >
          {previewOnly ? (
            <EyeOff size={16} strokeWidth={2} />
          ) : (
            <Eye size={16} strokeWidth={2} />
          )}
          <span>{previewOnly ? "编辑" : "预览"}</span>
        </button>
      )}
      <Modal
        open={skeletonOpen}
        onClose={() => setSkeletonOpen(false)}
        title="排骨架"
        description="只生成正文 Markdown，栏名由预览注入，不写进源码"
      >
        <div className="publishing-skeleton">
          <label>
            <span>栏目</span>
            <select
              aria-label="骨架栏目"
              value={skeletonColumn}
              onChange={(event) =>
                setSkeletonColumn(event.target.value as DitubangColumnId)
              }
            >
              {DITUBANG_COLUMN_IDS.map((id) => (
                <option key={id} value={id}>
                  {ditubangColumns[id].name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>期号</span>
            <input
              value={skeletonIssue}
              onChange={(event) => setSkeletonIssue(event.target.value)}
              placeholder="第12期"
            />
          </label>
          <label>
            <span>留资关键词</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={
                getDitubangColumn(skeletonColumn).id === "lunwen"
                  ? "论文"
                  : "本期资料"
              }
            />
          </label>
          <label>
            <span>作者</span>
            <input
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
            />
          </label>
          <div className="publishing-skeleton__actions">
            {hasBody && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void applySkeleton("create")}
              >
                先新建再写入
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              onClick={() => void applySkeleton("overwrite")}
            >
              {hasBody ? "覆盖当前" : "写入正文"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function PublishingStrip(props: PublishingStripProps) {
  return (
    <>
      <PublishingColumnSelect />
      <PublishingHeaderTools {...props} />
    </>
  );
}
