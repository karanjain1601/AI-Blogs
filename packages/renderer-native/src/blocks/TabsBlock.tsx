import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import type { TabsBlock as TabsBlockType } from "@notes/blocks";
import { BlockRenderer } from "../BlockRenderer";
import { useTheme } from "../theme";

export function TabsBlock({ block }: { block: TabsBlockType }) {
  const theme = useTheme();
  const [active, setActive] = useState(0);
  return (
    <View style={[styles.container, { borderColor: theme.border }]}>
      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        {block.tabs.map((tab, i) => (
          <TouchableOpacity key={i} onPress={() => setActive(i)} style={styles.tab}>
            <Text
              style={[
                styles.tabLabel,
                { color: i === active ? theme.accent : theme.muted },
                i === active && { borderBottomColor: theme.accent },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>
        <BlockRenderer blocks={block.tabs[active]?.blocks ?? []} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 8, marginBottom: 16, overflow: "hidden" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { paddingHorizontal: 14, paddingVertical: 8 },
  tabLabel: { fontSize: 13, fontWeight: "500" },
  content: { padding: 12 },
});
