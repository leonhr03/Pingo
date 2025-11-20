import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Video} from "expo-av";
import React, {useCallback, useState} from "react";
import {Image} from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import {decode as atob} from "base-64";
import {useFocusEffect} from "expo-router";
import { ResizeMode } from "expo-av";
import {supabase} from "@/supabase";

export default function Explore() {
    // Modal States
    const [addPingsModal, setAddPingsModal] = useState(true);
    const [addCommunitysModal, setAddCommunitysModal] = useState(false);
    const [addReelsModal, setAddReelsModal] = useState(false);

    // Inputs
    const [newTitle, setNewTitle] = useState("");
    const [newPictureUri, setNewPictureUri] = useState<string | null>(null);
    const [videoUri, setVideoUri] = useState<string | null>(null);

    // Data
    const [communitys, setCommunitys] = useState<any[]>([]);
    const [currentCommunity, setCurrentCommunity] = useState<any>(null);

    // User
    const [currentUser, setCurrentUser] = useState<any | null>(null);

    // Load user and communitys
    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                try {
                    // User Session
                    const { data: { session }, error } = await supabase.auth.getSession();
                    if (!error && session?.user) {
                        setCurrentUser(session.user);
                    }

                    // Communitys
                    const { data: communitysData } = await supabase.from("communitys").select("*");
                    if (!communitysData) return;

                    if (session?.user) {
                        const { data: profilData } = await supabase.from("profiles")
                            .select("followed")
                            .eq("id", session.user.id)
                            .single();
                        const followedData = profilData?.followed || [];
                        const followedCommunitys = communitysData.filter(c => followedData.includes(c.title));
                        setCommunitys(followedCommunitys);
                    }

                } catch (err) {
                    console.log("Load data error:", err);
                }
            };

            loadData();
        }, [])
    );

    // IMAGE PICKER
    const chooseImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) setNewPictureUri(result.assets[0].uri);
    };

    // VIDEO PICKER
    const chooseReel = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) setVideoUri(result.assets[0].uri);
    };

    // UPLOAD PING
    const uploadPing = async () => {
        if (!currentCommunity) return;
        try {
            const newId = Date.now().toString();

            const { data: communityData } = await supabase
                .from("communitys")
                .select("pings")
                .eq("title", currentCommunity.title)
                .maybeSingle();

            const { data: userInfo } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", currentUser?.id)
                .single();

            const newItem: any = {
                id: newId,
                user: userInfo.username,
                userImage: userInfo.avatar_url,
                title: newTitle || undefined,
            };

            if (newPictureUri) {
                const filePath = `${currentCommunity.title}/${Date.now()}.jpg`;
                const fileBase64 = await FileSystem.readAsStringAsync(newPictureUri, { encoding: "base64" });
                const fileBytes = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));

                const { error: uploadError } = await supabase.storage
                    .from("ping_pics")
                    .upload(filePath, fileBytes, { contentType: "image/jpeg", upsert: true });

                if (uploadError) return console.log("Upload error:", uploadError);

                const { data: urlData } = supabase.storage.from("ping_pics").getPublicUrl(filePath);
                newItem.image_url = urlData.publicUrl;
            }

            const currentPings = communityData?.pings || [];
            const newList = [newItem, ...currentPings];

            await supabase.from("communitys").update({ pings: newList }).eq("title", currentCommunity.title);
            await supabase.from("pings").insert(newItem);

            setNewTitle("");
            setNewPictureUri(null);
            setCurrentCommunity(null);

        } catch (err) {
            console.log("Upload Ping Error:", err);
        }
    };

    // UPLOAD COMMUNITY
    const uploadCommunity = async () => {
        if (!newTitle.trim() || !newPictureUri) return alert("Titel + Bild benötigt!");
        try {
            const filePath = `${newTitle}/${Date.now()}/image.jpg`;
            const fileBase64 = await FileSystem.readAsStringAsync(newPictureUri, { encoding: "base64" });
            const bytes = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));

            const { error: uploadError } = await supabase.storage.from("community_pics").upload(filePath, bytes, {
                contentType: "image/jpeg", upsert: true,
            });
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from("community_pics").getPublicUrl(filePath);
            await supabase.from("communitys").insert({ title: newTitle, image_url: data.publicUrl });

            setNewTitle("");
            setNewPictureUri(null);

        } catch (err) {
            console.log("Upload Community Error:", err);
            alert("Fehler beim Hochladen!");
        }
    };

    // UPLOAD REEL
    const uploadReel = async () => {
        if (!videoUri || !currentUser) return alert("Bitte einloggen!");
        try {
            const fileName = `video_${Date.now()}.mp4`;
            const fileType = "video/mp4";

            const formData = new FormData();
            formData.append("file", { uri: videoUri, name: fileName, type: fileType } as any);

            const { error: uploadError } = await supabase.storage.from("videos").upload(fileName, formData, {
                contentType: fileType, upsert: true,
            });
            if (uploadError) return console.log("Upload error:", uploadError);

            const { data: publicUrlData } = supabase.storage.from("videos").getPublicUrl(fileName);

            const { error: insertError } = await supabase.from("reels").insert({
                video_url: publicUrlData.publicUrl,
                user_id: currentUser.id,
            });
            if (insertError) return console.log("Insert error:", insertError);

            alert("Upload erfolgreich!");
            setVideoUri(null);

        } catch (err) {
            console.log("Upload Reel Unexpected error:", err);
        }
    };

    // COMMUNITY ITEM RENDERER
    const communityItem = ({ item }: any) => (
        <TouchableOpacity style={styles.communityItem} onPress={() => setCurrentCommunity(item)}>
            <Image style={styles.communityPic} source={item.image_url} contentFit="contain" />
            <Text style={styles.communityText}>{item.title}</Text>
        </TouchableOpacity>
    );

    // UI
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
                <Text style={styles.heading}>Add</Text>

                <View style={styles.buttonContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity style={styles.chooseButton} onPress={() => {setAddPingsModal(true); setAddCommunitysModal(false); setAddReelsModal(false)}}><Text>Pings</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.chooseButton} onPress={() => {setAddPingsModal(false); setAddCommunitysModal(true); setAddReelsModal(false)}}><Text>Communitys</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.chooseButton} onPress={() => {setAddPingsModal(false); setAddCommunitysModal(false); setAddReelsModal(true)}}><Text>Reels</Text></TouchableOpacity>
                    </ScrollView>
                </View>

                {/* PINGS */}
                {addPingsModal && (
                    <View style={styles.addView}>
                        <Text style={styles.heading}>Add Ping</Text>
                        <FlatList
                            data={communitys}
                            renderItem={communityItem}
                            style={styles.communityListBackground}
                            contentContainerStyle={{ paddingRight: 30 }}
                            horizontal
                        />
                        <View style={styles.inputContainer}>
                            <TextInput value={newTitle} onChangeText={setNewTitle} placeholder="Title" placeholderTextColor="#000" style={styles.modalInput} />
                            <TouchableOpacity onPress={chooseImage}>
                                <Image style={styles.modalImage} source={newPictureUri ? { uri: newPictureUri } : require("../../assets/images/addIcon.png")} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={uploadPing}>
                                <Text style={styles.modalButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* COMMUNITY */}
                {addCommunitysModal && (
                    <View style={styles.addView}>
                        <Text style={styles.heading}>Add Community</Text>
                        <View style={styles.inputContainer}>
                            <TouchableOpacity onPress={chooseImage}>
                                <Image style={styles.newImage} source={newPictureUri ? { uri: newPictureUri } : require("../../assets/images/addIconRound.png")} />
                            </TouchableOpacity>
                            <TextInput value={newTitle} onChangeText={setNewTitle} placeholder="new Community" placeholderTextColor="#555" style={styles.modalInput} />
                            <TouchableOpacity style={styles.modalButton} onPress={uploadCommunity}>
                                <Text style={styles.modalButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* REELS */}
                {addReelsModal && (
                    <View style={styles.addView}>
                        <Text style={styles.heading}>Add Reel</Text>
                        <View style={styles.inputContainer}>
                            <TouchableOpacity onPress={chooseReel}>
                                {videoUri ? (
                                    <Video style={styles.modalVideo} source={{ uri: videoUri }} resizeMode={ResizeMode.COVER} shouldPlay isLooping />
                                ) : (
                                    <View style={[styles.modalVideo, { borderWidth: 2, borderColor: "#000", alignItems: "center", justifyContent: "center" }]}>
                                        <Text>Select a Video</Text>
                                        <Text>+</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={uploadReel}>
                                <Text style={styles.modalButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 16 },
    heading: { fontSize: 25, fontWeight: "bold", color: "#000", marginTop: Platform.OS === "ios" ? 0 : 20, marginBottom: 20, textAlign: "left" },
    buttonContainer: { flexDirection: "row", justifyContent: "space-evenly", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "rgba(74, 144, 226, 0.1)", backgroundColor: "#f9fafb", shadowOffset: { width: 0, height: 4 }, shadowColor: "#4a90e2", shadowOpacity: 0.5, shadowRadius: 5, elevation: 4 },
    chooseButton: { width: "40%", backgroundColor: "#4A90E2", paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, alignItems: "center", marginHorizontal: 5 },
    addView: { flex: 1, marginTop: 20 },
    inputContainer: { alignItems: "center", width: "100%" },
    modalInput: { width: "90%", height: 60, backgroundColor: "#fff", borderWidth: 1, borderColor: "#000", borderRadius: 15, padding: 10, marginTop: 10 },
    modalImage: { width: 300, height: 300, borderRadius: 30, marginTop: 20 },
    newImage: { height: 100, width: 100, borderRadius: 50, marginVertical: 10, borderWidth: 1, borderColor: "#000", marginBottom: 20 },
    modalButton: { width: "70%", height: 50, backgroundColor: "#4a90e2", borderRadius: 15, alignItems: "center", justifyContent: "center", marginTop: 20 },
    modalButtonText: { fontSize: 20, color: "#fff", fontWeight: "bold" },
    modalVideo: { width: 300, height: 533, borderRadius: 20, marginTop: 20 },
    communityListBackground: { flexDirection: "row", height: 100, width: "100%", marginTop: 10, marginBottom: 10, borderWidth: 1, borderColor: "rgba(74, 144, 226, 0.1)", borderRadius: 30, backgroundColor: "#f9fafb", padding: 10 },
    communityItem: { marginHorizontal: 5, flexDirection: "column", alignItems: "center" },
    communityPic: { width: 60, height: 60, borderRadius: 30 },
    communityText: { fontSize: 12, color: "#000", textAlign: "center", marginTop: 10 },
});