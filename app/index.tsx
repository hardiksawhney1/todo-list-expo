import {
  ActivityIndicator,
  Button,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as React from "react";
import { Link, Redirect, router } from "expo-router";
import Loginpage from "./Loginpage";
import {
  GoogleSignin,
  GoogleSigninButton,
} from "@react-native-google-signin/google-signin";
// import auth from '@react-native-firebase/auth';
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
} from "firebase/auth";
// import { auth } from "../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { authfirebase } from "../firebaseConfig";
import { StatusBar } from "expo-status-bar";
WebBrowser.maybeCompleteAuthSession();

const index = () => {
  const [error, setError] = React.useState();
  const [userInfo, setUserInfo] = React.useState<any>();
  const [loading, setLoading] = React.useState(false);
  if (Platform.OS == "ios") {
    const [request, response, promptAsync] = Google.useAuthRequest({
      iosClientId:
        "77892197521-ti1oh26rj4ananapr9aa4p0sf6duvmdl.apps.googleusercontent.com",
      androidClientId:
        "77892197521-2s98eu28lq6i0pt9m64ao5lf5eeomp37.apps.googleusercontent.com",
    });
    const checkLocalUser = async () => {
      try {
        const userJSON = await AsyncStorage.getItem("@user");
        const userData = userJSON ? JSON.parse(userJSON) : null;
        setUserInfo(userData);
      } catch (error: any) {
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };

    React.useEffect(() => {
      checkLocalUser();

      const unsubscribe = onAuthStateChanged(authfirebase, async (user) => {
        if (user) {
          console.log(JSON.stringify(user, null, 2));
          setUserInfo(user);
        } else {
          console.log("No user signed in.");
          setUserInfo(null); // Ensure userInfo is cleared if no user is signed in
        }
        setLoading(false);
      });

      return unsubscribe; // Clean up subscription on unmount
    }, []);

    React.useEffect(() => {
      if (response?.type === "success") {
        const { id_token } = response.params;
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(authfirebase, credential)
          .then(() => {
            console.log("User signed in successfully!");
          })
          .catch((error) => {
            console.error("Error signing in with Google:", error);
          });
      }
    }, [response]);
    const handleSignOut = () => {
      signOut(authfirebase)
        .then(() => {
          console.log("User signed out successfully!");
          setUserInfo(null); // Clear user info on signout
        })
        .catch((error: any) => {
          console.error("Error signing out:", error);
        });
    };
    if (loading) {
      return (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size={"large"} />
        </View>
      );
    }

    if (userInfo) {
      return (
        <View style={{ flex: 1 }}>
          {/* <Text>Hello, {userInfo.displayName}</Text>
      <Button title="Sign Out" onPress={handleSignOut} /> */}
          <Redirect href="/screens/Tasks" />
        </View>
      );
    } else {
      return (
        <View style={{ flex: 1 }}>
          <StatusBar style="light" />
          <Loginpage promptAsync={promptAsync} />
        </View>
      );
    }
  }
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  login: {
    flex: 1,
  },
});
