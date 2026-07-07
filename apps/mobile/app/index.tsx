import { Text, View } from "react-native";
import { BLOCK_TYPES } from "@notes/blocks";

export default function Home() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Engineering Notes</Text>
      <Text>Mobile reader — Phase 4 renders notes here.</Text>
      <Text>{BLOCK_TYPES.length} block types available.</Text>
    </View>
  );
}
