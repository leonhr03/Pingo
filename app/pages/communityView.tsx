import { SafeAreaView } from "react-native-safe-area-context";
import {
    Text,
    StyleSheet,
    Platform,
    View,
    TouchableOpacity,
    FlatList,
    Modal,
    TouchableWithoutFeedback,
    TextInput,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import { supabase } from "@/supabase";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { decode as atob } from "base-64";

export default function CommunityView() {
    const router = useRouter();
    const title = useLocalSearchParams();

    const [pings, setPings] = useState<any[]>([]);
    const [addModal, setAddModal] = useState(false);
    const [newPictureUri, setNewPictureUri] = useState<string | null>(null);
    const [newTitle, setNewText] = useState("");

    // Community laden
    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                if (!title.community) return;

                const { data, error } = await supabase
                    .from("communitys")
                    .select("*")
                    .eq("title", title.community)
                    .single();

                if (error) {
                    console.error("Load community error:", error);
                    return;
                }

                if (!data) {
                    console.warn("Community not found.");
                    setPings([]);
                    return;
                }

                setPings(data.pings ?? []);
            };

            loadData();
        }, [title.community])
    );

    // Bild auswählen
    const chooseImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setNewPictureUri(result.assets[0].uri);
        }
    };

    // Ping hochladen
    const uploadPing = async () => {
        if (!newPictureUri || !newTitle.trim()) return;

        try {
            const filePath = `${title.community}/${Date.now()}.jpg`;

            // Base64 aus der Datei lesen
            const fileBase64 = await FileSystem.readAsStringAsync(newPictureUri, {
                encoding: "base64",
            });

            // Base64 zu Uint8Array konvertieren
            const fileBytes = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));

            // Bild hochladen
            const { error: uploadError } = await supabase.storage
                .from("ping_pics")
                .upload(filePath, fileBytes, { contentType: "image/jpeg", upsert: true });

            if (uploadError) {
                console.error("Upload error:", uploadError);
                return;
            }

            // Public URL abrufen
            const { data: urlData } = supabase.storage.from("ping_pics").getPublicUrl(filePath);
            const publicUrl = urlData.publicUrl;

            // Aktuelle Pings laden
            const { data: communityData, error: fetchError } = await supabase
                .from("communitys")
                .select("pings")
                .eq("title", title.community)
                .maybeSingle();

            if (fetchError || !communityData) {
                console.error("Fetch pings error:", fetchError);
                return;
            }

            //userdata
            const {data: userData} = await supabase.auth.getUser();
            const {data: userInfo} = await supabase
                .from("profiles")
                .select("*")
                .eq("email" , userData.user?.email)
                .single()

            const user = userInfo;

            const currentPings = communityData.pings ?? [];

            // Neues Ping hinzufügen
            const newList = [{ title: newTitle, image_url: publicUrl, user: user?.username, userImage: user?.avatar_url }, ...currentPings];

            // DB Update
            const { error: updateError } = await supabase
                .from("communitys")
                .update({ pings: newList })
                .eq("title", title.community)
                .select();

            if (updateError) {
                console.error("Update pings error:", updateError);
                return;
            }


            setPings(newList);
            setNewPictureUri(null);
            setNewText("");
            setAddModal(false);
        } catch (err) {
            console.error("Unexpected error:", err);
        }
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.item}>
            <View style={styles.itemHeaderView}>
                <Image
                    source={item.userImage}
                    style={styles.itemProfileImage}
                />
                <Text style={styles.itemProfileName}>{item.user}</Text>
            </View>
            <Text style={styles.itemHeading}>{item.title}</Text>
            {item.image_url ? (
                <Image style={styles.itemPic} source={item.image_url} contentFit="cover" />
            ) : (
                <Image
                    style={styles.itemPic}
                    source={require("../../assets/images/icon.png")}
                    contentFit="contain"
                />
            )}

            <View style={styles.bottomRow}>
                <TouchableOpacity style={styles.commentButton} onPress={() => alert("comming soon")}>
                    <Ionicons name="heart-outline" size={25} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.commentButton} onPress={() => alert("comming soon")}>
                    <Ionicons name="chatbubble-outline" size={25} color="#000" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.icon} onPress={() => router.replace("/tabs")}>
                    <Ionicons name="arrow-back" size={30} color="#000" />
                </TouchableOpacity>
                <Image source={title.image} style={styles.image} />
                <Text style={styles.heading}>{title.community}</Text>
            </View>

            <FlatList
                data={pings}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{ paddingBottom: 100 }}
            />

            <View style={styles.buttonWrapper}>
                <TouchableOpacity style={styles.button} onPress={() => setAddModal(true)}>
                    <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
            </View>

            <Modal transparent visible={addModal} animationType="slide">
                <TouchableOpacity style={{ flex: 1, justifyContent: "flex-end" }} onPress={() => setAddModal(false)}>
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalHeading}>Add Ping</Text>
                            <TextInput
                                value={newTitle}
                                onChangeText={setNewText}
                                placeholder="Title"
                                placeholderTextColor="#000"
                                style={styles.modalInput}
                            />
                            <TouchableOpacity onPress={chooseImage}>
                                <Image
                                    style={styles.modalImage}
                                    source={newPictureUri ? newPictureUri : require("../../assets/images/icon.png")}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={() => uploadPing()}>
                                <Text style={styles.modalButtonText}>add</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#fff" },
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 4,
        marginBottom: 5,
    },
    icon: { position: "absolute", left: 10 },
    heading: { fontSize: 25, color: "#000", fontWeight: "bold" },
    image: { width: 40, height: 40, borderRadius: 20, position: "absolute", left: 50 },
    buttonWrapper: { position: "absolute", bottom: 20, left: 0, right: 0, alignItems: "center", zIndex: 10 },
    button: {
        position: "absolute",
        bottom: 20,
        alignSelf: "center",
        height: 50,
        width: 80,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#4a90e2",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 10,
    },
    buttonText: { fontSize: 25, color: "#fff", fontWeight: "bold" },
    item: {
        width: "90%",
        backgroundColor: "#f9fafb",
        borderColor: "rgba(74,144,226,0.2)",
        borderWidth: 1,
        borderRadius: 15,
        shadowColor: "#4a90e2",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 4,
        padding: 16,
        paddingTop: 0,
        alignSelf: "center",
        marginTop: 10,
    },

    itemHeaderView: {
        width: "100%",
        height: 60,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        padding: 0,
    },

    itemProfileImage: {
        width: 40, height: 40, borderRadius: 20, position: "absolute", left: 0
    },

    itemProfileName: {
        fontSize: 16,
        color: "#000",
        fontWeight: "bold",
        position: "absolute",
        left: 50,
    },

    itemHeading: { fontSize: 18, color: "#000", textAlign: "left", fontWeight: "600" },
    itemPic: { width: "100%", aspectRatio: 1, borderRadius: 15, marginTop: 10, alignSelf: "center" },
    modalContainer: {
        minHeight: "60%",
        width: "100%",
        backgroundColor: "#f9fafb",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    modalHeading: { fontSize: 25, color: "#000", fontWeight: "bold", marginBottom: 20 },
    modalInput: { width: "90%", height: 60, backgroundColor: "#fff", borderWidth: 1, borderColor: "#000", borderRadius: 15, padding: 10 },
    modalImage: { width: 300, height: 300, borderRadius: 30, marginTop: 20 },
    modalButton: { width: "70%", height: 50, backgroundColor: "#4a90e2", borderRadius: 15, alignItems: "center", justifyContent: "center", marginTop: 20 },
    modalButtonText: { fontSize: 20, color: "#fff", fontWeight: "bold" },

    bottomRow: {
        width: "100%",
        flexDirection: "row",
        alignSelf: "center",
        alignItems: "flex-end",
        marginTop: 10,
    },

    commentButton: {
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        marginHorizontal: 5,
    }
});