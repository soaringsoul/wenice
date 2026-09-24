export type DitubangPalette = {
  primary: string;
  primaryDark: string;
  tagBg: string;
  quoteBg: string;
  quoteBorder: string;
};

export function buildDitubangThemeCss(palette: DitubangPalette): string {
  const brand = palette.primary;
  const brandDeep = palette.primaryDark;
  const h2bg = palette.tagBg;
  const qbg = palette.quoteBg;
  const qbd = palette.quoteBorder;

  return `/* 地图帮 mdnice 主题 v5 */
#wemd {
  margin: 0 auto;
  padding: 6px 2px;
  background: #ffffff;
  color: rgba(0, 0, 0, 0.88);
  font-size: 15px;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue",
    "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI",
    "Microsoft YaHei", Arial, sans-serif;
  word-break: break-word;
  letter-spacing: 0.2px;
  line-height: 30px;
}

#wemd p {
  margin-top: 0;
  margin-bottom: 18px;
  padding: 0;
  box-sizing: border-box;
  font-size: 15px;
  text-align: left;
  white-space: normal;
  text-size-adjust: 100%;
  line-height: 30px;
  color: rgba(0, 0, 0, 0.78);
  letter-spacing: 0.3px;
  text-indent: 0;
}

#wemd .column-kicker {
  margin: 0 0 8px 0;
  padding: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: ${brand};
  text-indent: 0;
  line-height: 20px;
  border: none;
  background: transparent;
}

#wemd .column-kicker .content {
  font-size: 12px;
  font-weight: 600;
  color: ${brand};
  letter-spacing: 0.5px;
  line-height: 20px;
}

#wemd h1 {
  margin-top: 8px;
  margin-bottom: 18px;
  font-size: 20px;
  line-height: 30px;
}

#wemd h1 .content {
  font-size: 20px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.92);
  letter-spacing: 0.2px;
  line-height: 30px;
}

#wemd h1 .prefix,
#wemd h1 .suffix {
  display: none;
}

#wemd h2 {
  margin-top: 26px;
  margin-bottom: 14px;
  padding-top: 0;
  font-size: 17px;
  line-height: 28px;
}

#wemd h2 .content {
  display: inline-block;
  padding: 4px 10px 3px;
  background: ${h2bg};
  color: rgba(0, 0, 0, 0.88);
  font-size: 17px;
  font-weight: 600;
  line-height: 28px;
  border-radius: 6px;
}

#wemd h2 .prefix,
#wemd h2 .suffix {
  display: none;
}

#wemd h3 {
  margin-top: 16px;
  margin-bottom: 8px;
  font-size: 15px;
  line-height: 26px;
}

#wemd h3 .content,
#wemd h3 span {
  display: inline-block;
  padding-left: 0;
  color: rgba(0, 0, 0, 0.72);
  font-size: 15px;
  font-weight: 600;
  line-height: 26px;
}

#wemd h3 .prefix,
#wemd h3 .suffix {
  display: none;
}

#wemd h4 {
  margin-top: 14px;
  margin-bottom: 6px;
  font-size: 15px;
  line-height: 26px;
}

#wemd h4 .content,
#wemd h4 span {
  display: inline-block;
  color: rgba(0, 0, 0, 0.65);
  font-size: 15px;
  font-weight: 600;
  line-height: 26px;
}

#wemd h4 .prefix,
#wemd h4 .suffix {
  display: none;
}

#wemd ul {
  margin-top: 8px;
  margin-bottom: 16px;
  padding-left: 24px;
  list-style-type: disc;
  color: rgba(0, 0, 0, 0.78);
  font-size: 15px;
  line-height: 30px;
}

#wemd ol {
  margin-top: 8px;
  margin-bottom: 16px;
  padding-left: 24px;
  list-style-type: decimal;
  color: rgba(0, 0, 0, 0.78);
  font-size: 15px;
  line-height: 30px;
}

#wemd li section {
  font-size: 15px;
  color: rgba(0, 0, 0, 0.78);
  font-weight: 400;
  line-height: 30px;
}

#wemd blockquote,
#wemd .multiquote-1 {
  margin: 20px 0;
  padding: 12px 14px;
  background: ${qbg};
  border: none;
  border-left: none;
  border-radius: 8px;
  box-shadow: none;
  box-sizing: border-box;
  font-size: 14px;
  line-height: 26px;
}

#wemd blockquote p {
  margin: 0;
  padding: 0;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.68);
  line-height: 26px;
  letter-spacing: 0;
  text-indent: 0;
}

#wemd blockquote strong {
  color: ${brandDeep};
  font-weight: 600;
}

#wemd a {
  color: ${brandDeep};
  text-decoration: none;
  border-bottom: 1px solid ${qbd};
}

#wemd strong {
  color: rgba(0, 0, 0, 0.92);
  font-weight: 600;
}

#wemd em {
  color: rgba(0, 0, 0, 0.65);
  font-style: italic;
}

#wemd strong em,
#wemd em strong {
  color: ${brandDeep};
  font-weight: 600;
}

#wemd del {
  color: rgba(0, 0, 0, 0.45);
}

#wemd hr {
  margin: 24px 0;
  border: none;
  border-top: 1px solid #f0f0f0;
}

#wemd img {
  display: block;
  max-width: 100%;
  margin: 18px auto;
  border-radius: 8px;
}

#wemd figure {
  margin: 18px 0;
}

#wemd figcaption {
  margin-top: 6px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  text-align: center;
  line-height: 22px;
}

#wemd p code,
#wemd li code {
  padding: 2px 6px;
  margin: 0 2px;
  color: ${brandDeep};
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  font-size: 14px;
  font-family: "SF Mono", Consolas, Menlo, monospace;
}

#wemd pre {
  margin: 16px 0;
}

#wemd pre code {
  display: block;
  padding: 14px 16px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 24px;
  color: rgba(0, 0, 0, 0.78);
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  font-family: "SF Mono", Consolas, Menlo, monospace;
  white-space: pre;
}

#wemd table {
  display: block;
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  border-collapse: collapse;
  margin: 18px 0;
  border: none;
}

#wemd table tr {
  border: none;
  border-top: none;
}

#wemd table tr th,
#wemd table tr td {
  min-width: 120px;
  padding: 10px 12px;
  border: none;
  border-top: none;
  border-left: none;
  border-right: none;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  line-height: 24px;
  color: rgba(0, 0, 0, 0.78);
}

#wemd table tr th {
  background: #fafafa;
  color: rgba(0, 0, 0, 0.88);
  font-weight: 600;
  border-bottom: 1px solid #e8e8e8;
}

#wemd table tr:last-child td {
  border-bottom: none;
}

#wemd .footnote-word {
  color: ${brandDeep};
  font-size: 14px;
}

#wemd .footnote-ref {
  color: ${brandDeep};
}

#wemd .footnotes-sep:before {
  content: "参考资料";
  display: inline-block;
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 4px solid ${brand};
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

#wemd .footnote-num {
  color: ${brandDeep};
}

#wemd .footnote-item p {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 26px;
  color: rgba(0, 0, 0, 0.65);
  text-indent: 0;
}

#wemd .footnote-item p em {
  color: rgba(0, 0, 0, 0.45);
}

#wemd .block-equation svg {
  max-width: 180% !important;
}

#wemd .inline-equation svg {
  vertical-align: middle;
}
`;
}

export const ditubangTheme = buildDitubangThemeCss({
  primary: "#ff7b00",
  primaryDark: "#D96800",
  tagBg: "#FFE6CC",
  quoteBg: "#FFF4EB",
  quoteBorder: "#FFD8B5",
});
