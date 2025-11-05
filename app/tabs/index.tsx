import {Text, StyleSheet, ScrollView, Platform, FlatList, View, TextInput} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {lazy, useCallback, useState} from "react";
import {useFocusEffect} from "expo-router";
import {supabase} from "@/supabase";
import {Image} from "expo-image";

interface CommunityContent{
    title: string;
    image_url: string;
}

export default function Home(){

    const [communitys, setCommunitys] = useState<CommunityContent[]>([])
    const [userId, setUserId] = useState<string | null>(null)

    useFocusEffect(
        useCallback(() => {
            loadCommunitys()
        }, [])
    )

    const loadCommunitys = async() => {

        const {data} = await supabase.auth.getUser()
        if(!data.user) return;
        const currentUserId = data.user.id;
        setUserId(currentUserId)

        const {data: communitysData} = await supabase
            .from("communitys")
            .select("*")
        if(!communitysData) return;



        const {data: profilData} = await supabase
            .from("profiles")
            .select("followed")
            .eq("id", currentUserId)
            .single()

        if(!profilData) return;
        const followedData = profilData.followed || [];

        const followedCommunitys = communitysData.filter(c => followedData.includes(c.title))
        setCommunitys(followedCommunitys)
    }

    const renderItem = ({item}: any) => {
        return(
            <View style={styles.itemContainer}>
                <Image
                    style={{width: 50, height: 50, borderRadius: 25}}
                    source={item.image_url}
                />
                <Text style={styles.itemText}>{item.title}</Text>
            </View>
        )

    }

    return(
        <SafeAreaView style={styles.container}>
                <Text style={styles.heading}>Communitys</Text>
                <FlatList
                    data={communitys}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    style={{width: '100%', height: '100%'}}/>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        alignItems: "center",
        backgroundColor: "#fff",
    },

    heading: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#000",
        marginTop: Platform.OS === "ios" ? 0 : 20
    },

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

    itemText: {
        position: "absolute",
        left: 80,
    },

    itemIcon: {
        position: "absolute",
        right: 20,
    },
})