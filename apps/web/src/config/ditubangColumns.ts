import { basicTheme, buildDitubangThemeCss, codeGithubTheme } from "@wemd/core";

export type DitubangCtaKind = "tutorial" | "story";

export type DitubangColumnId =
  | "xinsoucun"
  | "kanshijie"
  | "daduzhe"
  | "hangye"
  | "xuanzhi"
  | "jili"
  | "shujubao"
  | "lunwen";

export interface DitubangColumn {
  id: DitubangColumnId;
  name: string;
  desc: string;
  primary: string;
  primary_dark: string;
  tag_bg: string;
  bg: string;
  border: string;
  ctaKind: DitubangCtaKind;
  enterprise: boolean;
}

export const DITUBANG_COLUMN_IDS: DitubangColumnId[] = [
  "xinsoucun",
  "kanshijie",
  "daduzhe",
  "hangye",
  "xuanzhi",
  "jili",
  "shujubao",
  "lunwen",
];

export const ditubangColumns: Record<DitubangColumnId, DitubangColumn> = {
  xinsoucun: {
    id: "xinsoucun",
    name: "地图新手村",
    desc: "零基础上手，从表格到地图",
    primary: "#ff7b00",
    primary_dark: "#D96800",
    tag_bg: "#FFE6CC",
    bg: "#FFF4EB",
    border: "#FFD8B5",
    ctaKind: "tutorial",
    enterprise: false,
  },
  kanshijie: {
    id: "kanshijie",
    name: "地图看世界",
    desc: "一张主地图，三层空间证据",
    primary: "#1e5a8a",
    primary_dark: "#164468",
    tag_bg: "#D7E4F0",
    bg: "#EAF1F7",
    border: "#C5D5E4",
    ctaKind: "story",
    enterprise: false,
  },
  daduzhe: {
    id: "daduzhe",
    name: "答读者问",
    desc: "后台真实问题，一次答清",
    primary: "#f0900f",
    primary_dark: "#C4740C",
    tag_bg: "#FDE8C4",
    bg: "#FFF6E8",
    border: "#F8D9A8",
    ctaKind: "tutorial",
    enterprise: false,
  },
  hangye: {
    id: "hangye",
    name: "一张地图看行业",
    desc: "一个行业一张图",
    primary: "#1b1b21",
    primary_dark: "#111114",
    tag_bg: "#E8E8EC",
    bg: "#F4F4F6",
    border: "#D8D8DE",
    ctaKind: "story",
    enterprise: true,
  },
  xuanzhi: {
    id: "xuanzhi",
    name: "选址实验室",
    desc: "真实商业场景的地图解法",
    primary: "#16a34a",
    primary_dark: "#12803A",
    tag_bg: "#D4F0DE",
    bg: "#EAF8EF",
    border: "#C4E8D1",
    ctaKind: "tutorial",
    enterprise: true,
  },
  jili: {
    id: "jili",
    name: "地图上的城市肌理",
    desc: "人口结构 × 街角商业",
    primary: "#b5443a",
    primary_dark: "#8F342C",
    tag_bg: "#F0D8D5",
    bg: "#F8EEEC",
    border: "#E8C9C5",
    ctaKind: "story",
    enterprise: false,
  },
  shujubao: {
    id: "shujubao",
    name: "本周数据包",
    desc: "一周数据副产品打包",
    primary: "#6d4fc2",
    primary_dark: "#5539A0",
    tag_bg: "#E4DBF5",
    bg: "#F1EDFA",
    border: "#D4C8EE",
    ctaKind: "story",
    enterprise: false,
  },
  lunwen: {
    id: "lunwen",
    name: "论文地图急诊室",
    desc: "从概念到出图的急救",
    primary: "#0e9494",
    primary_dark: "#0B7474",
    tag_bg: "#CDECEC",
    bg: "#E7F5F5",
    border: "#B9DEDE",
    ctaKind: "tutorial",
    enterprise: false,
  },
};

export function getDitubangColumn(id?: string | null): DitubangColumn {
  if (id && id in ditubangColumns) {
    return ditubangColumns[id as DitubangColumnId];
  }
  return ditubangColumns.xinsoucun;
}

export function ditubangThemeCss(column: DitubangColumn): string {
  return buildDitubangThemeCss({
    primary: column.primary,
    primaryDark: column.primary_dark,
    tagBg: column.tag_bg,
    quoteBg: column.bg,
    quoteBorder: column.border,
  });
}

export function composeDitubangThemeCss(columnId?: string | null): string {
  return (
    basicTheme +
    "\n" +
    ditubangThemeCss(getDitubangColumn(columnId)) +
    "\n" +
    codeGithubTheme
  );
}

