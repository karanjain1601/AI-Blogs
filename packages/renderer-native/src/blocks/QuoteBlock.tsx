import { View, StyleSheet } from "react-native";
import type { QuoteBlock as QuoteBlockType } from "@notes/blocks";
import { RichText } from "../RichText";
import { useTheme } from "../theme";

export function QuoteBlock({ block }: { block: QuoteBlockType }) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { borderLeftColor: theme.border }]}>
      <RichText content={block.content} style={{ color: theme.fg, fontStyle: "italic" }} />
      {block.cite && (
        <RichText content={`— ${block.cite}`} style={{ color: theme.muted, fontSize: 12, marginTop: 6 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 16 },
});
