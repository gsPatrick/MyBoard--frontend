"use client";

import React from "react";
import styles from "./Markdown.module.css";

const INLINE_RE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*]+\*)|(_[^_]+_)|(\[[^\]]+\]\([^)\s]+\))/;

function renderInline(text, keyPrefix) {
  const nodes = [];
  let remaining = String(text);
  let i = 0;
  while (remaining) {
    const m = remaining.match(INLINE_RE);
    if (!m) {
      nodes.push(remaining);
      break;
    }
    if (m.index > 0) nodes.push(remaining.slice(0, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-${i}`;
    if (tok.startsWith("`")) {
      nodes.push(
        <code key={key} className={styles.inlineCode}>
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith("**") || tok.startsWith("__")) {
      nodes.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("*") || tok.startsWith("_")) {
      nodes.push(<em key={key}>{tok.slice(1, -1)}</em>);
    } else if (tok.startsWith("[")) {
      const lm = tok.match(/\[([^\]]+)\]\(([^)\s]+)\)/);
      nodes.push(
        <a key={key} href={lm[2]} target="_blank" rel="noreferrer noopener" className={styles.link}>
          {lm[1]}
        </a>
      );
    }
    remaining = remaining.slice(m.index + tok.length);
    i += 1;
  }
  return nodes;
}

export default function Markdown({ text }) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;

  const isList = (l) => /^\s*[-*]\s+/.test(l);
  const isOl = (l) => /^\s*\d+\.\s+/.test(l);
  const isHeader = (l) => /^#{1,6}\s+/.test(l);
  const isFence = (l) => l.trimStart().startsWith("```");

  while (i < lines.length) {
    const line = lines[i];

    if (isFence(line)) {
      const codeLines = [];
      i += 1;
      while (i < lines.length && !isFence(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1; // pula o fechamento
      blocks.push(
        <pre key={blocks.length} className={styles.codeBlock}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lvl = Math.min(h[1].length + 1, 6);
      blocks.push(
        React.createElement(
          `h${lvl}`,
          { key: blocks.length, className: styles.heading },
          renderInline(h[2], `h${blocks.length}`)
        )
      );
      i += 1;
      continue;
    }

    if (isList(line)) {
      const items = [];
      while (i < lines.length && isList(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={blocks.length} className={styles.list}>
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ul${blocks.length}-${idx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (isOl(line)) {
      const items = [];
      while (i < lines.length && isOl(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={blocks.length} className={styles.list}>
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ol${blocks.length}-${idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const para = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !isFence(lines[i]) &&
      !isHeader(lines[i]) &&
      !isList(lines[i]) &&
      !isOl(lines[i])
    ) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push(
      <p key={blocks.length} className={styles.p}>
        {para.map((pl, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <br />}
            {renderInline(pl, `p${blocks.length}-${idx}`)}
          </React.Fragment>
        ))}
      </p>
    );
  }

  return <div className={styles.md}>{blocks}</div>;
}
