import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import * as Clipboard from "expo-clipboard";
import type { CodeBlock as CodeBlockType } from "@notes/blocks";
import { useTheme } from "../theme";

export function CodeBlock({ block }: { block: CodeBlockType }) {
  const theme = useTheme();
  return (
    <View style={[styles.wrapper, { backgroundColor: theme.code, borderColor: theme.border }]}>
      {(block.filename || block.language) && (
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          {block.filename && (
            <Text style={[styles.filename, { color: theme.muted }]}>{block.filename}</Text>
          )}
          {block.language && !block.filename && (
            <Text style={[styles.filename, { color: theme.muted }]}>{block.language}</Text>
          )}
          <TouchableOpacity onPress={() => Clipboard.setStringAsync(block.content)}>
            <Text style={[styles.copy, { color: theme.accent }]}>Copy</Text>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <Text style={[styles.code, { color: theme.codeFg }]} selectable>
          {block.content}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: 8, borderWidth: 1, marginBottom: 16, overflow: "hidden" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  filename: { fontSize: 12 },
  copy: { fontSize: 12 },
  code: { fontFamily: "monospace", fontSize: 13, padding: 12, lineHeight: 20 },
});
