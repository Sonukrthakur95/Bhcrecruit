import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile, UserRole } from "./types";
import { ADMIN_EMAILS } from "./constants";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setProfile({ uid: user.uid, ...userDoc.data() } as UserProfile);
        } else {
          // Check for pre-authorized role
          const userEmail = user.email?.toLowerCase() || "";
          const roleDocRef = doc(db, "user_roles", userEmail);
          const roleDoc = await getDoc(roleDocRef);
          
          let role: UserRole = "recruiter";
          if (roleDoc.exists()) {
            role = roleDoc.data().role as UserRole;
          } else if (ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail)) {
            role = "admin";
          }

          const newProfile = {
            email: user.email || "",
            role,
            displayName: user.displayName || user.email?.split("@")[0] || "User",
          };
          await setDoc(userDocRef, newProfile);
          setProfile({ uid: user.uid, ...newProfile } as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
