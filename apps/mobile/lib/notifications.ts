import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPushPermission(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // expo-notifications 57.x imports PermissionResponse from 'expo' which is not
  // re-exported in expo 52, so TypeScript can't see the inherited properties.
  // The properties exist at runtime; cast to access them.
  type PermResult = { granted: boolean };
  let { granted } = (await Notifications.getPermissionsAsync()) as unknown as PermResult;

  if (!granted) {
    ({ granted } = (await Notifications.requestPermissionsAsync()) as unknown as PermResult);
  }

  if (!granted) return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

export async function registerPushToken(
  token: string,
  apiBase: string,
): Promise<void> {
  const platform: "ios" | "android" =
    Platform.OS === "ios" ? "ios" : "android";
  try {
    await fetch(`${apiBase}/api/push/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform }),
    });
  } catch {
    // Non-fatal
  }
}

export function useNotificationDeepLink(
  onSlug: (slug: string) => void,
): void {
  const lastResponse = Notifications.useLastNotificationResponse();
  const onSlugRef = useRef(onSlug);
  onSlugRef.current = onSlug;

  useEffect(() => {
    const data = lastResponse?.notification.request.content.data as
      | { slug?: string }
      | undefined;
    if (data?.slug) onSlugRef.current(data.slug);
  }, [lastResponse]);
}
