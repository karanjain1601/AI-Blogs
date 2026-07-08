import * as SecureStore from "expo-secure-store";
import { File, Directory, Paths } from "expo-file-system";
import type { NoteView } from "./types";

const BOOKMARKS_KEY = "nb_bookmarks_v1";

// Lazy-init the cache directory reference
function getCacheDir(): Directory {
  return new Directory(Paths.document, "nb_cache");
}

function ensureCacheDir(dir: Directory): void {
  if (!dir.exists) dir.create();
}

// ── Bookmarks ─────────────────────────────────────────────────────────────────

export async function getBookmarks(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(BOOKMARKS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

export async function addBookmark(slug: string): Promise<void> {
  const current = await getBookmarks();
  if (current.includes(slug)) return;
  await SecureStore.setItemAsync(BOOKMARKS_KEY, JSON.stringify([...current, slug]));
}

export async function removeBookmark(slug: string): Promise<void> {
  const current = await getBookmarks();
  await SecureStore.setItemAsync(BOOKMARKS_KEY, JSON.stringify(current.filter((s) => s !== slug)));
}

export async function isBookmarked(slug: string): Promise<boolean> {
  const current = await getBookmarks();
  return current.includes(slug);
}

// ── Note cache ─────────────────────────────────────────────────────────────────

export async function cacheNote(note: NoteView): Promise<void> {
  try {
    const dir = getCacheDir();
    ensureCacheDir(dir);
    const file = new File(dir, `${note.slug}.json`);
    file.write(JSON.stringify(note));
  } catch { /* non-fatal */ }
}

export async function getCachedNote(slug: string): Promise<NoteView | null> {
  try {
    const dir = getCacheDir();
    const file = new File(dir, `${slug}.json`);
    if (!file.exists) return null;
    const raw = await file.text();
    return JSON.parse(raw) as NoteView;
  } catch { return null; }
}

export async function getCachedNoteSlugs(): Promise<string[]> {
  try {
    const dir = getCacheDir();
    if (!dir.exists) return [];
    return dir.list()
      .filter((item): item is File => item instanceof File && item.name.endsWith(".json"))
      .map((f) => f.name.replace(".json", ""));
  } catch { return []; }
}
