'use client';

import { useEffect, useState } from 'react';

interface DailyHoroscope {
  date: string;
  readings: Record<string, string>;
}

// Module-level cache + inflight để mọi component dùng hook chỉ fetch 1 lần.
let cache: DailyHoroscope | null = null;
let inflight: Promise<DailyHoroscope | null> | null = null;
const listeners = new Set<(d: DailyHoroscope | null) => void>();

async function fetchDaily(): Promise<DailyHoroscope | null> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch('/api/horoscope/daily');
      const body = await res.json();
      if (!res.ok || !body?.ok) return null;
      cache = { date: body.date, readings: body.readings };
      listeners.forEach((fn) => fn(cache));
      return cache;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function useDailyHoroscope(): DailyHoroscope | null {
  const [data, setData] = useState<DailyHoroscope | null>(cache);
  useEffect(() => {
    if (cache) {
      setData(cache);
      return;
    }
    let mounted = true;
    const onUpdate = (d: DailyHoroscope | null) => {
      if (mounted) setData(d);
    };
    listeners.add(onUpdate);
    fetchDaily().then((d) => {
      if (mounted && d) setData(d);
    });
    return () => {
      mounted = false;
      listeners.delete(onUpdate);
    };
  }, []);
  return data;
}
