import { View, StyleSheet } from "react-native";
import { useTheme } from "../theme";

export function DividerBlock() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

const styles = StyleSheet.create({
  divider: { height: 1, marginVertical: 20 },
});
