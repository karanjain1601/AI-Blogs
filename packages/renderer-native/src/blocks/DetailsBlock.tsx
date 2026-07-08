import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import type { DetailsBlock as DetailsBlockType } from "@notes/blocks";
import { BlockRenderer } from "../BlockRenderer";
import { RichText } from "../RichText";
import { useTheme } from "../theme";

export function DetailsBlock({ block }: { block: DetailsBlockType }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.container, { borderColor: theme.border }]}>
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        style={[styles.summary, { backgroundColor: theme.surface }]}
      >
        <RichText content={`${open ? "▾" : "▸"} ${block.summary}`} style={{ color: theme.fg, fontWeight: "500" }} />
      </TouchableOpacity>
      {open && (
        <View style={styles.body}>
          <BlockRenderer blocks={block.blocks} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 8, marginBottom: 12, overflow: "hidden" },
  summary: { padding: 10 },
  body: { padding: 12 },
});
