import { Text, StyleSheet } from "react-native";
import type { HeadingBlock as HeadingBlockType } from "@notes/blocks";
import { useTheme } from "../theme";

const SIZES: Record<number, number> = { 1: 28, 2: 22, 3: 18, 4: 16, 5: 15, 6: 14 };

export function HeadingBlock({ block }: { block: HeadingBlockType }) {
  const theme = useTheme();
  const size = SIZES[block.level] ?? 16;
  return (
    <Text
      style={[styles.base, { fontSize: size, color: theme.fg, marginTop: block.level === 1 ? 0 : 20 }]}
      nativeID={block.content.toLowerCase().replace(/\s+/g, "-")}
    >
      {block.content}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { fontWeight: "700", marginBottom: 8 },
});
