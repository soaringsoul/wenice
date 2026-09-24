import { create } from "zustand";
import {
  getDitubangColumn,
  type DitubangColumnId,
} from "../config/ditubangColumns";

export interface PublishingState {
  title: string;
  columnId: DitubangColumnId;
  issue: string;
  setTitle: (title: string) => void;
  setColumn: (columnId: string) => void;
  setIssue: (issue: string) => void;
  hydrate: (data: {
    title?: string;
    columnId?: string;
    issue?: string;
  }) => void;
  reset: (keepColumn?: boolean) => void;
}

const DEFAULT_COLUMN: DitubangColumnId = "xinsoucun";

export const usePublishingStore = create<PublishingState>((set) => ({
  title: "",
  columnId: DEFAULT_COLUMN,
  issue: "",
  setTitle: (title) => set({ title }),
  setColumn: (columnId) => set({ columnId: getDitubangColumn(columnId).id }),
  setIssue: (issue) => set({ issue }),
  hydrate: (data) =>
    set({
      title: data.title ?? "",
      columnId: getDitubangColumn(data.columnId).id,
      issue: data.issue ?? "",
    }),
  reset: (keepColumn = false) =>
    set((state) => ({
      title: "",
      issue: "",
      columnId: keepColumn ? state.columnId : DEFAULT_COLUMN,
    })),
}));

export function publishingHistoryFields() {
  const { title, columnId, issue } = usePublishingStore.getState();
  return {
    columnId,
    issue,
    title: title.trim(),
  };
}

export function applyPublishingSnapshot(entry: {
  title?: string;
  columnId?: string;
  issue?: string;
}) {
  const title = (entry.title || "").trim();
  usePublishingStore.getState().hydrate({
    title: title === "未命名文章" ? "" : title,
    columnId: entry.columnId,
    issue: entry.issue ?? "",
  });
}
