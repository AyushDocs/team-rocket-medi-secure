"use client";

import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "../../firebase.config";

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    localStorage.removeItem("mediSecure_manualDisconnect");
    
    const custodianUser = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      createdAt: serverTimestamp(),
    };

    const userDocRef = doc(db, "custodianUsers", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        ...custodianUser,
        createdAt: serverTimestamp(),
      });
    } else {
      custodianUser.walletAddress = userDoc.data().walletAddress;
      custodianUser.linkedToWallet = !!userDoc.data().walletAddress;
    }

    return custodianUser;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return null;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('custodianUser');
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    const isManualDisconnect = localStorage.getItem("mediSecure_manualDisconnect") === "true";
    if (user && !isManualDisconnect) {
      const userDocRef = doc(db, "custodianUsers", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = (userDoc.exists() && userDoc.data()) ? userDoc.data() : {};
      
      const custodianUser = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        createdAt: userData.createdAt || serverTimestamp(),
        walletAddress: userData.walletAddress,
        linkedToWallet: !!userData.walletAddress,
      };
      callback(custodianUser);
    } else {
      callback(null);
    }
  });
};

export const linkWalletToCustodian = async (uid, walletAddress) => {
  try {
    const userDocRef = doc(db, "custodianUsers", uid);
    await setDoc(userDocRef, { walletAddress, linkedToWallet: true }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error linking wallet:", error);
    return false;
  }
};

export const getCustodianUserData = async (uid) => {
  try {
    const userDocRef = doc(db, "custodianUsers", uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

export const logout = async () => {
  try {
    await signOutUser();
    localStorage.setItem("mediSecure_manualDisconnect", "true");
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('custodianUser');
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/';
  }
};