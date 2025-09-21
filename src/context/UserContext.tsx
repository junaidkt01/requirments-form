// src/context/UserContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  phone?: string;
  status: string;
}

const UserContext = createContext<UserProfile | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setProfile(snap.data() as UserProfile);
      } else {
        setProfile(null);
      }
    });

    return () => unsub();
  }, []);

  return <UserContext.Provider value={profile}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
