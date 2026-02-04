"use client";

import { useActionState } from "react";
import { uploadCardsAction } from "@/app/actions/cards";

const initialState = { message: null };

export default function UploadCardsForm() {
  const [state, formAction, isPending] = useActionState(
    uploadCardsAction,
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
          <option value="v4">v4</option>
          <option value="v5">v5</option>
          <option value="v6">v6</option>
        </select>
      </label>
      <label className="text-sm text-zinc-200">
        Card list (.csv or .xlsx)
        <input
          type="file"
          name="file"
          accept=".csv,.xlsx"
          required
          className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
      >
        {isPending ? "Uploading..." : "Upload card list"}
      </button>
      {state.message ? (
        <p className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
