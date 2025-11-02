import {
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function Search() {
    const communitys = [{ title: "oppenau" }, { title: "React Native" }, { title: "Expo" }, { title: "Turnen" }, { title: "Tiktok" }, { title: "Pepe der Frosch" }];
    const [searchText, setSearchText] = useState("");
    const [newCommunity, setNewCommunity] = useState("");
    const [addCommunity, setAddCommunity] = useState(false);

    const filteredCommunitys = communitys.filter((community) =>
        community.title.toLowerCase().includes(searchText.toLowerCase())
    );

    const renderItem = ({ item }: any) => {
        return (
            <View style={styles.itemContainer}>
                <Text style={styles.itemText}>{item.title}</Text>
                <TouchableOpacity style={styles.followButton} onPress={() => {}}>
                    <Text style={styles.buttonText}>Follow</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.heading}>Search</Text>

            <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search..."
                placeholderTextColor="#555"
                style={styles.searchInput}
            />

            <FlatList
                data={filteredCommunitys}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                style={{ width: "100%", height: "100%" }}
            />

            <TouchableOpacity style={styles.addButton} onPress={() => setAddCommunity(true)}>
                <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>

            <Modal transparent animationType={"fade"} visible={addCommunity}>
                <TouchableOpacity style={styles.overlay} onPress={() => setAddCommunity(false)}>
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View style={styles.modalContainer} >
                            <Text style={styles.modalHeading}>Add Community</Text>
                            <TextInput
                                value={newCommunity}
                                onChangeText={setNewCommunity}
                                placeholder={"new Community"}
                                placeholderTextColor="#555"
                                style={styles.input}
                            />
                            <TouchableOpacity style={styles.button}>
                                <Text style={styles.modalButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>

                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
    },

    heading: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#000",
        marginTop: Platform.OS === "ios" ? 0 : 20,
        textAlign: "center",
    },

    searchInput: {
        height: 40,
        width: "100%",
        borderWidth: 1,
        borderColor: "rgba(74, 144, 226, 0.1)",
        borderRadius: 20,
        marginTop: 20,
        paddingHorizontal: 15,
        color: "#000",
        backgroundColor: "#f9fafb",
    },

    itemContainer: {
        width: "90%",
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "rgba(74, 144, 226, 0.1)",
        borderRadius: 30,
        shadowColor: "#4a90e2",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 4,
        marginTop: 15,
        alignSelf: "center",
    },

    itemText: {
        fontSize: 16,
        color: "#000",
    },

    followButton: {
        backgroundColor: "#4a90e2",
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 10,
    },

    buttonText: {
        color: "#fff",
        fontSize: 15,
    },
    addButton: {
        backgroundColor: "#4a90e2",
        height: 60,
        width: 60,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 30,
        position: "absolute",
        right: 30,
        bottom: 90,
    },

    addButtonText: {
        color: "#fff",
        fontSize: 15,
    },

    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    modalContainer: {
        width: "90%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "rgba(74, 144, 226, 0.1)",
        shadowColor: "#4a90e2",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 4,
        padding: 16,
    },

    modalHeading: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#000",
        textAlign: "center",
    },

    input: {
        width: "90%",
        height: 50,
        borderWidth: 2,
        borderColor: "rgba(0,0,0, 0.3)",
        borderRadius: 15,
        marginVertical: 20,
        color: "#fff",
        padding: 10,
    },

    button: {
        width: "50%",
        backgroundColor: "#4a90e2",
        padding: 15,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
    },

    modalButtonText: {
        color: "#fff",
        fontSize: 15,
    },
});