export const CALIBER_MD =
  "> 本文基于地图帮 POI 数据库整理。POI 与工商注册、企业财报、统计公报口径可能不同，不直接等同官方统计。\n> 快照年份只用 2019 / 2021 / 2022 / 2023 / 2024 / 2025，2018 不用。双批次年份写波动区间，不写精确增减。";

function ctaMd(
  kind: DitubangCtaKind,
  keyword: string,
  enterprise: boolean,
): string {
  const kw = keyword.replace(/^["']|["']$/g, "") || "本期资料";
  const extra = enterprise
    ? "\n\n如果你需要长期监测多城多行业、批量数据或 API 接入，后台回复「企业」留下需求，我们安排 1 对 1 沟通。"
    : "";
  if (kind === "tutorial") {
    return (
      "想现在就试：不用下载安装，打开地图帮在线版，上传你的表格照着做一遍：\n\nhttps://cloud.dtbgis.com/\n\n需要大批量、离线或更复杂的分析，用地图帮桌面端（官网下载）：\n\nhttps://dtbgis.com/zh/dtb_download/\n\n本期同款示例数据 + 操作步骤文档，后台回复「" +
      kw +
      "」领取。" +
      extra
    );
  }
  return (
    "本文基于地图帮 POI 数据库整理分析。POI 与工商注册、企业财报、统计公报口径可能不同，不直接等同官方统计。\n\n想查你自己城市的同类分布，进入地图帮在线平台：\n\nhttps://dtbgis.cn\n\n完整城市榜单 + 高清地图 + 本期数据样例，后台回复「" +
    kw +
    "」领取。" +
    extra
  );
}

function endingMd(column: DitubangColumn, keyword: string): string {
  return (
    "---\n\n" +
    ctaMd(column.ctaKind, keyword, column.enterprise) +
    "\n\n关注地图帮，获取更多城市数据与地图方法。"
  );
}

const RECIPES: Record<
  DitubangColumnId,
  (keyword: string, author: string) => string
> = {
  xinsoucun(keyword) {
    return [
      "> 后台原话（脱敏）：「表里全是地址，怎么变成能交差的图？」这篇按按钮把路走完。",
      "## 动手前先懂这一个",
      "表格是为了查，地图是为了看。先让点位落到图上，再谈分析。",
      "### 1 打开表格",
      "确认有地址或经纬度列。你会看到：缺的列现在就能补上。",
      "### 2 上传上图",
      "打开地图帮在线版，把表传上去。你会看到：点位出现在地图上。",
      "### 3 导出成果",
      "导出可打印图或可分享链接。你会看到：今天就能交差的成果。",
      "## 翻车排查",
      "- 容易翻车：地址列名不统一，系统认不出。",
      "- 正确做法：先把地址收成一列，再上传。",
      "下一篇接着写：上图之后怎么做可达性 / 选址。",
      endingMd(ditubangColumns.xinsoucun, keyword),
    ].join("\n\n");
  },
  kanshijie(keyword) {
    return [
      "> 先看这张反常的地图：它不该长这样。看完你能讲清它为什么这样运转。",
      "## 它在哪里",
      "用距离、面积、范围把区位讲成体感，不要只丢地名。",
      "## 它为什么这样运转",
      "通道、资源、边界或地形在这里怎么起作用。",
      "## 它改变了什么",
      "成本、时间、人口或产业被怎样改写。",
      "## 空间证据",
      "- 证据 1：区位 / 距离",
      "- 证据 2：通道 / 边界",
      "- 证据 3：结果 / 影响",
      endingMd(ditubangColumns.kanshijie, keyword),
    ].join("\n\n");
  },
  daduzhe(keyword) {
    return [
      "本周后台被问最多的三个问题，一次答清。",
      "> 问 1：把读者原话贴在这里（已脱敏）。",
      "直接答案。然后写到按钮级路径：点哪里、会看到什么。",
      "> 问 2：第二条原话。",
      "直接答案 + 操作路径。",
      "> 问 3：很多人不好意思问的那条。",
      "直接答案 + 操作路径。",
      "## 本周冷知识",
      "一个地图或数据小事实，增加转发点。",
      "> **你的问题下期见：** 用地图或数据卡住时，后台直接发，下期可能就是你的。",
      endingMd(ditubangColumns.daduzhe, keyword),
    ].join("\n\n");
  },
  hangye(keyword) {
    return [
      "> **反直觉数字**",
      "> 直接甩最意外的排名或体量，不铺垫。",
      "",
      CALIBER_MD,
      "",
      "## 总量榜 vs 密度榜",
      "",
      "两榜对照，找排名错位的城市讲故事。",
      "",
      "## 品牌地盘",
      "",
      "TOP 品牌的地理分布差异。表述留余地：约 / 左右。",
      "",
      "## 历年曲线",
      "",
      "扩张还是退潮，拐点在哪年，和行业大事件互证。",
      "",
      "## 县域下钻",
      "",
      "下沉市场里一个意外发现。",
      "",
      CALIBER_MD,
      "",
      endingMd(ditubangColumns.hangye, keyword),
    ].join("\n");
  },
  xuanzhi(keyword) {
    return [
      "一个具体的人、一笔具体的钱、一个具体的犹豫：要不要在这里开第二家。",
      "## 传统做法的坑",
      "- 容易翻车：拍脑袋、抄竞品、听中介。",
      "- 正确做法：先拉数据，再上图，再给判断阈值。",
      "### 1 拉什么数据",
      "竞品、人口、到达范围，列清楚。",
      "### 2 图上看什么",
      "重叠、空白、过密，一眼能指给人看。",
      "### 3 判断标准",
      "给阈值，例如 3 公里超过 N 家要警惕。经验值，因城而异。",
      "## 工具一键版",
      "地图帮对应功能：保护区 / 商圈 / 选址助手，点哪、会看到什么。",
      "## 这个方法什么时候失灵",
      "诚实写边界。没有阈值的选址文是氛围文。",
      endingMd(ditubangColumns.xuanzhi, keyword),
    ].join("\n\n");
  },
  jili(keyword) {
    return [
      "> **国家级数字**",
      "> 先翻译成体感：这是什么概念。",
      "",
      "地图帮全国 POI 底座。这张肌理图只告诉你一件事。",
      "",
      "> **上行：** 这一类店在变多",
      "> **下行：** 另一类店在变少",
      ">",
      "> 一条上行曲线 × 一条下行曲线 × 一个人口结构原因",
      "",
      "## 城市下钻",
      "",
      "单城完整画像：区县分布、新老城区差异，用空间讲故事。",
      "",
      "## 为什么会这样",
      "",
      "人口、政策、资本三条线，哪条是主因。数据事实和解释假设分开写。",
      "",
      "> **这是城市肌理的第 N 块拼图**",
      "> 上一篇：待填",
      "> 可对照：城市性格 / 城市画像",
      "",
      "落回你站在哪一格：下楼会看到什么。不写时代判词。",
      "",
      CALIBER_MD,
      "",
      endingMd(ditubangColumns.jili, keyword),
    ].join("\n");
  },
  shujubao(keyword) {
    return [
      "> **本周发现**",
      "> 从本周文章里挑一句最有趣的数字。",
      "",
      "## 包里有什么",
      "",
      "| 文件 | 格式 | 能干什么 |",
      "| --- | --- | --- |",
      "| 城市榜单 | CSV | 直接透视或上图 |",
      "| 字段说明 | MD | 对照口径 |",
      "| 示例地图 | PNG | 看完成效果 |",
      "",
      "## 3 分钟用法",
      "",
      "拿到包后第一件能做的事，配一张效果图。",
      "",
      endingMd(ditubangColumns.shujubao, keyword),
    ].join("\n");
  },
  lunwen(keyword) {
    return [
      "> 导师原话：「你这个图不行。」研究生都懂的恐惧，这篇按步骤出图。",
      "## 这个分析是什么",
      "概念一页纸讲清。需要时引用 1–2 篇经典文献格式。",
      "## 数据从哪来",
      "POI、边界、路网怎么拿，串到新手村旧文。",
      "## 出图步骤",
      "1. 在地图帮里做好脏活：取点、算距离、出底图。",
      "2. 接到论文配图规范：投影、图例、审图号按审稿人会挑的写。",
      "## 论文方法段怎么写",
      "```",
      "本研究采用……（把方法段句式贴在这里，直接可改）",
      "```",
      "## 审稿人常挑的刺",
      "> 口径、投影、图例规范，缺一项就会被打回。",
      endingMd(ditubangColumns.lunwen, keyword || "论文"),
    ].join("\n\n");
  },
};

export function buildSkeleton(options: {
  columnId: string;
  keyword?: string;
  author?: string;
}): string {
  const column = getDitubangColumn(options.columnId);
  const keyword =
    options.keyword?.trim() || (column.id === "lunwen" ? "论文" : "本期资料");
  return RECIPES[column.id](keyword, options.author?.trim() || "地图帮");
}

export function kickerLabel(columnName: string, issue?: string): string {
  const trimmed = (issue || "").trim();
  return trimmed ? `${columnName}｜${trimmed}` : columnName;
}

export function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function publishingChromeHtml(options: {
  columnName: string;
  issue?: string;
  title?: string;
}): string {
  return `<p class="column-kicker"><span class="content">${escapeHtml(kickerLabel(options.columnName, options.issue))}</span></p>`;
}

export function nonWechatImageUrls(markdown: string): string[] {
  return [...markdown.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)]
    .map((match) => match[1].trim())
    .filter((url) => url && !/^https?:\/\/mmbiz\.(qpic|qlogo)\.cn/i.test(url));
}
