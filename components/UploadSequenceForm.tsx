"use client";

import { useActionState } from "react";
import { uploadSequenceAction } from "@/app/actions/sequence";

const initialState = { message: null };

export default function UploadSequenceForm() {
  const [state, formAction, isPending] = useActionState(
    uploadSequenceAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="text-sm text-zinc-200">
        Version
        <select
          name="version"
          required
          className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          defaultValue="v3"
        >
          <option value="v1">v1</option>
          <option value="v2">v2</option>
          <option value="v3">v3</option>
        </select>
      </label>
      <label className="text-sm text-zinc-200">
        Excel file (.xlsx)
        <input
          type="file"
          name="file"
          accept=".xlsx"
          required
          className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
      >
        {isPending ? "Uploading..." : "Upload sequence"}
      </button>
      {state.message ? (
        <p className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
