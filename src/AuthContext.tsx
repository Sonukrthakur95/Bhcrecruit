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
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true, error: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const email = user.email?.toLowerCase() || "";
        const userDocRef = doc(db, "users", user.uid);
        const roleDocRef = doc(db, "user_roles", email);
        
        // Initial permission check
        const [userDoc, roleDoc] = await Promise.all([
          getDoc(userDocRef),
          getDoc(roleDocRef)
        ]);

        const isAdmin = ADMIN_EMAILS.some(e => e.toLowerCase() === email);
        const isInvited = roleDoc.exists();
        
        // strictly enforce access: must be admin OR invited
        if (!isAdmin && !isInvited) {
          await auth.signOut();
          setUser(null);
          setProfile(null);
          setLoading(false);
          setError("Access Denied. You must be invited by an administrator to access this system.");
          return;
        }

        setUser(user);
        if (userDoc.exists()) {
          setProfile({ uid: user.uid, ...userDoc.data() } as UserProfile);
        } else {
          let role: UserRole = "recruiter";
          if (roleDoc.exists()) {
            role = roleDoc.data().role as UserRole;
          } else if (isAdmin) {
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
    <AuthContext.Provider value={{ user, profile, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
