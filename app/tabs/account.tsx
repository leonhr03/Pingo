import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ScrollView,
    TouchableWithoutFeedback, TextInput, Modal
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { decode as atob } from 'base-64';
import { useFocusEffect } from "expo-router";
import { supabase } from "@/supabase";
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from "@expo/vector-icons";

export default function Account() {
    const [pings, setPings] = useState<any[]>([]);

    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profileUrl, setProfileUrl] = useState<string | null>(null);
    const [communitys, setCommunitys] = useState<any[]>([]);
    const [currentPing, setCurrentPing] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [commentSheet, setCommentSheet] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const loadCommunitys = async() => {

                const {data} = await supabase.auth.getUser()
                if(!data.user) return;

                const {data: userInfo} = await supabase.from("profiles")
                    .select("*")
                    .eq("id", data.user.id)
                    .single()

                setUser(userInfo)
                setProfileUrl(userInfo.avatar_url)

                const {data: communitysData} = await supabase
                    .from("communitys")
                    .select("*")
                if(!communitysData) return;

                const {data: profilData} = await supabase.from("profiles")
                    .select("followed")
                    .eq("id", data?.user.id)
                    .single()

                if(!profilData) return;
                const followedData = profilData.followed || [];

                const followedCommunitys = communitysData.filter(c => followedData.includes(c.title))
                setCommunitys(followedCommunitys)

                setIsLoading(false)
            }
            loadCommunitys();
        }, [])
    );
    const pickAndUploadImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (result.canceled) return;

            const image = result.assets[0];
            const filePath = `${user.id}/${Date.now()}.jpg`;
            const fileUri = image.uri;


            const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
                encoding: 'base64',
            });

            const bytes = Uint8Array.from(atob(fileBase64), (c: string) => c.charCodeAt(0));

            // Upload zu Supabase
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, bytes, {
                    contentType: "image/jpeg",
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // Public URL abrufen
            const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
            const publicUrl = data.publicUrl;

            // DB aktualisieren
            await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

            setProfileUrl(publicUrl);
        } catch (err) {
            console.error(err);
            Alert.alert("Fehler", "Beim Hochladen ist ein Problem aufgetreten.");
        }
    };

    const loadPingsOnClick = async (item: any) => {
        const { data } = await supabase
            .from("communitys")
            .select("*")
            .eq("title", item.title)
            .single();

        if (!data?.pings) {
            setPings([]);
            return
        }

        const filtered = data.pings.filter((ping: any) => ping.user === user.username);


        const pingsWithLikesAndComments = await Promise.all(
            filtered.map(async (ping: any) => {
                const { data: likeData, error } = await supabase
                    .from("likes")
                    .select("likes")
                    .eq("ping", ping.id)
                    .maybeSingle();



                if (error) {
                    console.error("Fehler beim Laden der Likes:", error);
                    return { ...ping, likeCount: 0, comments: ""}
                }


                const likesArray = likeData?.likes ?? [];
                return { ...ping, likeCount: likesArray.length};
            })
        );




        setPings(pingsWithLikesAndComments);
    };

    const openCommentSheet = async (item: any) => {
        setCurrentPing(item.title);

        const { data: commentsData, error: commentsError } = await supabase
            .from("comments")
            .select("comments")
            .eq("ping", item.id)
            .maybeSingle();

        setComments(commentsError ? [] : commentsData?.comments ?? []);
        setCommentSheet(true);
    };

    const communityItem = ({ item }: any) => {
        return (
            <TouchableOpacity style={styles.communityItem} onPress={() => {loadPingsOnClick(item)}}>
                <Image
                    style={styles.communityPic}
                    source={item.image_url}
                    contentFit="contain"
                />
                <Text style={styles.communityText}>{item.title}</Text>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }: any) => {
        return (
            <View style={styles.item}>

                <View style={styles.itemHeaderView}>
                    <Image source={item.userImage} style={styles.itemProfileImage} />
                    <Text style={styles.itemProfileName}>{item.user}</Text>
                </View>

                {item.title && (
                    <Text style={styles.itemHeading}>{item.title}</Text>
                )}

                {item.image_url && (
                    <Image
                        style={styles.itemPic}
                        source={item.image_url ? { uri: item.image_url } : require("../../assets/images/addIconRound.png")}
                        contentFit="cover"
                    />
                )}


                <View style={styles.bottomRow}>
                    <TouchableOpacity style={styles.likeButton}>
                        <Ionicons
                            name={"heart-outline"}
                            size={25}
                            color={"#000"}
                        />
                        <Text style={{ marginLeft: 6 }}>{item.likeCount}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.commentButton} onPress={() => openCommentSheet(item)}>
                        <Ionicons name="chatbubble-outline" size={25} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingProfileImage} />
                <Text style={styles.loadingProfileName}>UserName</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView  showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={pickAndUploadImage}>
                <Image
                    style={styles.profileImage}
                    source={
                        profileUrl
                            ? { uri: profileUrl }
                            : require("../../assets/images/addIconRound.png")
                    }
                    contentFit="cover"
                />
            </TouchableOpacity>

            <Text style={styles.profileName}>{user?.username}</Text>

            <View style={styles.pingView}>
                <Text style={styles.text}>Your Pings</Text>

                    <FlatList
                        data={communitys}
                        renderItem={communityItem}
                        style={styles.communityListBackground}
                        contentContainerStyle={{ paddingRight: 30 }}
                        horizontal/>

                    <FlatList
                        data={pings}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={{paddingBottom: 100}}
                        scrollEnabled={false}
                    />


            </View>
            </ScrollView>

            <Modal transparent visible={commentSheet} animationType="slide">
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableWithoutFeedback onPress={() => setCommentSheet(false)}>
                        <View style={{ flex: 1 }} />
                    </TouchableWithoutFeedback>

                    <View style={styles.commentContainer}>
                        <Text style={styles.commentHeading}>{currentPing}</Text>

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
                            nestedScrollEnabled
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
    },
    profileImage: {
        height: 160,
        width: 160,
        borderRadius: 80,
        alignSelf: "center",

    },
    loadingProfileImage: {
        height: 160,
        width: 160,
        borderRadius: 80,
        alignSelf: "center",
        backgroundColor: "#999999",
    },
    profileName: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#000",
        marginTop: 20,
        textAlign: "center",
    },
    loadingProfileName: {
        fontSize: 20,
        width: "20%",
        fontWeight: "bold",
        color: "#999999",
        marginTop: 20,
        textAlign: "center",
        backgroundColor: "#999999",
        alignSelf: "center",
        borderRadius: 15,
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

    pingView: {
        width: "100%",
        marginTop: 40,
        flex: 1,
    },
    text: {
        width: "100%",
        fontSize: 22,
        color: "#000",
        fontWeight: "600",
        marginBottom: 10,
        textAlign: "left",
        paddingHorizontal: 4,
    },
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
        alignSelf: "center",
        marginTop: 10,
    },
    itemHeading: {
        fontSize: 18,
        color: "#000",
        textAlign: "left",
        fontWeight: "600",
    },
    itemPic: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 15,
        marginTop: 10,
        alignSelf: "center",
        backgroundColor: "#999",
    },

    communityItem: {
        marginHorizontal: 5,
        flexDirection: "column",
        alignItems: "center",
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



});