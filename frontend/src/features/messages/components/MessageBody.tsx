import { useState } from 'react';

const isHtml = (body: string) => /^\s*(<!doctype html|<html)/i.test(body);

/**
 * Agent emails are full HTML documents: show them in a sandboxed frame (no scripts, no
 * access to the app) sized to their content. Everything else is plain text.
 */
export function MessageBody({ body, title }: { body: string; title: string }) {
  const [height, setHeight] = useState(240);
  if (!isHtml(body)) return <p className="text-body-medium whitespace-pre-wrap break-words">{body}</p>;
  return (
    <iframe
      title={title}
      srcDoc={body}
      sandbox="allow-same-origin"
      onLoad={(e) => setHeight(Math.min(900, (e.currentTarget.contentDocument?.body.scrollHeight ?? 240) + 16))}
      className="w-full rounded-xl border border-border bg-white"
      style={{ height }}
    />
  );
}
