"use client";

import { useRouter } from "next/navigation";

type Props = {
  versions: string[];
  selected: string;
};

export default function VersionSelect({ versions, selected }: Props) {
  const router = useRouter();

  return (
    <label className="text-xs text-zinc-400">
      Version
      <select
        value={selected}
        onChange={(event) => {
          const value = event.target.value;
          router.push(`/sequence?version=${value}`);
        }}
        className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 sm:max-w-[160px]"
      >
        {versions.map((version) => (
          <option key={version} value={version}>
            {version}
          </option>
        ))}
      </select>
    </label>
  );
}
