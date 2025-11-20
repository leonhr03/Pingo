import {
    Text,
    StyleSheet,
    Platform,
    FlatList,
    Modal,
    View,
    TouchableWithoutFeedback,
    TextInput,
    TouchableOpacity, ScrollView
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import PingItem from "@/components/pingItem";
import React, {useCallback, useState} from "react";
import {useFocusEffect} from "expo-router";
import {supabase} from "@/supabase";
import {Image} from "expo-image";

export default function Explore() {
    const [pings, setPings] = useState<any[]>([])
    const [currentPing, setCurrentPing] = useState<any>(null)
    const [comments, setComments] = useState<any[]>([])
    const [commentSheet, setCommentSheet] = useState(false)
    const [newComment, setNewComment] = useState("")

    useFocusEffect(
        useCallback(() => {
            loadPings()
        },[])
    )

    const loadPings = async() => {
        const {data: pingsData} = await supabase
            .from("pings")
            .select("*")
            .order("created_at", { ascending: false })

        setPings(pingsData ?? [])
    }

    const openCommentSheet = async (item: any) => {
        setCurrentPing(item);

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

    return(
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.heading}>Explore</Text>
            <FlatList
                data={pings}
                renderItem={({ item }) => <PingItem item={item} onCommentPress={openCommentSheet} />}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{ paddingBottom: 100 }}
                scrollEnabled={false}
            />

            </ScrollView>
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
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },

    heading: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#000",
        marginTop: Platform.OS === "ios" ? 0 : 20,
        marginBottom: 20,
        textAlign: "left",
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


})