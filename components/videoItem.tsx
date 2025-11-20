import React from 'react'
import {ResizeMode, Video} from "expo-av";

interface videoProbs {
    item: any;

}

export default function VideoItem({item, }: videoProbs) {
    return(
        <Video
            source={{ uri: item.video_url }}
            style={{ width: "100%", height: "100%" }}
            resizeMode={ResizeMode.COVER}
            isLooping
            useNativeControls={false}
        />
    )
}