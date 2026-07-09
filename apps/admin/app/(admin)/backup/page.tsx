import { BackupControls } from "./BackupControls";

export const metadata = { title: "Backup & Restore — Notes Admin" };

const ghRepo = process.env.GITHUB_BACKUP_REPO;
const ghBranch = process.env.GITHUB_BACKUP_BRANCH ?? "main";

export default function BackupPage() {
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-white mb-2">Backup & Restore</h1>
      <p className="text-sm text-[#8b919a] mb-6">
        {ghRepo ? (
          <>
            Connected to{" "}
            <span className="text-[#c9cdd4] font-mono text-xs">
              {ghRepo}@{ghBranch}
            </span>
            . Daily auto-backup runs at 04:00 UTC.
          </>
        ) : (
          <span className="text-yellow-400">
            Set <code className="font-mono text-xs">GITHUB_BACKUP_TOKEN</code>,{" "}
            <code className="font-mono text-xs">GITHUB_BACKUP_REPO</code>, and{" "}
            <code className="font-mono text-xs">GITHUB_BACKUP_BRANCH</code> to enable.
          </span>
        )}
      </p>

      <BackupControls />

      <div className="mt-8 bg-[#131619] border border-[#2a2e35] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">How it works</h2>
        <ul className="space-y-2 text-sm text-[#8b919a]">
          <li>
            <span className="text-[#c9cdd4]">Backup</span> — exports every note as a{" "}
            <code className="font-mono text-xs text-[#c9cdd4]">notes/&lt;topic&gt;/&lt;slug&gt;.md</code>{" "}
            file with YAML frontmatter. Blocks are stored in both human-readable markdown and as
            base64 JSON for lossless restore.
          </li>
          <li>
            <span className="text-[#c9cdd4]">Restore</span> — reads all{" "}
            <code className="font-mono text-xs text-[#c9cdd4]">.md</code> files, parses frontmatter,
            and upserts notes by slug. Missing topics are created automatically.
          </li>
          <li>
            <span className="text-[#c9cdd4]">Daily cron</span> — runs at 04:00 UTC via Vercel cron,
            backs up only published &amp; evergreen notes.
          </li>
        </ul>
      </div>
    </div>
  );
}
