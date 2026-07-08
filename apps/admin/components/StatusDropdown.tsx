"use client";
import { useTransition } from "react";
import type { NoteStatus } from "@notes/core";

const STATUS_OPTIONS: NoteStatus[] = [
  "draft",
  "scheduled",
  "published",
  "evergreen",
];

interface Props {
  noteId: string;
  currentStatus: NoteStatus;
  updateAction: (noteId: string, status: NoteStatus) => Promise<{ error?: string }>;
}

export function StatusDropdown({ noteId, currentStatus, updateAction }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as NoteStatus;
    startTransition(async () => {
      await updateAction(noteId, status);
    });
  };

  return (
    <select
      defaultValue={currentStatus}
      disabled={isPending}
      onChange={handleChange}
      className="px-2.5 py-1.5 bg-[#0b0d10] border border-[#2a2e35] rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#5865f2] disabled:opacity-50"
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
