// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQsK_rxnbjU_WFuF0ysiPRqKXlkYougsY",
  authDomain: "study-steady.firebaseapp.com",
  projectId: "study-steady",
  storageBucket: "study-steady.firebasestorage.app",
  messagingSenderId: "480607723415",
  appId: "1:480607723415:web:d11a6f0fe28bd95dfb6ed2",
  measurementId: "G-ZV8K5T69Y9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Initialize Firebase Authentication with AsyncStorage
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Handle foreground messages
onMessage(messaging, (message) => {
  console.log("FCM Message Received (Foreground):", message);
});

// Handle background messages
onBackgroundMessage(messaging, (message) => {
  console.log("FCM Message Received (Background):", message);
});

export { app, auth, messaging };
