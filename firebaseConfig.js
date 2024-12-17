import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {getAuth} from 'firebase/auth'
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
    apiKey: "AIzaSyBuh4TS8xBDsu-z8uaUCmYz7jf_Ze3yv9M",
    authDomain: "todo-app-6b187.firebaseapp.com",
    projectId: "todo-app-6b187",
    storageBucket: "todo-app-6b187.appspot.com",
    messagingSenderId: "245675334942",
    appId: "1=245675334942=web=142f14288f525fcdf8fd0f",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db=getFirestore(app);
const authfirebase = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});


export {app, authfirebase, db};

//ios Client Id:
//   77892197521-ti1oh26rj4ananapr9aa4p0sf6duvmdl.apps.googleusercontent.com

//Android client Id:
//      77892197521-dte0fpb0klofoa9heae81knj8srh7p8c.apps.googleusercontent.com