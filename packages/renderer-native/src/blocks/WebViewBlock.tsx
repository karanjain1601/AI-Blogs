import { View, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useState } from "react";
import { useTheme } from "../theme";

interface Props {
  html: string;
  minHeight?: number;
}

export function WebViewBlock({ html, minHeight = 200 }: Props) {
  const theme = useTheme();
  const [height, setHeight] = useState(minHeight);
  const [loading, setLoading] = useState(true);

  const fullHtml = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
  html,body{margin:0;padding:0;background:${theme.bg};color:${theme.fg};font-family:system-ui,sans-serif;}
  * { box-sizing: border-box; }
</style>
</head><body>${html}
<script>
  function sendHeight(){document.title=document.body.scrollHeight;}
  window.addEventListener('load',sendHeight);
  setTimeout(sendHeight,500);
</script>
</body></html>`;

  return (
    <View style={[styles.container, { minHeight }]}>
      {loading && (
        <ActivityIndicator style={StyleSheet.absoluteFill} color={theme.accent} />
      )}
      <WebView
        originWhitelist={["*"]}
        source={{ html: fullHtml }}
        style={{ height, backgroundColor: theme.bg }}
        scrollEnabled={false}
        onLoadEnd={() => setLoading(false)}
        onMessage={(e) => {
          const h = parseInt(e.nativeEvent.data, 10);
          if (!isNaN(h) && h > 0) setHeight(h + 16);
        }}
        injectedJavaScript="window.ReactNativeWebView.postMessage(document.body.scrollHeight);"
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { marginBottom: 16 } });
