import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../AuthContext";
import { LogIn, Loader2 } from "lucide-react";
import { ADMIN_EMAILS } from "../constants";

export function Login() {
  const { error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const displayError = error || authError;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const email = result.user.email || "";
      const isAllowed = email.toLowerCase().endsWith("@bullhornconsultants.com") || 
                        ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase());
      
      if (!isAllowed) {
        await auth.signOut();
        setError("Access restricted. Please sign in with your @bullhornconsultants.com email address.");
        return;
      }
    } catch (err: any) {
      setError("Failed to sign in with Google. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#002B5B] rounded-2xl mb-4 shadow-lg shadow-blue-100">
            <span className="text-white font-black text-2xl">BH</span>
          </div>
          <h1 className="text-2xl font-bold text-[#002B5B]">BHC Recruit ATS</h1>
          <p className="text-slate-500 mt-2">Sign in to manage your recruitment pipeline</p>
          <div className="mt-2 inline-block px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
              Authorized domain: bullhornconsultants.com
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {displayError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
              {displayError}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl border border-slate-200 transition-all shadow-sm flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Sign in with Google
              </>
            )}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Internal system for authorized employees only.
          </p>
        </div>
      </div>
    </div>
  );
}
