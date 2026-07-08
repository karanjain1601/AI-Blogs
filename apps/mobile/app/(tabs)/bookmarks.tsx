import { useState, useCallback } from "react";
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { getBookmarks, getCachedNote } from "../../lib/storage";
import { getNoteBySlug } from "../../lib/data";
import { NoteCard } from "../../components/NoteCard";
import type { NoteView } from "../../lib/types";

export default function BookmarksScreen() {
  const [notes, setNotes] = useState<NoteView[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setLoading(true);
        const slugs = await getBookmarks();
        const loaded = await Promise.all(
          slugs.map(async (slug) => {
            const live = await getNoteBySlug(slug);
            return live ?? (await getCachedNote(slug));
          }),
        );
        if (!cancelled) {
          setNotes(loaded.filter(Boolean) as NoteView[]);
          setLoading(false);
        }
      }
      load();
      return () => { cancelled = true; };
    }, []),
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Saved Notes</Text>
      {loading ? (
        <ActivityIndicator color="#5865f2" style={{ marginTop: 40 }} />
      ) : notes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No bookmarks yet.</Text>
          <Text style={styles.emptyHint}>Tap the bookmark icon on any note to save it.</Text>
        </View>
      ) : (
        notes.map((note) => <NoteCard key={note.slug} note={note} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#0b0d10" },
  content: { padding: 16 },
  heading: { fontSize: 22, fontWeight: "700", color: "#e2e8f0", marginBottom: 16 },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 15, color: "#8b919a" },
  emptyHint: { fontSize: 12, color: "#4a5058", textAlign: "center" },
});
