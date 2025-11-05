import {SafeAreaView} from "react-native-safe-area-context";
import {Text, StyleSheet, Platform, View, TouchableOpacity} from "react-native";
import { useLocalSearchParams, useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {Image} from "expo-image";

export default function CommunityView() {

    const router = useRouter()
    const title = useLocalSearchParams()

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header} >
                <TouchableOpacity style={styles.icon} onPress={() => router.replace("/tabs")}>
                    <Ionicons name="arrow-back" size={30} color="#000" />
                </TouchableOpacity>
                <Image
                    source={require("../../assets/images/icon.png")}
                    style={styles.image}
                />
                <Text style={styles.heading}>{title.community}</Text>
            </View>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        padding: 16,
        backgroundColor: "#fff",
    },

    header: {
        width: "100%",
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: Platform.OS === "ios" ? 0 : 10,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "rgba(74, 144, 226, 0.1)",
        borderRadius: 30,
        shadowColor: "#4a90e2",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 4,
        marginBottom: 20,
    },

    icon: {
        position: "absolute",
        left: 10,
    },

    heading: {
        fontSize: 25,
        color: "#000",
        fontWeight: "bold",
    },

    image: {
        width: 40,
        height: 40,
        borderRadius: 20,
        position: "absolute",
        left: 50,
    }

})