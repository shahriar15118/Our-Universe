import { auth, db } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider
} from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

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

export const signInWithSocial = async (providerName: 'google' | 'facebook' | 'x') => {
  if (!auth || !db) throw new Error("Auth/DB not initialized");
  
  let provider;
  if (providerName === 'google') provider = new GoogleAuthProvider();
  else if (providerName === 'facebook') provider = new FacebookAuthProvider();
  else if (providerName === 'x') provider = new TwitterAuthProvider();
  else throw new Error("Provider not supported");

  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Check if user document exists, if not create basic one
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      userId: user.uid,
      name: user.displayName || "Soulmate",
      email: user.email?.toLowerCase().trim() || "",
      photoUrl: user.photoURL,
      coupleId: null,
      createdAt: new Date().toISOString()
    });
  }

  return user;
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
