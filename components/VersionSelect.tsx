"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  versions: string[];
  selected: string;
};

export default function VersionSelect({ versions, selected }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="text-xs text-zinc-400">
      <div className="mt-2 flex items-center gap-2">
        <select
          value={selected}
          onChange={(event) => {
            const value = event.target.value;
            startTransition(() => {
              router.push(`/sequence?version=${value}`);
            });
          }}
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 sm:max-w-[160px]"
        >
          {versions.map((version) => (
            <option key={version} value={version}>
              {version}
            </option>
          ))}
        </select>
        {isPending ? (
          <span className="inline-flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-500 border-t-emerald-400" />
            Loading
          </span>
        ) : null}
      </div>
    </label>
  );
}
