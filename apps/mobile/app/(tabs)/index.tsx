import { useEffect, useState } from "react";
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { TopicRow } from "../../components/TopicRow";
import { getTopics, childTopics } from "../../lib/data";
import type { TopicView } from "../../lib/types";

export default function BrowseScreen() {
  const [topics, setTopics] = useState<TopicView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopics().then((t) => { setTopics(t); setLoading(false); });
  }, []);

  const roots = childTopics(null, topics);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Engineering Notes</Text>
      {loading ? (
        <ActivityIndicator color="#5865f2" style={{ marginTop: 40 }} />
      ) : roots.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Configure Supabase to browse topics.</Text>
          <Text style={styles.emptyHint}>Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env.local</Text>
        </View>
      ) : (
        roots.map((topic) => <TopicRow key={topic.slug} topic={topic} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#0b0d10" },
  content: { padding: 16 },
  heading: { fontSize: 22, fontWeight: "700", color: "#e2e8f0", marginBottom: 16 },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 15, color: "#8b919a", textAlign: "center" },
  emptyHint: { fontSize: 12, color: "#4a5058", textAlign: "center", lineHeight: 18 },
});
