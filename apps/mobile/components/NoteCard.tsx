import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import type { NoteView } from "../lib/types";

interface Props { note: NoteView; showTopic?: boolean; }

export function NoteCard({ note }: Props) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/notes/${note.slug}`)}
      activeOpacity={0.7}
    >
      <Text style={styles.title} numberOfLines={2}>{note.title}</Text>
      {note.summary && <Text style={styles.summary} numberOfLines={2}>{note.summary}</Text>}
      <View style={styles.meta}>
        {note.readingTime > 0 && (
          <Text style={styles.metaText}>{note.readingTime} min read</Text>
        )}
        {note.tags.slice(0, 2).map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#131619",
    borderWidth: 1, borderColor: "#2a2e35",
    borderRadius: 10, padding: 14, marginBottom: 10,
  },
  title: { fontSize: 15, fontWeight: "600", color: "#e2e8f0", marginBottom: 4 },
  summary: { fontSize: 13, color: "#8b919a", lineHeight: 18, marginBottom: 8 },
  meta: { flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" },
  metaText: { fontSize: 11, color: "#8b919a" },
  tag: { backgroundColor: "#2a2e35", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 11, color: "#8b919a" },
});
