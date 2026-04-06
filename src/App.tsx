import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { CandidateForm } from "./components/CandidateForm";
import { CandidateList } from "./components/CandidateList";
import { RecruiterTools } from "./components/RecruiterTools";
import { UserManagement } from "./components/UserManagement";
import { DailyLeadsForm } from "./components/DailyLeadsForm";
import { DailyLeadsDashboard } from "./components/DailyLeadsDashboard";
import { ConfigAlert } from "./components/ConfigAlert";
import { 
  LayoutDashboard, 
  UserPlus, 
  ListTodo, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Briefcase,
  Sparkles,
  Users,
  ClipboardList,
  BarChart2
} from "lucide-react";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import { cn } from "./lib/utils";

function Sidebar() {
  const { profile } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Add Candidate", path: "/add", icon: UserPlus },
    { label: profile?.role === "admin" ? "All Submissions" : "My Submissions", path: "/list", icon: ListTodo },
    { label: "Recruiter Tools", path: "/tools", icon: Sparkles },
    ...(profile?.role === "recruiter" ? [
      { label: "Daily Leads Log", path: "/leads/add", icon: ClipboardList }
    ] : []),
    ...(profile?.role === "admin" ? [
      { label: "Leads Analytics", path: "/leads/dashboard", icon: BarChart2 },
      { label: "User Management", path: "/users", icon: Users }
    ] : []),
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-slate-100"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#002B5B] rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
              <span className="text-white font-black text-xl">BH</span>
            </div>
            <span className="text-xl font-bold text-[#002B5B]">BHC Recruit</span>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive 
                      ? "bg-blue-50 text-blue-600 shadow-sm" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                {profile?.displayName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{profile?.displayName}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{profile?.role}</p>
              </div>
            </div>
            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Greeting() {
  const { profile } = useAuth();
  const quotes = [
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "Don't watch the clock; do what it does. Keep going.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Your attitude determines how well you do it."
  ];
  const [quote] = React.useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <h1 className="text-2xl font-bold text-slate-900">
        Hello, {profile?.displayName}! 👋
      </h1>
      <p className="text-slate-500 italic mt-1 text-sm">
        "{quote}"
      </p>
    </div>
  );
}

function AppContent() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Initializing ATS...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-64">
      <Sidebar />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <Greeting />
        <ConfigAlert />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<CandidateForm />} />
          <Route path="/list" element={<CandidateList />} />
          <Route path="/tools" element={<RecruiterTools />} />
          <Route path="/leads/add" element={<DailyLeadsForm />} />
          <Route path="/leads/dashboard" element={<DailyLeadsDashboard />} />
          {profile?.role === "admin" && (
            <Route path="/users" element={<UserManagement />} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
