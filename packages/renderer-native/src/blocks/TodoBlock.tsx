import { View, StyleSheet } from "react-native";
import type { TodoBlock as TodoBlockType } from "@notes/blocks";
import { RichText } from "../RichText";
import { useTheme } from "../theme";

export function TodoBlock({ block }: { block: TodoBlockType }) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {block.items.map((item, i) => (
        <View key={i} style={styles.item}>
          <RichText
            content={item.checked ? "☑" : "☐"}
            style={{ color: item.checked ? theme.accent : theme.muted, width: 22 }}
          />
          <RichText
            content={item.text}
            style={{
              color: item.checked ? theme.muted : theme.fg,
              flex: 1,
              textDecorationLine: item.checked ? "line-through" : "none",
            }}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  item: { flexDirection: "row", gap: 6, marginBottom: 6 },
});
