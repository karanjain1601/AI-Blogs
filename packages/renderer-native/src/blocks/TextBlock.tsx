import { View, StyleSheet } from "react-native";
import type { TextBlock as TextBlockType } from "@notes/blocks";
import { RichText } from "../RichText";
import { useTheme } from "../theme";

export function TextBlock({ block }: { block: TextBlockType }) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <RichText content={block.content} style={{ color: theme.fg, fontSize: 15, lineHeight: 26 }} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { marginBottom: 12 } });
