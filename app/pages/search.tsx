import {
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, {useCallback, useState} from "react";
import { supabase } from "@/supabase";
import {useFocusEffect, useRouter} from "expo-router";
import CommunityListItem from "../../components/searchPagecomponent";
import {Ionicons} from "@expo/vector-icons";

export default function Search() {

    const router = useRouter();
    const [communitys, setCommunitys] = useState<{title: string, image_url: string}[]>([]);
    const [searchText, setSearchText] = useState("");
    const filteredCommunitys = communitys.filter((community) =>
        community.title.toLowerCase().includes(searchText.toLowerCase())
    );

    useFocusEffect(
        useCallback(() => {
            const loadData = async() => {
                const {data, error} = await supabase
                    .from("communitys")
                    .select("*")

                if(error){
                    console.error(error)
                }else if (data){
                    setCommunitys(data)
                }
            }
            loadData()
        }, [])
    )

    const renderItem = ({ item }: any) => <CommunityListItem item={item}/>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace("/tabs")}>
                    <Ionicons name={"arrow-back"} size={30} style={styles.searchIcon}/>
                </TouchableOpacity>
                <Text style={styles.heading}>Search</Text>
            </View>


            <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search..."
                placeholderTextColor="#555"
                style={styles.searchInput}
            />

            <FlatList
                data={filteredCommunitys}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                style={{ width: "100%", height: "100%" }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 16 },
    header: { flexDirection: "row", alignItems: "center", gap: 20 },
    searchIcon: { color: "#000"},
    heading: { fontSize: 25, fontWeight: "bold", color: "#000", marginTop: Platform.OS === "ios" ? 0 : 20 },
    searchInput: { height: 40, width: "100%", borderWidth: 1, borderColor: "rgba(74,144,226,0.1)", borderRadius: 20, marginTop: 20, paddingHorizontal: 15, color: "#000", backgroundColor: "#f9fafb" },
    addButton: { backgroundColor: "#4a90e2", height: 60, width: 60, alignItems: "center", justifyContent: "center", borderRadius: 30, position: "absolute", right: 30, bottom: 90 },
    addButtonText: { color: "#fff", fontSize: 25 }
});
