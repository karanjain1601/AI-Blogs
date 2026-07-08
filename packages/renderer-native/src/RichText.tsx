import { Text, StyleSheet } from "react-native";
import { parseInline } from "./parseInline";
import { useTheme } from "./theme";

interface Props {
  content: string;
  style?: object;
  numberOfLines?: number;
}

export function RichText({ content, style, numberOfLines }: Props) {
  const theme = useTheme();
  const spans = parseInline(content);
  return (
    <Text style={[{ color: theme.fg, lineHeight: 24 }, style]} numberOfLines={numberOfLines}>
      {spans.map((span, i) => (
        <Text
          key={i}
          style={[
            span.bold && styles.bold,
            span.italic && styles.italic,
            span.code && { fontFamily: "monospace", backgroundColor: theme.code, color: theme.codeFg },
            span.href && { color: theme.accent },
          ]}
        >
          {span.text}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: "700" },
  italic: { fontStyle: "italic" },
});
