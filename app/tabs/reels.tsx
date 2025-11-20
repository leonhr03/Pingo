import { SafeAreaView } from "react-native-safe-area-context";
import { Dimensions, Platform, StyleSheet, Text, View } from "react-native";
import PagerView from "react-native-pager-view";
import { useCallback, useEffect, useRef, useState } from "react";
import { ResizeMode, Video } from "expo-av";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/supabase";

const { height, width } = Dimensions.get("window");

type VideoItem = {
    id: string;
    video_url: string;
    user_id: string;
};

export default function Reels() {
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const videoRefs = useRef<(Video | null)[]>([]);

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

    const onPageSelected = (e: any) => {
        const page = e.nativeEvent.position;
        setCurrentPage(page);

        videoRefs.current.forEach((ref, idx) => {
            if (!ref) return;
            if (idx === page) ref.playAsync();
            else ref.pauseAsync();
        });
    };

    useEffect(() => {
        videoRefs.current.forEach((ref, idx) => {
            if (!ref) return;
            if (idx === currentPage) ref.playAsync();
            else ref.pauseAsync();
        });
    }, [currentPage, videos]);

    return (
        <View style={styles.container}>
            <PagerView
                style={{ flex: 1 }}
                initialPage={0}
                orientation="vertical"
                onPageSelected={onPageSelected}
            >
                {videos.map((item, index) => (
                    <View key={item.id} style={{ width, height }}>
                        <Video
                            ref={(ref) => {
                                videoRefs.current[index] = ref;
                            }}
                            source={{ uri: item.video_url }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode={ResizeMode.COVER}
                            isLooping
                            shouldPlay={index === 0}
                            useNativeControls={false}
                        />
                    </View>
                ))}
            </PagerView>

            <SafeAreaView style={styles.overlay}>
                <Text style={styles.heading}>Reels</Text>
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
});