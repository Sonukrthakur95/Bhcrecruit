import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile, UserRole } from "../types";
import { ADMIN_EMAILS } from "../constants";
import { 
  UserPlus, 
  Shield, 
  User as UserIcon, 
  Trash2, 
  Mail, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  UserCheck
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<{ email: string; role: UserRole }[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("recruiter");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const usersUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setUsers(usersData);
    });

    const invitesUnsubscribe = onSnapshot(collection(db, "user_roles"), (snapshot) => {
      const invitesData = snapshot.docs.map(doc => ({ email: doc.id, role: doc.data().role as UserRole }));
      setInvites(invitesData);
      setLoading(false);
    });

    return () => {
      usersUnsubscribe();
      invitesUnsubscribe();
    };
  }, []);

  const handleAddInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setSubmitting(true);
    setError("");
    setSuccess(false);
    
    try {
      const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        setError("User already exists. Change their role below.");
        setSubmitting(false);
        return;
      }

      await setDoc(doc(db, "user_roles", email.toLowerCase()), { role });
      setEmail("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error adding invite:", err);
      setError("Failed to add user. Check your permissions.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: UserRole) => {
    try {
      await setDoc(doc(db, "users", uid), { role: newRole }, { merge: true });
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  const handleDeleteInvite = async (inviteEmail: string) => {
    try {
      await deleteDoc(doc(db, "user_roles", inviteEmail));
    } catch (err) {
      console.error("Error deleting invite:", err);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("Remove this user? They will lose access until re-added.")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Invite new team members and manage their access rights. <strong>Note:</strong> Access is strictly restricted to invited users and administrators.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invite Form */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <UserPlus className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-800">Invite Member</h2>
            </div>

            <form onSubmit={handleAddInvite} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Assign Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("recruiter")}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                      role === "recruiter" 
                        ? "bg-blue-50 border-blue-200 text-blue-600 ring-2 ring-blue-500/20" 
                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                    )}
                  >
                    <UserIcon className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Recruiter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                      role === "admin" 
                        ? "bg-blue-50 border-blue-200 text-blue-600 ring-2 ring-blue-500/20" 
                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                    )}
                  >
                    <Shield className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Admin</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#002B5B] text-white py-4 rounded-2xl font-bold hover:bg-[#001a38] transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCheck className="w-5 h-5" />}
                Send Invitation
              </button>
            </form>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  Invitation sent successfully!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* User Lists */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Users */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Active Team Members
              </h2>
              <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-500 rounded-full">
                {users.length} Users
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {users.map((user) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={user.uid} 
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg shadow-sm">
                        {user.displayName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{user.displayName}</p>
                          {ADMIN_EMAILS.some(e => e.toLowerCase() === user.email.toLowerCase()) && (
                            <span className="text-[10px] font-black px-2 py-0.5 bg-[#002B5B] text-white rounded-md uppercase tracking-wider">
                              System Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={user.role}
                        disabled={ADMIN_EMAILS.some(e => e.toLowerCase() === user.email.toLowerCase())}
                        onChange={(e) => handleUpdateRole(user.uid, e.target.value as UserRole)}
                        className={cn(
                          "text-xs font-bold px-4 py-2 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer disabled:cursor-not-allowed",
                          user.role === "admin" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                        )}
                      >
                        <option value="recruiter">Recruiter</option>
                        <option value="admin">Admin</option>
                      </select>
                      {!ADMIN_EMAILS.some(e => e.toLowerCase() === user.email.toLowerCase()) && (
                        <button
                          onClick={() => handleDeleteUser(user.uid)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Pending Invites */}
          {invites.length > 0 && (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-500" />
                Pending Authorizations
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                  {invites.map((invite) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      key={invite.email} 
                      className="flex items-center justify-between p-4 rounded-2xl border border-amber-50 bg-amber-50/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-amber-100 flex items-center justify-center text-amber-500 shadow-sm">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{invite.email}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md">
                              {invite.role}
                            </span>
                            <span className="text-xs text-amber-600 italic">Waiting for login...</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteInvite(invite.email)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
