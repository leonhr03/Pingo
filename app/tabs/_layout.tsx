import {Tabs} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

export default function RootLayout(){
    return (
        <Tabs
            screenOptions={{
            headerShown: false,
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
                padding: 20,
                position: "absolute",
                justifyContent: "center",
            },

            tabBarLabelStyle: {
                color: "#000",
            }
        }}>
            <Tabs.Screen name="index" options={{
                tabBarLabel: "Home",
                tabBarIcon: ({color, size, focused}) => (
                    <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color}/>
                ),
            }}/>
            <Tabs.Screen name="search" options={{
                tabBarLabel: "Search",
                tabBarIcon: ({color, size, focused}) => (
                    <Ionicons name={focused ? "search" : "search-outline"} size={size} color={color}/>
                ),
            }}/>
            <Tabs.Screen name="account" options={{
                tabBarLabel: "You",
                tabBarIcon: ({color, size, focused}) => (
                    <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color}/>
                ),
            }}/>
        </Tabs>
    )
}