import { useEffect, useState, useCallback } from "react";
import {
  ScrollView, View, Text, TouchableOpacity,
  ActivityIndicator, Share, StyleSheet,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { BlockRenderer } from "@notes/renderer-native";
import { getNoteBySlug } from "../../lib/data";
import {
  cacheNote, isBookmarked, addBookmark, removeBookmark,
  getCachedNote,
} from "../../lib/storage";
import type { NoteView } from "../../lib/types";

export default function NoteScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const navigation = useNavigation();
  const [note, setNote] = useState<NoteView | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    async function load() {
      const [live, cached, bm] = await Promise.all([
        getNoteBySlug(slug),
        getCachedNote(slug),
        isBookmarked(slug),
      ]);
      const loaded = live ?? cached;
      setNote(loaded);
      setBookmarked(bm);
      if (loaded) {
        navigation.setOptions({
          title: loaded.title,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 12, marginRight: 4 }}>
              <TouchableOpacity onPress={() => handleShare(loaded)}>
                <Text style={{ fontSize: 18, color: "#5865f2" }}>↑</Text>
              </TouchableOpacity>
            </View>
          ),
        });
        if (live) await cacheNote(live);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  const toggleBookmark = useCallback(async () => {
    if (bookmarked) { await removeBookmark(slug); setBookmarked(false); }
    else { await addBookmark(slug); setBookmarked(true); }
  }, [bookmarked, slug]);

  const handleShare = useCallback(async (n: NoteView) => {
    try {
      await Share.share({ title: n.title, message: `${n.title}\n${n.summary ?? ""}` });
    } catch { /* non-fatal */ }
  }, []);

  if (loading) return <ActivityIndicator color="#5865f2" style={styles.loader} />;
  if (!note) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Note not found.</Text>
    </View>
  );

  const updated = note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{note.title}</Text>
        <TouchableOpacity onPress={toggleBookmark} style={styles.bookmark}>
          <Text style={[styles.bookmarkIcon, bookmarked && styles.bookmarkActive]}>
            {bookmarked ? "★" : "☆"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.meta}>
        {note.readingTime > 0 && (
          <Text style={styles.metaText}>{note.readingTime} min read</Text>
        )}
        {updated && <Text style={styles.metaText}>Updated {updated}</Text>}
      </View>
      {note.tags.length > 0 && (
        <View style={styles.tags}>
          {note.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.divider} />
      <BlockRenderer blocks={note.blocks} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, marginTop: 60 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#8b919a", fontSize: 15 },
  scroll: { flex: 1, backgroundColor: "#0b0d10" },
  content: { padding: 16, paddingBottom: 60 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  title: { flex: 1, fontSize: 24, fontWeight: "700", color: "#e2e8f0", lineHeight: 32 },
  bookmark: { paddingTop: 4 },
  bookmarkIcon: { fontSize: 22, color: "#8b919a" },
  bookmarkActive: { color: "#f1c40f" },
  meta: { flexDirection: "row", gap: 12, marginBottom: 10 },
  metaText: { fontSize: 12, color: "#8b919a" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  tag: { backgroundColor: "#2a2e35", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontSize: 11, color: "#8b919a" },
  divider: { height: 1, backgroundColor: "#2a2e35", marginBottom: 20 },
});
