import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { supabase } from "@/supabase";

interface PingItemProps {
    item: any;
    onCommentPress: (item: any) => void;
}

export default function PingItem({ item, onCommentPress }: PingItemProps) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [username, setUsername] = useState<string>("");

    // Aktuellen User laden
    useEffect(() => {
        const fetchUser = async () => {
            const { data: userData } = await supabase.auth.getUser();
            const { data: userInfo } = await supabase
                .from("profiles")
                .select("username")
                .eq("email", userData.user?.email)
                .single();
            if (userInfo) setUsername(userInfo.username);
        };
        fetchUser();
    }, []);


    useEffect(() => {
        const fetchLikes = async () => {
            const { data, error } = await supabase
                .from("likes")
                .select("likes")
                .eq("ping", item.id)
                .maybeSingle();

            if (error) {
                console.error(error);
                return;
            }

            const likesArray: string[] = data?.likes ?? [];
            setLikeCount(likesArray.length);
            setLiked(likesArray.includes(username));
        };

        if (username) fetchLikes();
    }, [username, item.id]);

    const handleLike = async () => {
        if (!username) return;

        try {
            // Aktuelles Array laden
            const { data } = await supabase
                .from("likes")
                .select("likes")
                .eq("ping", item.id)
                .maybeSingle();

            let likesArray: string[] = data?.likes ?? [];

            if (likesArray.includes(username)) {
                likesArray = likesArray.filter(u => u !== username);
                setLiked(false);
                setLikeCount(prev => prev - 1);
            } else {
                likesArray.push(username);
                setLiked(true);
                setLikeCount(prev => prev + 1);
            }

            // Upsert JSONB-Array
            const { error } = await supabase
                .from("likes")
                .upsert(
                    [{ ping: item.id, likes: likesArray }],
                    { onConflict: "ping" }
                );

            if (error) console.error(error);
        } catch (err) {
            console.error("Like error:", err);
        }
    };

    return (
        <View style={styles.item}>
            <View style={styles.itemHeaderView}>
                <Image source={item.userImage} style={styles.itemProfileImage} />
                <Text style={styles.itemProfileName}>{item.user}</Text>
            </View>

            {item.title &&(
                <Text style={styles.itemHeading}>{item.title}</Text>
            )}


            {item.image_url && (
                <Image style={styles.itemPic} source={item.image_url} contentFit="cover" />
            )}

            <View style={styles.bottomRow}>
                <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
                    <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={25}
                        color={liked ? "#e63946" : "#000"}
                    />
                    <Text style={{ marginLeft: 6 }}>{likeCount}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.commentButton} onPress={() => onCommentPress(item)}>
                    <Ionicons name="chatbubble-outline" size={25} color="#000" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
        alignItems: "center",
    },
    itemProfileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    itemProfileName: {
        fontSize: 16,
        color: "#000",
        fontWeight: "bold",
        marginLeft: 10,
    },
    itemHeading: {
        fontSize: 18,
        color: "#000",
        fontWeight: "600",
        marginTop: 5,
    },
    itemPic: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 15,
        marginTop: 10,
        alignSelf: "center",
    },
    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },
    likeButton: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 10,
    },
    commentButton: {
        flexDirection: "row",
        alignItems: "center",
    },
});