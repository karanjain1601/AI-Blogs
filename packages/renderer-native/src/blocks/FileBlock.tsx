import { View, TouchableOpacity, StyleSheet } from "react-native";
import type { FileBlock as FileBlockType } from "@notes/blocks";
import { RichText } from "../RichText";
import { useTheme } from "../theme";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";

export function FileBlock({ block }: { block: FileBlockType }) {
  const theme = useTheme();

  const handleDownload = async () => {
    try {
      const downloaded = await File.downloadFileAsync(block.src, Paths.cache);
      await Sharing.shareAsync(downloaded.uri);
    } catch { /* non-fatal */ }
  };

  return (
    <TouchableOpacity
      onPress={handleDownload}
      style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <RichText content="📎" style={{ fontSize: 20 }} />
      <View style={styles.info}>
        <RichText content={block.name} style={{ color: theme.fg, fontWeight: "500" }} />
        {block.size && (
          <RichText content={block.size} style={{ color: theme.muted, fontSize: 12 }} />
        )}
      </View>
      <RichText content="↓" style={{ color: theme.accent }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  info: { flex: 1 },
});
