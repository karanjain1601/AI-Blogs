import { View, StyleSheet } from "react-native";
import type { ColumnsBlock as ColumnsBlockType } from "@notes/blocks";
import { BlockRenderer } from "../BlockRenderer";

export function ColumnsBlock({ block }: { block: ColumnsBlockType }) {
  return (
    <View style={styles.row}>
      {block.columns.map((col, i) => (
        <View key={i} style={styles.col}>
          <BlockRenderer blocks={col.blocks} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, marginBottom: 16 },
  col: { flex: 1 },
});
