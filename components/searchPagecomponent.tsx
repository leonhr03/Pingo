import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import {supabase} from "@/supabase";

interface CommunityItemProps {
    item: { id: string; title: string; image_url: string };
}

export default function CommunityListItem({ item }: CommunityItemProps) {
    const [userId, setUserId] = useState<string | null>(null);
    const [isFollowed, setIsFollowed] = useState(false);
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            const {data, error} = await supabase.auth.getUser();
            if (error) {
                console.error(error);
                return;
            }
            if (data.user) {
                setUserId(data.user.id);
            }
        };
        loadData();
    }, []);


    useEffect(() => {
        if (!userId) return;

        const loadFollow = async () => {
            const {data} = await supabase
                .from("profiles")
                .select("followed")
                .eq("id", userId)
                .single();

            const followedArray: string[] = data?.followed || [];

            setIsFollowed(followedArray.includes(item.title));
        };

        loadFollow();
        setIsLoading(false)
    }, [userId]);

    const toggleFollow = async () => {

        const {data} = await supabase
            .from("profiles")
            .select("followed")
            .eq("id", userId)
            .single()

        const followedArray: string[] = data?.followed || [];
        let newArray: string[];

        if (followedArray.includes(item.title)) {

            newArray = followedArray.filter(title => title !== item.title);
            setIsFollowed(false);
        } else {
            newArray = [...followedArray, item.title];
            setIsFollowed(true);
        }

        const {error: updateError} = await supabase
            .from("profiles")
            .update({followed: newArray})
            .eq("id", userId)

        if (updateError) console.error(updateError)

    };

    if (!isLoading) {
        return (
            <View style={styles.itemContainer}>
                <Image
                    source={item.image_url ? {uri: item.image_url} : require("../assets/images/icon.png")}
                    style={styles.itemImage}
                />
                <Text style={styles.itemText}>{item.title}</Text>
                <TouchableOpacity
                    style={[styles.followButton, {backgroundColor: isFollowed ? "#999" : "#4a90e2"}]}
                    onPress={toggleFollow}
                >
                    <Text style={styles.buttonText}>{isFollowed ? "Following" : "Follow"}</Text>
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = StyleSheet.create({
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

    itemImage: { width: 50, height: 50, borderRadius: 25 },
    itemText: { fontSize: 16, color: "#000", position: "absolute", left: 80 },
    followButton: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, position: "absolute", right: 20 },
    buttonText: { color: "#fff", fontSize: 15 }
});