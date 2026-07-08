import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import type { TopicView } from "../lib/types";

export function TopicRow({ topic }: { topic: TopicView }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/topics/${topic.slug}`)}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{topic.icon ?? "📁"}</Text>
      <Text style={styles.name}>{topic.name}</Text>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#131619", borderWidth: 1, borderColor: "#2a2e35",
    borderRadius: 10, padding: 14, marginBottom: 8, gap: 10,
  },
  icon: { fontSize: 18, width: 28 },
  name: { flex: 1, fontSize: 15, fontWeight: "500", color: "#e2e8f0" },
  arrow: { fontSize: 20, color: "#8b919a" },
});
