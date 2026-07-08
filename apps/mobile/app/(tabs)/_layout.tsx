import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#131619" },
        headerTintColor: "#e2e8f0",
        tabBarStyle: { backgroundColor: "#131619", borderTopColor: "#2a2e35" },
        tabBarActiveTintColor: "#5865f2",
        tabBarInactiveTintColor: "#8b919a",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Browse", tabBarLabel: "Browse" }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: "Search", tabBarLabel: "Search" }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{ title: "Bookmarks", tabBarLabel: "Saved" }}
      />
    </Tabs>
  );
}
