import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function RootLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveTintColor: "#4a90e2",
                tabBarInactiveTintColor: "#555",
                tabBarStyle: {
                    backgroundColor: "#f9fafb",
                    height: 60,
                    borderWidth: 1,
                    borderColor: "rgba(74, 144, 226, 0.3)",
                    borderRadius: 30,
                    shadowOffset: { width: 0, height: 4 },
                    shadowColor: "#4a90e2",
                    shadowOpacity: 0.5,
                    shadowRadius: 5,
                    elevation: 4,
                    marginBottom: 20,
                    marginLeft: 10,
                    marginRight: 10,
                    paddingBottom: 10,
                    paddingTop: 10,
                    position: "absolute",
                },
                tabBarIconStyle: {
                    justifyContent: "center",
                    alignItems: "center",
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "home" : "home-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="explore"
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "compass" : "compass-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="add"
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "add" : "add-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="reels"
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "play-circle" : "play-circle-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="account"
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "person" : "person-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}