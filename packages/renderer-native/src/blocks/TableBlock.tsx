import { View, Text, ScrollView, StyleSheet } from "react-native";
import type { TableBlock as TableBlockType } from "@notes/blocks";
import { useTheme } from "../theme";

export function TableBlock({ block }: { block: TableBlockType }) {
  const theme = useTheme();
  return (
    <ScrollView horizontal style={styles.scroll} showsHorizontalScrollIndicator>
      <View style={[styles.table, { borderColor: theme.border }]}>
        <View style={[styles.row, { backgroundColor: theme.surface }]}>
          {block.headers.map((h, i) => (
            <Text key={i} style={[styles.cell, styles.header, { color: theme.fg, borderColor: theme.border }]}>{h}</Text>
          ))}
        </View>
        {block.rows.map((row, ri) => (
          <View key={ri} style={[styles.row, ri % 2 === 0 ? {} : { backgroundColor: theme.surface }]}>
            {row.map((cell, ci) => (
              <Text key={ci} style={[styles.cell, { color: theme.fg, borderColor: theme.border }]}>{cell}</Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginBottom: 16 },
  table: { borderWidth: 1, borderRadius: 6, overflow: "hidden" },
  row: { flexDirection: "row" },
  cell: { minWidth: 100, padding: 8, fontSize: 13, borderRightWidth: 1, borderBottomWidth: 1 },
  header: { fontWeight: "600", fontSize: 12 },
});
