import { useCallback, useState } from "react";
import {View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView} from "react-native";
import {SafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { decode as atob } from 'base-64';
import { useFocusEffect } from "expo-router";
import { supabase } from "@/supabase";
import * as FileSystem from 'expo-file-system/legacy';

export default function Account() {
    const insets = useSafeAreaInsets();
    const pings = [
        { title: "ping test", image: "../../assets/images/icon.png" },
        { title: "ping text2", image: "../../assets/images/icon.png" },
        { title: "ping text3", image: "../../assets/images/icon.png" },
        { title: "ping text4", image: "../../assets/images/icon.png" },
        { title: "ping text5", image: "../../assets/images/icon.png" },
    ];

    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profileUrl, setProfileUrl] = useState<string | null>(null);


    useFocusEffect(
        useCallback(() => {
            const getUser = async () => {
                try {
                    const { data: authData, error: authError } = await supabase.auth.getUser();
                    if (authError) throw authError;

                    const user = authData?.user;
                    if (!user) return;

                    const { data: profileData, error: profileError } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", user.id)
                        .single();

                    if (profileError) console.error(profileError);

                    setUser(profileData);
                    setProfileUrl(profileData.avatar_url);
                } catch (err) {
                    console.error("Fehler beim Laden des Profils:", err);
                } finally {
                    setIsLoading(false);
                }
            };
            getUser();
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
            Alert.alert("✅ Erfolgreich", "Profilbild aktualisiert!");
        } catch (err) {
            console.error(err);
            Alert.alert("Fehler", "Beim Hochladen ist ein Problem aufgetreten.");
        }
    };

    const renderItem = ({ item }: any) => {
        return (
            <View style={styles.item}>
                <Text style={styles.itemHeading}>{item.title}</Text>
                <Image
                    style={styles.itemPic}
                    source={require(`../../assets/images/icon.png`)}
                    contentFit="contain"
                />
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
                            : require("../../assets/images/icon.png")
                    }
                    contentFit="cover"
                />
            </TouchableOpacity>

            <Text style={styles.profileName}>{user?.username}</Text>

            <View style={styles.pingView}>
                <Text style={styles.text}>Your Pings</Text>

                    <FlatList
                        data={pings}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={{paddingBottom: 100}}
                        scrollEnabled={false}
                    />


            </View>
            </ScrollView>

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
    },

    fakeTabBar: {
        height: 60,
        marginBottom: 20,
        position: "absolute",
        bottom: 0,
    },
});