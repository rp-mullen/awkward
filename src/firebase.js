import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {

    apiKey: "AIzaSyCDSqs_3K-jdpQ0J3rhEqCfNekzJV1wVUU",
  
    authDomain: "worldbuildingtool.firebaseapp.com",
  
    databaseURL: "https://worldbuildingtool-default-rtdb.europe-west1.firebasedatabase.app",
  
    projectId: "worldbuildingtool",
  
    storageBucket: "worldbuildingtool.firebasestorage.app",
  
    messagingSenderId: "632380299104",
  
    appId: "1:632380299104:web:5ca47a9cba247d1b11f005",
  
    measurementId: "G-X0XJNRZTB0"
  
  };
  

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);