import {Stack} from "expo-router";
import {Text, TextInput} from "react-native";
import {SafeAreaProvider} from "react-native-safe-area-context";

export default function AuthLayout() {
    return(
        <Stack screenOptions={{headerShown: false}}/>
    )
}


