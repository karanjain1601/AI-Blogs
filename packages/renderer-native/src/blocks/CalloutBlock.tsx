import { View, StyleSheet } from "react-native";
import type { CalloutBlock as CalloutBlockType } from "@notes/blocks";
import { RichText } from "../RichText";
import { useTheme } from "../theme";

const ICONS: Record<string, string> = {
  note: "📝", info: "ℹ️", tip: "💡", warning: "⚠️", error: "🚨",
};

export function CalloutBlock({ block }: { block: CalloutBlockType }) {
  const theme = useTheme();
  const variant = block.variant ?? "note";
  const bg = theme.callout[variant as keyof typeof theme.callout] ?? theme.surface;
  const fg = theme.calloutFg[variant as keyof typeof theme.calloutFg] ?? theme.muted;
  return (
    <View style={[styles.container, { backgroundColor: bg, borderLeftColor: fg }]}>
      {block.title && (
        <RichText
          content={`${ICONS[variant] ?? "📌"} ${block.title}`}
          style={{ color: fg, fontWeight: "600", marginBottom: 4 }}
        />
      )}
      <RichText content={block.content} style={{ color: theme.fg, fontSize: 14 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderLeftWidth: 3, borderRadius: 6, padding: 12, marginBottom: 16 },
});
