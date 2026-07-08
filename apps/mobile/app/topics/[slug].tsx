import { useEffect, useState } from "react";
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { getTopics, getNotesInTopic, childTopics } from "../../lib/data";
import { TopicRow } from "../../components/TopicRow";
import { NoteCard } from "../../components/NoteCard";
import type { TopicView, NoteView } from "../../lib/types";

export default function TopicScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const navigation = useNavigation();
  const [topic, setTopic] = useState<TopicView | null>(null);
  const [subtopics, setSubtopics] = useState<TopicView[]>([]);
  const [notes, setNotes] = useState<NoteView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [allTopics, topicNotes] = await Promise.all([
        getTopics(),
        getNotesInTopic(slug),
      ]);
      const found = allTopics.find((t) => t.slug === slug) ?? null;
      setTopic(found);
      setSubtopics(childTopics(slug, allTopics));
      setNotes(topicNotes);
      if (found) navigation.setOptions({ title: found.name });
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return <ActivityIndicator color="#5865f2" style={styles.loader} />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {topic?.description && (
        <Text style={styles.description}>{topic.description}</Text>
      )}
      {subtopics.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Topics</Text>
          {subtopics.map((t) => <TopicRow key={t.slug} topic={t} />)}
        </View>
      )}
      {notes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes</Text>
          {notes.map((n) => <NoteCard key={n.slug} note={n} />)}
        </View>
      )}
      {subtopics.length === 0 && notes.length === 0 && (
        <Text style={styles.empty}>No content in this topic yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, marginTop: 60 },
  scroll: { flex: 1, backgroundColor: "#0b0d10" },
  content: { padding: 16 },
  description: { fontSize: 14, color: "#8b919a", marginBottom: 16, lineHeight: 20 },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: "600", letterSpacing: 0.8,
    textTransform: "uppercase", color: "#8b919a", marginBottom: 8,
  },
  empty: { textAlign: "center", color: "#8b919a", marginTop: 40, fontSize: 14 },
});
