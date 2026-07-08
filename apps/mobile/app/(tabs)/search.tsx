import { useState, useEffect, useRef } from "react";
import {
  View, TextInput, ScrollView, Text, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { searchNotes } from "../../lib/data";
import type { SearchResult } from "../../lib/types";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const data = await searchNotes(query);
      setResults(data);
      setLoading(false);
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search notes…"
          placeholderTextColor="#4a5058"
          style={styles.input}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      {loading && <ActivityIndicator color="#5865f2" style={{ marginTop: 20 }} />}
      <ScrollView keyboardShouldPersistTaps="handled">
        {results.map((r) => (
          <TouchableOpacity
            key={r.slug}
            style={styles.result}
            onPress={() => router.push(`/notes/${r.slug}`)}
          >
            <Text style={styles.resultTitle}>{r.title}</Text>
            {r.summary && <Text style={styles.resultSummary} numberOfLines={2}>{r.summary}</Text>}
          </TouchableOpacity>
        ))}
        {!loading && query.trim() && results.length === 0 && (
          <Text style={styles.empty}>No results for "{query}"</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0d10" },
  inputRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#2a2e35" },
  input: {
    backgroundColor: "#131619", borderWidth: 1, borderColor: "#2a2e35",
    borderRadius: 8, padding: 10, color: "#e2e8f0", fontSize: 15,
  },
  result: {
    padding: 16, borderBottomWidth: 1, borderBottomColor: "#2a2e35",
  },
  resultTitle: { fontSize: 15, fontWeight: "500", color: "#e2e8f0" },
  resultSummary: { fontSize: 13, color: "#8b919a", marginTop: 3, lineHeight: 18 },
  empty: { textAlign: "center", color: "#8b919a", marginTop: 40, fontSize: 14 },
});
