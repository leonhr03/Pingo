import {
    Text,
    StyleSheet,
    Platform,
    FlatList,
    View,
    TouchableOpacity,
    TouchableWithoutFeedback, Modal, TextInput, ScrollView
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import React, { useCallback, useState} from "react";
import {useFocusEffect, useRouter} from "expo-router";
import {supabase} from "@/supabase";
import {Image} from "expo-image";
import PingItem from "@/components/pingItem";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import {decode as atob} from "base-64";

interface CommunityContent{
    title: string;
    image_url: string;
}

export default function Home(){

    const router = useRouter()
    const [communitys, setCommunitys] = useState<CommunityContent[]>([])
    const [pings, setPings] = useState<any[]>([])
    const [currentPing, setCurrentPing] = useState<any>(null)
    const [currentCommunity, setCurrentCommunity] = useState<any>(null)
    const [comments, setComments] = useState<any[]>([])
    const [commentSheet, setCommentSheet] = useState(false)
    const [newComment, setNewComment] = useState("")
    const [addModal, setAddModal] = useState(false)
    const [newPictureUri, setNewPictureUri] = useState<string | null>(null);
    const [newTitle, setNewText] = useState("");

    useFocusEffect(
        useCallback(() => {
            loadCommunitys()
        }, [])
    )

    const loadCommunitys = async() => {

        const {data} = await supabase.auth.getUser()
        if(!data.user) return;
        const currentUserId = data.user.id;

        const {data: communitysData} = await supabase
            .from("communitys")
            .select("*")
        if(!communitysData) return;

        const {data: profilData} = await supabase.from("profiles")
            .select("followed")
            .eq("id", currentUserId)
            .single()

        if(!profilData) return;
        const followedData = profilData.followed || [];

        const followedCommunitys = communitysData.filter(c => followedData.includes(c.title))
        setCommunitys(followedCommunitys)
    }

    const loadPings = async(item: any) => {

        setCurrentCommunity(item);

        const { data, error } = await supabase
            .from("communitys")
            .select("*")
            .eq("title", item.title)
            .single();

        if (error) {
            console.error("Load community error:", error);
            return;
        }

        const pings = data?.pings ?? []

        if(pings.length === 0){
            setCurrentCommunity(null)
        }

        setPings(pings);

    }

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

    const uploadPing = async () => {
        if (!newPictureUri || !newTitle.trim()) return;

        try {
            const filePath = `${currentCommunity.title}/${Date.now()}.jpg`;

            const fileBase64 = await FileSystem.readAsStringAsync(newPictureUri, {
                encoding: "base64",
            });

            const fileBytes = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));

            const { error: uploadError } = await supabase.storage
                .from("ping_pics")
                .upload(filePath, fileBytes, { contentType: "image/jpeg", upsert: true });

            if (uploadError) {
                console.error("Upload error:", uploadError);
                return;
            }

            const { data: urlData } = supabase.storage.from("ping_pics").getPublicUrl(filePath);
            const publicUrl = urlData.publicUrl;

            const { data: communityData, error: fetchError } = await supabase
                .from("communitys")
                .select("pings")
                .eq("title", currentCommunity.title)
                .maybeSingle();

            if (fetchError || !communityData) {
                console.error("Fetch pings error:", fetchError);
                return;
            }

            const { data: userData } = await supabase.auth.getUser();
            const { data: userInfo } = await supabase
                .from("profiles")
                .select("*")
                .eq("email", userData.user?.email)
                .single();

            const user = userInfo;
            const currentPings = communityData.pings ?? [];

            const newList = [
                { title: newTitle, image_url: publicUrl, user: user?.username, userImage: user?.avatar_url },
                ...currentPings,
            ];

            const { error: updateError } = await supabase
                .from("communitys")
                .update({ pings: newList })
                .eq("title", currentCommunity.title)
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

    const openCommentSheet = async (item: any) => {
        setCurrentCommunity(item.title);

        const { data: commentsData, error: commentsError } = await supabase
            .from("comments")
            .select("comments")
            .eq("ping", item.title)
            .maybeSingle();

        setComments(commentsError ? [] : commentsData?.comments ?? []);
        setCommentSheet(true);
    };

    const addComment = async () => {
        if (!currentPing || !newComment.trim()) return;

        try {
            const { data: userData } = await supabase.auth.getUser();
            const { data: userInfo } = await supabase
                .from("profiles")
                .select("*")
                .eq("email", userData.user?.email)
                .single();

            const user = userInfo;

            const newEntry = { comment: newComment.trim(), user: user.username, userImage: user.avatar_url };
            const updatedList = [...comments, newEntry];

            const { error } = await supabase
                .from("comments")
                .upsert({ ping: currentPing, comments: updatedList }, { onConflict: "ping" });

            if (error) {
                console.error("addComment error:", error);
                return;
            }

            setComments(updatedList);
            setNewComment("");
        } catch (err) {
            console.error("Unexpected addComment error:", err);
        }
    };


    const communityItem = ({ item }: any) => {
        return (
            <TouchableOpacity style={styles.communityItem} onPress={() => loadPings(item)}>
                <Image
                    style={styles.communityPic}
                    source={item.image_url}
                    contentFit="contain"
                />
                <Text style={styles.communityText}>{item.title}</Text>
            </TouchableOpacity>
        );
    };


    return(
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.heading}>Communitys</Text>

                <FlatList
                    data={communitys}
                    renderItem={communityItem}
                    style={styles.communityListBackground}
                    contentContainerStyle={{ paddingRight: 30 }}
                    horizontal/>

                {currentCommunity
                    ? (
                        <FlatList
                            data={pings}
                            renderItem={({ item }) => <PingItem item={item} onCommentPress={openCommentSheet} />}
                            keyExtractor={(item, index) => index.toString()}
                            contentContainerStyle={{ paddingBottom: 100 }}
                        />
                    )
                    : (
                        <Text style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
                            No Pings Found
                            (select a community)
                        </Text>
                    )
                }
            </ScrollView>


                <TouchableOpacity style={styles.button} onPress={() => setAddModal(true)}>
                    <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>

            <Modal transparent visible={commentSheet} animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableWithoutFeedback onPress={() => setCommentSheet(false)}>
                        <View style={{ flex: 1 }} />
                    </TouchableWithoutFeedback>

                    <View style={styles.commentContainer}>
                        <Text style={styles.commentHeading}>{currentPing?.title ?? ""}</Text>

                        <FlatList
                            data={comments}
                            renderItem={({ item }) => (
                                <View style={styles.commentItem}>
                                    <View style={styles.itemHeaderView}>
                                        <Image source={item.userImage} style={styles.itemProfileImage} />
                                        <Text style={styles.itemProfileName}>{item.user}</Text>
                                    </View>
                                    <Text style={styles.comment}>{item.comment}</Text>
                                </View>
                            )}
                            keyExtractor={(item, index) => index.toString()}
                            style={{ width: "100%", flex: 1 }}
                            contentContainerStyle={{ paddingBottom: 80 }}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                        />

                        <View style={styles.bottomRow}>
                            <TextInput
                                value={newComment}
                                onChangeText={setNewComment}
                                placeholder="Comment..."
                                placeholderTextColor="#000"
                                style={styles.input}
                            />
                            <TouchableOpacity style={styles.addCommentButton} onPress={addComment}>
                                <Text style={styles.addCommentButtonText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
                                    source={newPictureUri ? newPictureUri : require("../../assets/images/addIcon.png")}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={uploadPing}>
                                <Text style={styles.modalButtonText}>add</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>


        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#fff",
    },

    heading: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#000",
        marginTop: Platform.OS === "ios" ? 0 : 20,
        textAlign: "left",
    },

    communityListBackground: {
        flexDirection: "row",
        height: 100,
        width: "100%",
        marginTop: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(74, 144, 226, 0.1)",
        borderRadius: 30,
        backgroundColor: "#f9fafb",
        shadowOffset: { width: 0, height: 4 },
        shadowColor: "#4a90e2",
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 4,
        padding: 10,
    },
    itemContainer: {
        width: "90%",
        height: 60,
        flexDirection: "row",
        padding: 10,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "rgba(74, 144, 226, 0.1)",
        borderRadius: 30,
        shadowColor: "#4a90e2",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 4,
        marginTop: 15,
        justifyContent: "space-between",
        alignItems: "center",
        alignSelf: "center"
    },

    itemText: {
        position: "absolute",
        left: 80,
    },

    itemIcon: {
        position: "absolute",
        right: 20,
    },

    communityItem: {
        marginHorizontal: 5,
        flexDirection: "column",
        alignItems: "center",
    },

    communityPic: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },

    communityText: {
        fontSize: 12,
        color: "#000",
        textAlign: "center",
        marginTop: 10,
    },


    commentContainer: {
        minHeight: "80%",
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
    commentHeading: { fontSize: 25, color: "#000", fontWeight: "bold" },
    input: {
        alignSelf: "center",
        width: "80%",
        height: 50,
        padding: 16,
        borderRadius: 20,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "rgba(74, 144, 226, 0.1)",
        shadowColor: "#4A90E2",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    addCommentButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#4a90e2",
        marginHorizontal: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    addCommentButtonText: { fontSize: 18, color: "#fff", fontWeight: "bold" },

    commentItem: {
        width: "100%",
        backgroundColor: "#f9fafb",
        minHeight: 60,
        borderWidth: 1,
        borderColor: "rgba(74, 144, 226, 0.3)",
        borderRadius: 15,
        justifyContent: "center",
        padding: 10,
        marginVertical: 5,
    },

    comment: {
        color: "#000",
        fontSize: 18,
        flexWrap: "wrap",
        marginTop: 5,
    },

    itemHeaderView: { width: "100%", height: 60, flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 0 },
    itemProfileImage: { width: 40, height: 40, borderRadius: 20, position: "absolute", left: 0 },
    itemProfileName: { fontSize: 16, color: "#000", fontWeight: "bold", position: "absolute", left: 50 },
    bottomRow: { width: "100%", flexDirection: "row", alignSelf: "center", alignItems: "flex-end", marginTop: 10 },

    button: {
        position: "absolute", right: 30, bottom: 90,
        alignSelf: "center",
        height: 60,
        width: 60,
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
})