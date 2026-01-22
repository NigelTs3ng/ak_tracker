"use client";

import { useEffect, useState } from "react";

type Props = {
  delayMs?: number;
};

export default function DelayedSpinner({ delayMs = 250 }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  if (!visible) return null;

  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-950/80 px-4 py-2 text-xs text-zinc-300">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-emerald-400" />
        Loading...
      </div>
    </div>
  );
}
