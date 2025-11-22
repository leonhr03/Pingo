import {useEffect, useState} from "react";
import {View, Dimensions, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Image} from "react-native";
import { Video, ResizeMode } from "expo-av";
import {Ionicons} from "@expo/vector-icons";
import {supabase} from "@/supabase";
import * as Linking from "expo-linking";

const { height, width } = Dimensions.get("window");

export type VideoItemType = {
    id: string;
    video_url: string;
    user_id: string;
    user_image: any;
    likes: string[];
};

type Props = {
    item: VideoItemType;
    index: number;
    videoRefs: React.MutableRefObject<(Video | null)[]>;
    isPaused: boolean;
    onPause: (index: number) => void;
    onComment: () => void;
};

export default function VideoItem({ item, index, videoRefs, onPause, isPaused, onComment }: Props){
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [liked, setLiked] = useState(false);
    const [stored, setStored] = useState(false);

    useEffect(() => {

        const loadUser = async () => {
            const { data: userData } = await supabase.auth.getUser();
            const { data: userInfo } = await supabase
                .from("profiles")
                .select("username")
                .eq("email", userData.user?.email)
                .single();
            if (userInfo) setCurrentUser(userInfo.username);
        }
        loadUser();
    })

    useEffect(() => {
        const loadLike = async() => {
            const { data } = await supabase.from('reels'). select("likes").eq("id", item.id).single();
            let likeArray: any = data?.likes ?? [];

            if (likeArray.includes(currentUser)) {
                setLiked(true);
            } else {
                setLiked(false);
            }
        }

        const loadStored = async() => {
            const { data } = await supabase.from('reels'). select("stored").eq("id", item.id).single();
            let likeArray: any = data?.stored ?? [];

            if (likeArray.includes(currentUser)) {
                setStored(true);
            } else {
                setStored(false);
            }
        }

        loadLike();
        loadStored();
    }, []);

    const handleLike = async () => {
        const { error, data } = await supabase.from('reels'). select("likes").eq("id", item.id).single();
        if(error) console.error(error);

        let likeArray: any = data?.likes ?? [];

        if(likeArray.includes(currentUser)){
            likeArray = likeArray.filter((u: any) => u !== currentUser);
            setLiked(false);
        }
        else{
            likeArray.push(currentUser);
            setLiked(true);
        }

        const { error: uploadError } = await supabase
            .from("reels")
            .update({ likes: likeArray })
            .eq("id", item.id);

        if(uploadError) console.error(uploadError);

    }

    const handleStored = async () => {
        const { error, data } = await supabase.from('reels'). select("stored").eq("id", item.id).single();
        if(error) console.error(error);

        let storedArray: any = data?.stored ?? [];

        if(storedArray.includes(currentUser)){
            storedArray = storedArray.filter((u: any) => u !== currentUser);
            setStored(false);
        }
        else{
            storedArray.push(currentUser);
            setStored(true);
        }

        const { error: uploadError } = await supabase
            .from("reels")
            .update({ stored: storedArray })
            .eq("id", item.id);

        if(uploadError) console.error(uploadError);

    }


    const shareDirectWhatsApp = () => {
        const text = `Schau dir das an! ${item.video_url}`;
        const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
        Linking.openURL(url).catch(() => {
            alert("WhatsApp ist nicht installiert!");
        });
    };

    return (
        <TouchableWithoutFeedback onPress={() => onPause(index)}>
            <View style={{ width, height }}>
                <Video
                    ref={(ref) => {
                        videoRefs.current[index] = ref;
                    }}
                    source={{ uri: item.video_url }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode={ResizeMode.COVER}
                    isLooping
                    shouldPlay={index === 0 && !isPaused}
                    useNativeControls={false}
                />

                {isPaused && (
                    <View style={styles.playButtonContainer}>
                        <Ionicons name="play" size={40} color="#fff" />
                    </View>
                )}

                <View style={{position: "absolute", right: 12, bottom: 130, alignItems: "center", gap: 18}}>
                    <Image source={{ uri: item.user_image }} style={{width: 40, height: 40, borderRadius: 20}}/>
                    <TouchableOpacity onPress={handleLike}>
                        <Ionicons name={"heart"} color={liked ? "#e63946" : "#fff"} size={40}/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onComment}>
                        <Ionicons name={"chatbubble"} color="#fff" size={40}/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={shareDirectWhatsApp}>
                        <Ionicons name={"arrow-redo"} color="#fff" size={40}/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleStored}>
                        <Ionicons name={"bookmark"} color={stored ? "#4a90e2" : "#fff"} size={40}/>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    playButtonContainer: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 20,
    }
});