import { auth, db } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider
} from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

// Detect if running on a mobile device or tablet
const isMobileDevice = () => {
  const ua = navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
};

export const signup = async ({ email, password, name, role }: any) => {
  if (!auth) throw new Error("Auth not initialized");
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  if (db) {
    await setDoc(doc(db, "users", user.uid), {
      userId: user.uid,
      name,
      email: email.toLowerCase().trim(),
      role,
      coupleId: null,
      createdAt: new Date().toISOString()
    });
  }
  
  return user;
};

export const login = async (email: string, password: string) => {
  if (!auth) throw new Error("Auth not initialized");
  return await firebaseSignIn(auth, email, password);
};

export const logout = async () => {
  if (!auth) throw new Error("Auth not initialized");
  return await firebaseSignOut(auth);
};

export const handleSuccessfulSocialAuth = async (user: any, pendingData: any = null) => {
  if (!db) return;
  
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  const finalName = pendingData?.name || user.displayName || "Soulmate";
  const finalSpouseEmail = pendingData?.spouseEmail || null;
  const finalRole = pendingData?.role || "husband";

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      userId: user.uid,
      name: finalName,
      email: user.email?.toLowerCase().trim() || "",
      photoUrl: user.photoURL,
      coupleId: null,
      role: finalRole,
      spouseEmail: finalSpouseEmail,
      createdAt: new Date().toISOString()
    });
  } else {
    // If the record exists, merge role and spouse email if they were filled out
    const existing = userSnap.data();
    await setDoc(userRef, {
      name: existing.name || finalName,
      spouseEmail: existing.spouseEmail || finalSpouseEmail,
      role: existing.role || finalRole
    }, { merge: true });
  }

  // If user completed a spouseEmail, create/join couple
  if (finalSpouseEmail) {
    await createOrJoinCouple(user.uid, user.email || "", finalSpouseEmail);
  }
};

export const signInWithSocial = async (providerName: 'google' | 'facebook' | 'x', pendingData: any = null) => {
  if (!auth || !db) throw new Error("Auth/DB not initialized");
  
  let provider;
  if (providerName === 'google') {
    provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
  }
  else if (providerName === 'facebook') provider = new FacebookAuthProvider();
  else if (providerName === 'x') provider = new TwitterAuthProvider();
  else throw new Error("Provider not supported");

  // Save registration inputs in localStorage so we can resume coupling upon landing back
  if (pendingData) {
    localStorage.setItem("pending_social_signup", JSON.stringify(pendingData));
  }

  const isMobile = isMobileDevice();

  if (isMobile) {
    // Mobile Redirect - standard for modern mobile and standalone PWAs
    await signInWithRedirect(auth, provider);
    return null;
  } else {
    // Desktop Popup - standard, interactive, same-page flow
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    await handleSuccessfulSocialAuth(user, pendingData);
    if (pendingData) {
      localStorage.removeItem("pending_social_signup");
    }
    return user;
  }
};

export const createOrJoinCouple = async (userId: string, userEmail: string, spouseEmail: string) => {
  if (!db) throw new Error("Database not initialized");

  const normalizedUserEmail = userEmail.toLowerCase().trim();
  const normalizedSpouseEmail = spouseEmail.toLowerCase().trim();

  // 1. Check if the spouse has already signed up and pointed to this user
  const q = query(
    collection(db, "users"), 
    where("email", "==", normalizedSpouseEmail),
    where("spouseEmail", "==", normalizedUserEmail)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    // Spouse is already waiting! Join their coupleId
    const spouseDoc = querySnapshot.docs[0].data();
    const existingCoupleId = spouseDoc.coupleId;
    
    if (existingCoupleId) {
      await updateDoc(doc(db, "couples", existingCoupleId), {
        spouseIds: arrayUnion(userId)
      });
      
      await updateDoc(doc(db, "users", userId), {
        coupleId: existingCoupleId,
        spouseEmail: normalizedSpouseEmail
      });
      
      return existingCoupleId;
    }
  }

  // 2. Spouse hasn't signed up yet or hasn't pointed to us. 
  // Create a new couple space and wait for them.
  const coupleId = doc(collection(db, "couples")).id;
  
  await setDoc(doc(db, "couples", coupleId), {
    spouseIds: [userId],
    emails: [normalizedUserEmail, normalizedSpouseEmail],
    createdAt: new Date().toISOString(),
    theme: "Moonlit Night"
  });
  
  await updateDoc(doc(db, "users", userId), {
    coupleId: coupleId,
    spouseEmail: normalizedSpouseEmail
  });
  
  return coupleId;
};
