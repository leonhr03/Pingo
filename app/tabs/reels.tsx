import { SafeAreaView } from "react-native-safe-area-context";
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
import PagerView from "react-native-pager-view";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Video } from "expo-av";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/supabase";
import VideoItem from "@/components/videoItem";
import {Image} from "expo-image";


type VideoItem = {
    id: string;
    video_url: string;
    user_id: string;
    user_image: any;
    likes: string[];
};

export default function Reels() {
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const videoRefs = useRef<(Video | null)[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [commentSheet, setCommentSheet] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [comments, setComments] = useState<any[]>([]);

    // Reels laden
    useFocusEffect(
        useCallback(() => {
            const loadReels = async () => {
                try {
                    const { data, error } = await supabase
                        .from("reels")
                        .select("*")
                        .order("created_at", { ascending: false });

                    console.log(data)

                    if (error) {
                        console.error("Error fetching reels:", error);
                        return;
                    }

                    setVideos(data ?? []);
                } catch (err) {
                    console.error("Unexpected error:", err);
                }
            };
            loadReels();
        }, [])
    );

    useEffect(() => {
        videoRefs.current.forEach((ref, idx) => {
            if (!ref) return;
            if (idx === currentPage) ref.playAsync();
            else ref.pauseAsync();
        });
    }, [currentPage, videos]);

    const onPageSelected = (e: any) => {
        const page = e.nativeEvent.position;
        setCurrentPage(page);

        videoRefs.current.forEach((ref, idx) => {
            if (!ref) return;
            if (idx === page) ref.playAsync();
            else ref.pauseAsync();
            setIsPaused(false)
        });
    };

    const pause = (index: number) => {
        if (isPaused) {
            videoRefs.current[index]?.playAsync();
            setIsPaused(false);
        } else {
            videoRefs.current[index]?.pauseAsync();
            setIsPaused(true);
        }
    };

    const openCommentSheet = async () => {
        const { data: commentsData, error: commentsError } = await supabase
            .from("reels")
            .select("comments")
            .eq("id", videos[currentPage].id)
            .maybeSingle();
        if(!commentsError) {
            setComments(commentsData?.comments ?? [])
        }
        setCommentSheet(true);
    }

    const addComment = async () => {
        if (!newComment.trim()) return;

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

            const { error: uploadError } = await supabase
                .from("reels")
                .update({ comments: updatedList })
                .eq("id", videos[currentPage].id)

            if (uploadError) {
                console.error("Error uploading comments:", uploadError);
                return;
            }

            setComments(updatedList);
            setNewComment("");
        } catch (err) {
            console.error("Unexpected addComment error:", err);
        }
    };




    return (
        <View style={styles.container}>
            <PagerView
                style={{ flex: 1 }}
                initialPage={0}
                orientation="vertical"
                onPageSelected={onPageSelected}
            >
                {videos.map((item, index) => (

                    <VideoItem
                        key={item.id}
                        item={item}
                        index={index}
                        videoRefs={videoRefs}
                        isPaused={isPaused}
                        onPause={pause}
                        onComment={openCommentSheet}
                    />

                ))}
            </PagerView>

            <SafeAreaView style={styles.overlay}>
                <Text style={styles.heading}>Reels</Text>


                <Modal transparent visible={commentSheet} animationType="slide">
                    <View style={{ flex: 1, justifyContent: "flex-end" }}>
                        <TouchableWithoutFeedback onPress={() => setCommentSheet(false)}>
                            <View style={{ flex: 1 }} />
                        </TouchableWithoutFeedback>

                        <View style={styles.commentContainer}>
                            <Text style={styles.commentHeading}>Comments</Text>

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    heading: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#fff",
        marginTop: Platform.OS === "ios" ? 0 : 20,
    },
    overlay: {
        position: "absolute",
        top: 0,
        alignItems: "center",
        width: "100%",
        zIndex: 10,
        paddingVertical: 10,
    },

    playButtonContainer: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 20,
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
});