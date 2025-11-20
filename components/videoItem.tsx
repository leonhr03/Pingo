// 👉 src/components/VideoItem.tsx
import React from "react";
import { View, Dimensions } from "react-native";
import { Video, ResizeMode } from "expo-av";

const { height, width } = Dimensions.get("window");

export type VideoItemType = {
    id: string;
    video_url: string;
    user_id: string;
};

type Props = {
    item: VideoItemType;
    index: number;
    videoRefs: React.MutableRefObject<(Video | null)[]>;
};

export default function VideoItem({ item, index, videoRefs }: Props) {
    return (
        <View style={{ width, height }}>
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
    );
}