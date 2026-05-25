// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAnalytics }  from "firebase/analytics"

// Firebase configuration for Sri Vijaya Durga Kadi Emporium
const firebaseConfig = {
  apiKey:            "AIzaSyCsC3YROSRBEpv6kBy7jTesjLIgwlnQ5Pg",
  authDomain:        "ecomsrivijaydurga.firebaseapp.com",
  projectId:         "ecomsrivijaydurga",
  storageBucket:     "ecomsrivijaydurga.firebasestorage.app",
  messagingSenderId: "312685070537",
  appId:             "1:312685070537:web:17f1f8c1391ea5c321e518",
  measurementId:     "G-W32PSK6FJ3",
}

// Initialize Firebase
const app       = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)

export { app, analytics }
