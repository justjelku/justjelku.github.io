import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  // sendPasswordResetEmail, 
  signOut 
} from 'firebase/auth';
import {
  query,
  getDocs,
  collection,
  where,
  setDoc,
  doc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { db } from '../firebase';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import AnimatedImage from '../components/animation/AnimateImage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setError] = useState(null);
  const auth = getAuth();

  const signIn = async (email, password) => {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // const authToken = await auth.getIdToken(userCredential.user); // Get the authentication token
      // localStorage.setItem('authToken', authToken);
      const userDoc = await db
        .collection('users')
        .doc('qIglLalZbFgIOnO0r3Zu')
        .collection('basic_users')
        .doc(userCredential.user.uid)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        const userEnabled = userData.enabled;

        if (userEnabled === 'true') {
          await setDoc(
            userDoc.ref,
            {
              signedAt: serverTimestamp()
            },
            { merge: true }
          );
        } else {
          await setDoc(
            userDoc.ref,
            {
              signedInFailed: serverTimestamp()
            },
            { merge: true }
          );
        }

        return userCredential.user; // Return the user object
      }

      // Check if the user exists in the sub-collection
      console.log('User does not exist in the sub-collection');
      return null;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setError('Invalid email. Please check your email or sign up.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Invalid password. Please check your password.');
      } else {
        setError(error.message);
        console.log(error.message);
      }
    }
  };

  const signInAdmin = async (email, password) => {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // const authToken = await auth.getIdToken(userCredential.user); // Get the authentication token
      // localStorage.setItem('authToken', authToken);
      const userDoc = await db
        .collection('users')
        .doc('qIglLalZbFgIOnO0r3Zu')
        .get();

      if (userDoc.exists) {
        setUser({
          signedInAt: serverTimestamp()
        });
        return userCredential.user; // Return the user object
      }

      // Check if the user exists in the sub-collection
      console.log('User does not exist in the sub-collection');
      return null;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const createUser = async (email, password) => {
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      throw new Error(error.message);
    }
  };

  // const sendPasswordReset = async (email) => {
  //   try {
  //     const auth = getAuth()
  //     await sendPasswordResetEmail(auth, email);
  //     alert("Password reset link sent!");
  //   } catch (err) {
  //     console.error(err);
  //     alert(err.message);
  //   }
  // };

  const updateProfile = async (firstName, lastName, username, email, password) => {
    try {
      const auth = getAuth()
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
      if (docs.length === 0) {
        // User does not exist, add/update the user's document in the Firestore collection
        await setDoc(doc(db, "users", "qIglLalZbFgIOnO0r3Zu", "basic_users", user.uid), {
          userId: user.uid,
          username: user.displayName,
          authProvider: "google",
          enabled: 'true',
          email: user.email,
          role: 'admin',
          'first name': '',
          'last name': '',
          signedInAt: serverTimestamp()
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
          role: 'admin'
        });
      } else {
        setUser(null);
      }
      setLoading(false); // Set loading to false once the authentication state is determined
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      // const authToken = localStorage.getItem('authToken');
      if (user) {
        user.getIdToken().then((authToken) => {
          localStorage.setItem('authToken', authToken); // Store the authentication token
        });
      } else {
        localStorage.removeItem('authToken'); // Remove the authentication token
      }
    });

    return unsubscribe;
  }, [auth]);

  // useEffect(() => {
  //   const authToken = localStorage.getItem('authToken');
  
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     if (user) {
  //       setUser({
  //         uid: user.uid,
  //         email: user.email,
  //         role: 'admin',
  //       });
  
  //       // Redirect to homepage if user is already logged in
  //       if (window.location.pathname === '/signin') {
  //         window.location.href = '/';
  //       }
  //     } else {
  //       setUser(null);
  //     }
  //     setLoading(false); // Set loading to false once the authentication state is determined
  //   });
  
  //   // Store the authentication token in local storage
  //   if (authToken) {
  //     auth.currentUser
  //       .getIdToken()
  //       .then((newAuthToken) => {
  //         localStorage.setItem('authToken', newAuthToken); // Store the updated authentication token
  //       })
  //       .catch((error) => {
  //         console.error(error);
  //         localStorage.removeItem('authToken'); // Remove the authentication token on error
  //       });
  //   } else {
  //     localStorage.removeItem('authToken'); // Remove the authentication token if it doesn't exist
  //   }
  
  //   return () => unsubscribe();
  // }, []);
  

  return (
    <AuthContext.Provider value={{ user, signIn, createUser, logout, signInAdmin, updateProfile, signInWithEmailAndPassword, signInWithGoogle }}>
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
