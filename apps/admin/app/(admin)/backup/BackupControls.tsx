"use client";
import { useTransition, useState } from "react";
import { backupAction, restoreAction, type ActionResult } from "./actions";

function ResultBanner({ result }: { result: ActionResult }) {
  return (
    <div
      className={`mt-4 rounded-lg px-4 py-3 text-sm border ${
        result.ok
          ? "bg-green-950/40 border-green-900/50 text-green-400"
          : "bg-red-950/40 border-red-900/50 text-red-400"
      }`}
    >
      <p className="font-medium">{result.message}</p>
      {result.detail && <p className="mt-1 text-xs opacity-80">{result.detail}</p>}
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  buttonLabel,
  buttonClass,
  onConfirm,
  confirm,
  isPending,
  result,
}: {
  icon: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonClass: string;
  onConfirm: () => void;
  confirm?: string;
  isPending: boolean;
  result: ActionResult | null;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  function handleClick() {
    if (confirm && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    setShowConfirm(false);
    onConfirm();
  }

  return (
    <div className="bg-[#131619] border border-[#2a2e35] rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="text-sm text-[#8b919a] mt-0.5">{description}</p>
        </div>
      </div>

      {showConfirm && (
        <div className="rounded-lg bg-yellow-950/40 border border-yellow-900/50 px-3 py-2.5 text-sm text-yellow-400">
          {confirm}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleClick}
          disabled={isPending}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonClass}`}
        >
          {isPending ? "Running…" : showConfirm ? "Yes, proceed" : buttonLabel}
        </button>
        {showConfirm && (
          <button
            onClick={() => setShowConfirm(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#8b919a] hover:text-white hover:bg-[#1a1d22] transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {result && <ResultBanner result={result} />}
    </div>
  );
}

export function BackupControls() {
  const [backupPending, startBackup] = useTransition();
  const [restorePending, startRestore] = useTransition();
  const [backupResult, setBackupResult] = useState<ActionResult | null>(null);
  const [restoreResult, setRestoreResult] = useState<ActionResult | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ActionCard
        icon="📦"
        title="Backup to GitHub"
        description="Push all notes (including drafts) to the backup repository as markdown files with YAML frontmatter."
        buttonLabel="Run backup"
        buttonClass="bg-[#5865f2] hover:bg-[#4752c4] text-white"
        onConfirm={() => {
          setBackupResult(null);
          startBackup(async () => {
            const result = await backupAction();
            setBackupResult(result);
          });
        }}
        isPending={backupPending}
        result={backupResult}
      />

      <ActionCard
        icon="🔄"
        title="Restore from GitHub"
        description="Import all notes from the backup repository into the database. Existing notes with matching slugs will be overwritten."
        buttonLabel="Restore"
        buttonClass="bg-[#1a1d22] hover:bg-[#2a2e35] text-white border border-[#2a2e35]"
        confirm="This will overwrite any notes with matching slugs. Are you sure?"
        onConfirm={() => {
          setRestoreResult(null);
          startRestore(async () => {
            const result = await restoreAction();
            setRestoreResult(result);
          });
        }}
        isPending={restorePending}
        result={restoreResult}
      />
    </div>
  );
}
