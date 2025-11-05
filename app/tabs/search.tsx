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
import {useCallback, useState} from "react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { decode as atob } from "base-64";
import { supabase } from "@/supabase";
import {useFocusEffect} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CommunityListItem from "../../components/searchPagecomponent";

export default function Search() {
    const [communitys, setCommunitys] = useState<{title: string, image_url: string}[]>([]);

    const [searchText, setSearchText] = useState("");
    const [addCommunity, setAddCommunity] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newPictureUri, setNewPictureUri] = useState("");

    const filteredCommunitys = communitys.filter((community) =>
        community.title.toLowerCase().includes(searchText.toLowerCase())
    );

    useFocusEffect(
        useCallback(() => {
            const loadData = async() => {
                const {data, error} = await supabase
                    .from("communitys")
                    .select("*")

                if(error){
                    console.error(error)
                }else if (data){
                    setCommunitys(data)
                }
            }
            loadData()
        }, [])
    )


    const pickPicture = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setNewPictureUri(result.assets[0].uri);
        }
    };


    const uploadCommunity = async () => {
        if (!newTitle.trim()) {
            alert("Bitte gib einen Titel ein!");
            return;
        }

        if (!newPictureUri) {
            alert("Bitte wähle ein Bild aus!");
            return;
        }

        try {
            const filePath = `${newTitle}/${Date.now()}/image.jpg`;

            const fileBase64 = await FileSystem.readAsStringAsync(newPictureUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const bytes = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));

            const { error: uploadError } = await supabase.storage
                .from("community_pics")
                .upload(filePath, bytes, {
                    contentType: "image/jpeg",
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from("community_pics").getPublicUrl(filePath);
            const publicUrl = data.publicUrl;

            const { data: tableData, error: tableError } = await supabase
                .from("communitys")
                .insert({ title: newTitle, image_url: publicUrl });

            if (tableError) throw tableError;

            setCommunitys([...communitys, { title: newTitle, image_url: publicUrl }]);
            setAddCommunity(false);
            setNewTitle("");
            setNewPictureUri("");
        } catch (err) {
            console.log("Upload Error:", err);
            alert("Fehler beim Hochladen!");
        }
    };

    const renderItem = ({ item }: any) => <CommunityListItem item={item}/>;

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

            <Modal transparent animationType="fade" visible={addCommunity}>
                <TouchableOpacity style={styles.overlay} onPress={() => setAddCommunity(false)}>
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalHeading}>Add Community</Text>

                            <TouchableOpacity onPress={pickPicture}>
                                <Image
                                    source={
                                        newPictureUri
                                            ? { uri: newPictureUri }
                                            : require("../../assets/images/icon.png")
                                    }
                                    style={styles.newImage}
                                />
                            </TouchableOpacity>

                            <TextInput
                                value={newTitle}
                                onChangeText={setNewTitle}
                                placeholder="new Community"
                                placeholderTextColor="#555"
                                style={styles.input}
                            />

                            <TouchableOpacity style={styles.button} onPress={uploadCommunity}>
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
    container: { flex: 1, backgroundColor: "#fff", padding: 16 },
    heading: { fontSize: 25, fontWeight: "bold", color: "#000", marginTop: Platform.OS === "ios" ? 0 : 20, textAlign: "center" },
    searchInput: { height: 40, width: "100%", borderWidth: 1, borderColor: "rgba(74,144,226,0.1)", borderRadius: 20, marginTop: 20, paddingHorizontal: 15, color: "#000", backgroundColor: "#f9fafb" },
    itemContainer: { width: "90%", height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "rgba(74,144,226,0.1)", borderRadius: 30, shadowColor: "#4a90e2", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4, marginTop: 15, alignSelf: "center" },
    itemImage: {width: 50, height: 50, borderRadius: 25, marginHorizontal: 10},
    itemText: { fontSize: 16, color: "#000" },
    followButton: { backgroundColor: "#4a90e2", paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10 },
    buttonText: { color: "#fff", fontSize: 15 },
    addButton: { backgroundColor: "#4a90e2", height: 60, width: 60, alignItems: "center", justifyContent: "center", borderRadius: 30, position: "absolute", right: 30, bottom: 90 },
    addButtonText: { color: "#fff", fontSize: 25 },
    overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
    modalContainer: { width: "90%", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", borderRadius: 15, borderWidth: 1, borderColor: "rgba(74,144,226,0.1)", shadowColor: "#4a90e2", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4, padding: 16 },
    modalHeading: { fontSize: 25, fontWeight: "bold", color: "#000", textAlign: "center" },
    newImage: { height: 100, width: 100, borderRadius: 50, marginVertical: 10 },
    input: { width: "90%", height: 50, borderWidth: 2, borderColor: "rgba(0,0,0,0.3)", borderRadius: 15, marginVertical: 20, color: "#000", padding: 10 },
    button: { width: "50%", backgroundColor: "#4a90e2", padding: 15, borderRadius: 15, alignItems: "center", justifyContent: "center" },
    modalButtonText: { color: "#fff", fontSize: 15 },
});