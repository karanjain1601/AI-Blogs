import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  requestPushPermission,
  registerPushToken,
  useNotificationDeepLink,
} from "../lib/notifications";

const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL ?? "https://your-web-app.vercel.app";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    requestPushPermission().then((token) => {
      if (token) {
        registerPushToken(token, WEB_URL);
      }
    });
  }, []);

  useNotificationDeepLink((slug) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(`/notes/${slug}` as any);
  });

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#131619" },
          headerTintColor: "#e2e8f0",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#0b0d10" },
        }}
      />
    </>
  );
}
