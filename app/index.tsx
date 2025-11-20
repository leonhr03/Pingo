import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "@/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useRouter} from "expo-router";

export default function Index() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [logIn, setLogIn] = useState(true);
    const [signIn, setSignIn] = useState(false);
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        const checkLogIn = async () => {
            const isLogIn = await AsyncStorage.getItem("isLogIn");
            if (isLogIn === "yes") {
                console.log("Bereits eingeloggt");
                router.replace("/tabs")
            }
            else{
                setIsLoading(false);
            }
        };

        checkLogIn();
    },);

    const handleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                Alert.alert("Login fehlgeschlagen", error.message);
                return;
            }
            await AsyncStorage.setItem("isLogIn", "yes");
        } catch (err: any) {
            Alert.alert("Fehler", err.message);
        }

        router.replace("/tabs");
    };

    const handleSignIn = async () => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) {
                Alert.alert("Signup fehlgeschlagen", error.message);
                return;
            }
            const userId = data?.user?.id;
            if (!userId) return;
            const { error: profileError } = await supabase
                .from("profiles")
                .insert([{ id: userId, username: userName, email }]);
            if (profileError) {
                Alert.alert("Fehler", profileError.message);
                return;
            }
            setSignIn(false);
            setLogIn(true);
        } catch (err: any) {
            Alert.alert("Fehler", err.message);
        }
    };

    if (!isLoading) {

        if (signIn) {
            return (
                <SafeAreaProvider style={styles.container}>
                    <Text style={styles.heading}>Sign Up</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        placeholderTextColor={"#555"}
                        value={userName}
                        onChangeText={setUserName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={"#555"}
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={"#555"}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity style={styles.button} onPress={handleSignIn}>
                        <Text style={styles.buttonText}>Sign Up</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            setLogIn(true);
                            setSignIn(false);
                        }}
                    >
                        <Text style={styles.text}>Already have an account? Log In</Text>
                    </TouchableOpacity>
                </SafeAreaProvider>
            );
        }

        if (logIn) {
            return (
                <SafeAreaProvider style={styles.container}>
                    <Text style={styles.heading}>Log In</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={"#555"}
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={"#555"}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity style={styles.button} onPress={handleLogin}>
                        <Text style={styles.buttonText}>Log In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            setLogIn(false);
                            setSignIn(true);
                        }}
                    >
                        <Text style={styles.text}>Don’t have an account? Sign Up</Text>
                    </TouchableOpacity>
                </SafeAreaProvider>
            );
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    heading: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#000",
    },
    input: {
        padding: 15,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 0.15)",
        borderRadius: 15,
        width: "80%",
        marginTop: 20,
        color: "#000",
    },
    button: {
        width: "60%",
        backgroundColor: "#4A90E2",
        paddingVertical: 14,
        marginTop: 20,
        borderRadius: 14,
        alignItems: "center",
    },
    buttonText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    text: {
        fontSize: 15,
        color: "#000",
        marginTop: 10,
    },
});