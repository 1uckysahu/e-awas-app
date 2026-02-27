import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCasBVuU8CtyABbkyVt5p4UQybr1kSKMdw",
    authDomain: "e-awas2.firebaseapp.com",
    projectId: "e-awas2",
    storageBucket: "e-awas2.appspot.com",
    messagingSenderId: "146924491000",
    appId: "1:146924491000:web:0b89117ce8b09525662b0d",
    measurementId: "G-XLK8BSQ9X4",
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
