'use client';

import { useEffect, useState } from 'react';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

type Listener = (items: ToastItem[]) => void;

let counter = 0;
let items: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l([...items]);
}

function push(kind: ToastKind, message: string, ttl = 4000) {
  const id = ++counter;
  items = [...items, { id, kind, message }];
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, ttl);
}

export const toast = {
  success: (msg: string) => push('success', msg),
  error: (msg: string) => push('error', msg),
  info: (msg: string) => push('info', msg),
};

const KIND_STYLE: Record<ToastKind, { border: string; bg: string; text: string; icon: string }> = {
  success: {
    border: 'border-[#3a8a5e]/55',
    bg: 'bg-[#eef5e9]',
    text: 'text-[#2a5a3a]',
    icon: '✓',
  },
  error: {
    border: 'border-[#c8361d]/55',
    bg: 'bg-[#fbece8]',
    text: 'text-[#c8361d]',
    icon: '✕',
  },
  info: {
    border: 'border-[#4a6c7a]/55',
    bg: 'bg-[#e8eef2]',
    text: 'text-[#2a3a4a]',
    icon: 'i',
  },
};

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setList);
    setList([...items]);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-[calc(100vw-3rem)]">
      {list.map((t) => {
        const s = KIND_STYLE[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex items-start gap-3 min-w-[260px] max-w-[360px] rounded-xl border ${s.border} ${s.bg} shadow-[0_18px_40px_-20px_rgba(15,10,8,0.35)] px-4 py-3 animate-[toast-in_180ms_ease-out]`}
          >
            <span
              className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#fbf3e2] border ${s.border} text-[12px] font-bold ${s.text}`}
            >
              {s.icon}
            </span>
            <div className={`text-[13.5px] leading-snug ${s.text}`}>{t.message}</div>
          </div>
        );
      })}
      <style jsx>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
