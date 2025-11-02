import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {useFocusEffect} from "expo-router";
import {useCallback, useState} from "react";
import {supabase} from "@/supabase";

export default function Account() {
    const pings = [
        { title: "ping test", image: "../../assets/images/icon.png" },
        { title: "ping text2", image: "../../assets/images/icon.png" },
        { title: "ping text3", image: "../../assets/images/icon.png" },
        { title: "ping text4", image: "../../assets/images/icon.png" },
        { title: "ping text5", image: "../../assets/images/icon.png" },
    ];

    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

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

                    if (profileError)  console.error(profileError);

                    setUser(profileData);
                } catch (err) {
                    console.error("Fehler beim Laden des Profils:", err);
                } finally {
                    setIsLoading(false);
                }
            };

            getUser();
        }, [])
    );

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

    if(!isLoading) {

        return (
            <SafeAreaView style={styles.container}>
                <Image
                    style={styles.profileImage}
                    source={require("../../assets/images/icon.png")}
                />

                <Text style={styles.profileName}>{user.username}</Text>

                <View style={styles.pingView}>
                    <Text style={styles.text}>your Pings</Text>
                    <FlatList
                        data={pings}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={{paddingBottom: 100}}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </SafeAreaView>
        );

    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
    },

    profileImage: {
        height: 200,
        width: 200,
        borderRadius: 100,
        alignSelf: "center",
    },

    profileName: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000",
        marginTop: 20,
        textAlign: "center",
    },

    pingView: {
        width: "100%",
        marginTop: 50,
        flex: 1
    },

    text: {
        width: "100%",
        fontSize: 20,
        color: "#000",
        borderWidth: 1,
        borderColor: "rgba(74,144,226,0.1)",
        borderRadius: 15,
        shadowColor: "#4a90e2",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 4,
        padding: 10,
        backgroundColor: "#f9fafb",
    },

    item: {
        width: "90%",
        backgroundColor: "#f9fafb",
        borderColor: "rgba(74,144,226,0.1)",
        borderWidth: 1,
        borderRadius: 15,
        shadowColor: "#4a90e2",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 4,
        padding: 16,
        alignSelf: "center",
        marginTop: 10,
    },

    itemHeading: {
        fontSize: 20,
        color: "#000",
        textAlign: "left",
    },

    itemPic: {
        width: "95%",
        aspectRatio: 1,
        borderRadius: 15,
        marginTop: 10,
        alignSelf: "center",
    },
});