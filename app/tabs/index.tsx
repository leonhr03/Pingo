import {Text, StyleSheet, ScrollView, Platform, FlatList, View, TextInput} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";


export default function Home(){

    const communitys = [{title: "oppenau"}, {title: "React Native"}]

    const renderItem = ({item}: any) => {
        return(
            <View style={styles.itemContainer}>
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
        left: 20,
    },

    itemIcon: {
        position: "absolute",
        right: 20,
    },
})