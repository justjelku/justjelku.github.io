import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signOut } from 'firebase/auth';
import {
  query,
  getDocs,
  collection,
  where,
  addDoc,
  setDoc, 
  doc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { auth, db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import AnimatedImage from '../components/animation/AnimateImage';



// const firebaseConfig = {
//   apiKey: "AIzaSyDoH11PS0y0rAm3koscH3VQNlkmv26bwuY",
//   authDomain: "my-anonymity-app.firebaseapp.com",
//   databaseURL: "https://my-anonymity-app-default-rtdb.firebaseio.com",
//   projectId: "my-anonymity-app",
//   storageBucket: "my-anonymity-app.appspot.com",
//   messagingSenderId: "149998370320",
//   appId: "1:149998370320:web:038ecbe5e259727b501495"
// };
// // Initialize Firebase app
// const firebaseApp = initializeApp(firebaseConfig);
// const auth = getAuth(firebaseApp);
// const firestore = getFirestore(firebaseApp);

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const authToken = await userCredential.user.getIdToken(); // Get the authentication token
      const userDoc = await firebase.firestore()
        .collection("users")
        .doc("qIglLalZbFgIOnO0r3Zu")
        .collection("basic_users")
        .doc(userCredential.user.uid)
        .get();

      if (userDoc.exists) {
        setUser({
          uid: user.uid,
          email: user.email,
          role: 'basic'
        });
        return null;
      }
      // Check if the user exists in the sub-collection
      if (!userDoc.exists) {
        console.log("User does not exist in the sub-collection");
        return null;
      }

      // Set the user state to the authenticated user
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  const createUser = async (firstName, lastName, username, email, password) => {
    try {
      const auth = getAuth()
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const authToken = await userCredential.user.getIdToken();
      const uid = userCredential.user.uid;
  
      await setDoc(doc(db, "users", "qIglLalZbFgIOnO0r3Zu", "basic_users"), {
        uid: uid,
        role: 'basic',
        'first name': firstName,
        'last name': lastName,
        username: username,
        email: email,
        createdAt: serverTimestamp(),
        signedInAt: serverTimestamp()
      });
  
      setUser({
        uid: uid,
        email: email,
        role: 'basic'
      });
  
      return userCredential;
    } catch (error) {
      throw new Error(error.message);
    }
  };
  

  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset link sent!");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const updateProfile = async (firstName, lastName, username, email, password) => {
    try {
      const user = auth.currentUser;
  
      // Update the user document in the Firestore collection
      await updateDoc(doc(db, "users", "qIglLalZbFgIOnO0r3Zu", "basic_users", user.uid), {
        'first name': firstName,
        'last name': lastName,
        username: username,
        email: email,
      });
  
      // Update the user state with the new profile information
      setUser((prevUser) => ({
        ...prevUser,
        firstName: firstName,
        lastName: lastName,
        username: username,
        email: email,
      }));
  
      // Update the user's password if a new password is provided
      if (password) {
        await updatePassword(user, password);
      }
  
      // Success notification or redirection
    } catch (error) {
      // Error handling
      console.error(error);
      alert(error.message);
    }
  };
  

  const googleProvider = new GoogleAuthProvider();
  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
  
      // Check if the user already exists in the Firestore collection
      const q = query(
        collection(db, "users", "qIglLalZbFgIOnO0r3Zu", "basic_users"),
        where("uid", "==", user.uid)
      );
      const docs = await getDocs(q);
      if (docs.empty) {
        // User does not exist, add the user to the Firestore collection
        await addDoc(collection(db, "users", "qIglLalZbFgIOnO0r3Zu", "basic_users"), {
          userId: user.uid,
          username: user.displayName,
          authProvider: "google",
          email: user.email,
          role: 'basic'
        });
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          role: 'basic'
        });
      } else {
        setUser(null);
      }
      setLoading(false); // Set loading to false once the authentication state is determined
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        user.getIdToken().then((authToken) => {
          localStorage.setItem('authToken', authToken); // Store the authentication token
        });
      } else {
        localStorage.removeItem('authToken'); // Remove the authentication token
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, createUser, logout, updateProfile, signInWithEmailAndPassword, signInWithGoogle }}>
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh', // Adjust the height as needed
          }}
        >
          <AnimatedImage />

        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
