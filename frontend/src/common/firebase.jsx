


import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth"

const firebaseConfig = {
    apiKey: "AIzaSyCi9r3hp5A_AF1azOMrDILG-UqPl6yZDbM",
    authDomain: "react-blogging-app-fc375.firebaseapp.com",
    projectId: "react-blogging-app-fc375",
    storageBucket: "react-blogging-app-fc375.firebasestorage.app",
    messagingSenderId: "115742405828",
    appId: "1:115742405828:web:6b414b7cd4820b37710591"
};

const app = initializeApp(firebaseConfig);


const provider = new GoogleAuthProvider()
const auth = getAuth()

export const authWithGoogle = async () => {

    let user = null
    await signInWithPopup(auth, provider)
        .then((result) => {
            user = result.user
        })
        .catch((err) => {
            console.log(err);
        })
    return user
}