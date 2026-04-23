import { Fragment, type ReactNode } from 'react';

type Block =
  | { type: 'heading'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'paragraph'; text: string };

export function parseTuviMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      const text = para.join(' ').trim();
      if (text) blocks.push({ type: 'paragraph', text });
      para = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (/^#{2,6}\s+/.test(line)) {
      flush();
      blocks.push({ type: 'heading', text: line.replace(/^#{2,6}\s+/, '').trim() });
      continue;
    }
    if (/^[•\-*]\s+/.test(line)) {
      flush();
      blocks.push({ type: 'bullet', text: line.replace(/^[•\-*]\s+/, '').trim() });
      continue;
    }
    para.push(line);
  }
  flush();
  return blocks;
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== '');
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}

export function RenderTuviContent({ content }: { content: string }) {
  const blocks = parseTuviMarkdown(content);
  const result: ReactNode[] = [];
  let bulletBuf: string[] = [];
  const flushBullets = () => {
    if (bulletBuf.length) {
      result.push(
        <ul key={`ul-${result.length}`}>
          {bulletBuf.map((b, i) => (
            <li key={i}>{renderInline(b)}</li>
          ))}
        </ul>,
      );
      bulletBuf = [];
    }
  };
  blocks.forEach((b, idx) => {
    if (b.type === 'bullet') {
      bulletBuf.push(b.text);
      return;
    }
    flushBullets();
    if (b.type === 'heading') {
      result.push(<h2 key={`h-${idx}`}>{renderInline(b.text)}</h2>);
    } else {
      result.push(<p key={`p-${idx}`}>{renderInline(b.text)}</p>);
    }
  });
  flushBullets();
  return <div className="prose-tuvi">{result}</div>;
}
