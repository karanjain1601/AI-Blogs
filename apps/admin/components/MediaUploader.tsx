"use client";
import { useRef, useState, useTransition } from "react";
import { uploadMediaAction } from "@/app/(admin)/media/actions";

interface UploadResult {
  url?: string;
  error?: string;
}

export function MediaUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [isPending, startTransition] = useTransition();

  const upload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    startTransition(async () => {
      const uploads = Array.from(files).map(async (file) => {
        const fd = new FormData();
        fd.set("file", file);
        const result = await uploadMediaAction(fd);
        return result;
      });
      const settled = await Promise.all(uploads);
      setResults((prev) => [...settled, ...prev]);
    });
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          upload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-[#5865f2] bg-[#5865f2]/10"
            : "border-[#2a2e35] hover:border-[#4a4e5a]"
        }`}
      >
        <div className="text-3xl mb-2">📁</div>
        <p className="text-[#c9cdd4] text-sm font-medium">
          Drop files here or click to browse
        </p>
        <p className="text-[#8b919a] text-xs mt-1">Max 20 MB per file</p>
        {isPending && (
          <p className="text-[#5865f2] text-xs mt-2">Uploading…</p>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
            Uploaded
          </h3>
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                r.error
                  ? "border-red-900/50 bg-red-950/40 text-red-400"
                  : "border-[#2a2e35] bg-[#131619] text-white"
              }`}
            >
              {r.error ? (
                <span>{r.error}</span>
              ) : (
                <>
                  <span className="flex-1 font-mono text-xs truncate text-[#8b919a]">
                    {r.url}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(r.url!)}
                    className="text-xs text-[#5865f2] hover:text-[#818cf8] transition-colors flex-shrink-0"
                  >
                    Copy URL
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
