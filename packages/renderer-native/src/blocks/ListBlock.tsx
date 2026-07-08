import { View, StyleSheet } from "react-native";
import type { ListBlock as ListBlockType } from "@notes/blocks";
import { RichText } from "../RichText";
import { useTheme } from "../theme";

export function ListBlock({ block }: { block: ListBlockType }) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {block.items.map((item, i) => (
        <View key={i} style={styles.item}>
          <RichText
            content={block.ordered ? `${i + 1}.` : "•"}
            style={{ color: theme.muted, width: 24, flexShrink: 0 }}
          />
          <RichText content={item} style={{ color: theme.fg, flex: 1 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  item: { flexDirection: "row", gap: 6, marginBottom: 4 },
});
