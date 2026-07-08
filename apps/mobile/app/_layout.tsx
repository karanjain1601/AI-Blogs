import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
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
