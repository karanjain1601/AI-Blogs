import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import type { ImageBlock as ImageBlockType } from "@notes/blocks";
import { useTheme } from "../theme";

export function ImageBlock({ block }: { block: ImageBlockType }) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: block.src }}
        style={styles.image}
        contentFit="contain"
        transition={200}
        accessibilityLabel={block.alt}
      />
      {block.caption && (
        <Text style={[styles.caption, { color: theme.muted }]}>{block.caption}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  image: { width: "100%", height: 240, borderRadius: 8 },
  caption: { fontSize: 12, textAlign: "center", marginTop: 6 },
});
