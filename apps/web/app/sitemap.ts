import type { MetadataRoute } from "next";
import { getNotes, getTopics, notePathHref } from "../lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-site.vercel.app";
  const [notes, topics] = await Promise.all([getNotes(), getTopics()]);
  const noteEntries: MetadataRoute.Sitemap = notes.map((note) => ({
    url: `${base}${notePathHref(note, topics)}`,
    lastModified: note.updatedAt ? new Date(note.updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/search`, changeFrequency: "monthly", priority: 0.3 },
    ...noteEntries,
  ];
}
