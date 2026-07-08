import { FlatList, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import type { GalleryBlock as GalleryBlockType } from "@notes/blocks";

const W = Dimensions.get("window").width;

export function GalleryBlock({ block }: { block: GalleryBlockType }) {
  return (
    <FlatList
      horizontal
      data={block.images}
      keyExtractor={(_, i) => String(i)}
      style={styles.list}
      renderItem={({ item }) => (
        <Image
          source={{ uri: item.src }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          accessibilityLabel={item.alt}
        />
      )}
      showsHorizontalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { marginBottom: 16 },
  image: { width: W * 0.7, height: 200, borderRadius: 8, marginRight: 8 },
});
