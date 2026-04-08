import React, { useEffect, useState } from "react";
import { subscribeToCandidates } from "../lib/api";
import { Candidate } from "../types";
import { useAuth } from "../AuthContext";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { differenceInDays, parseISO } from "date-fns";
import confetti from "canvas-confetti";
import { AdminAISearch } from "./AdminAISearch";
import { ConfigAlert } from "./ConfigAlert";
import { motion, AnimatePresence } from "motion/react";

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

export function Dashboard() {
  const { profile } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevCount, setPrevCount] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!profile) return;
    
    const recruiterName = profile.role === "recruiter" ? profile.displayName : undefined;
    const unsubscribe = subscribeToCandidates((data) => {
      // Check for new candidates to trigger celebration
      if (prevCount !== null && data.length > prevCount) {
        triggerCelebration();
      }
      setPrevCount(data.length);
      setCandidates(data);
      setLoading(false);
    }, recruiterName);

    return () => unsubscribe();
  }, [profile, prevCount]);

  const triggerCelebration = () => {
    // Confetti celebration
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
    });

    // Show Mario-style notification
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 5000);
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;

  const totalSubmissions = candidates.length;
  const totalOffers = candidates.filter(c => c.status === "Offered").length;
  const totalJoined = candidates.filter(c => c.status === "Joined").length;
  const totalInterviews = candidates.filter(c => c.status.includes("Interview")).length;
  
  const conversionRate = totalSubmissions > 0 ? ((totalOffers / totalSubmissions) * 100).toFixed(1) : 0;
  
  const avgAging = candidates.length > 0 
    ? (candidates.reduce((acc, c) => acc + differenceInDays(new Date(), parseISO(c.stageUpdatedDate)), 0) / candidates.length).toFixed(1)
    : 0;

  const stuckCandidates = candidates.filter(c => 
    differenceInDays(new Date(), parseISO(c.stageUpdatedDate)) > 5 && 
    !["Joined", "Rejected"].includes(c.status)
  );

  // Recruiter Performance Data
  const recruiterPerformance = candidates.reduce((acc: { name: string, count: number }[], c) => {
    if (c.status === "Joined") {
      const existing = acc.find(item => item.name === c.recruiterName);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ name: c.recruiterName, count: 1 });
      }
    }
    return acc;
  }, []).sort((a, b) => b.count - a.count);

  // Chart Data
  const statusData = [
    { name: "Submitted", value: candidates.filter(c => c.status === "Submitted").length },
    { name: "Screening", value: candidates.filter(c => c.status === "Screening").length },
    { name: "Interviews", value: totalInterviews },
    { name: "Offered", value: totalOffers },
    { name: "Joined", value: totalJoined },
    { name: "Rejected", value: candidates.filter(c => c.status === "Rejected").length },
  ].filter(d => d.value > 0);

  const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#10b981", "#059669", "#ef4444"];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Greeting />
      <ConfigAlert />
      
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.5 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-blue-500"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl animate-bounce">
              🍄
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Level Up!</p>
              <p className="text-lg font-black text-slate-900">New Candidate Submitted!</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl animate-pulse">
              ⭐
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {profile?.role === "admin" ? "Admin Overview" : "My Performance"}
          </h1>
          <p className="text-slate-500">Real-time recruitment metrics and insights</p>
        </div>
      </div>

      {/* AI Search for Admins */}
      {profile?.role === "admin" && (
        <AdminAISearch candidates={candidates} />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard 
            title="Total Submissions" 
            value={totalSubmissions} 
            icon={<Users className="w-6 h-6 text-[#002B5B]" />}
            color="bg-blue-50"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard 
            title="Total Offers" 
            value={totalOffers} 
            icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
            color="bg-emerald-50"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatCard 
            title="Conversion Rate" 
            value={`${conversionRate}%`} 
            icon={<TrendingUp className="w-6 h-6 text-indigo-600" />}
            color="bg-indigo-50"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <StatCard 
            title="Avg Stage Aging" 
            value={`${avgAging} days`} 
            icon={<Clock className="w-6 h-6 text-amber-600" />}
            color="bg-amber-50"
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-800">Pipeline Distribution</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {statusData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-600">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Alerts */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-slate-800">Attention Required</h2>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {stuckCandidates.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No urgent alerts at the moment.</p>
            ) : (
              <AnimatePresence mode="popLayout">
                {stuckCandidates.map(c => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={c.id} 
                    className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-amber-900">{c.candidateName}</p>
                      <p className="text-sm text-amber-700">{c.status} • {differenceInDays(new Date(), parseISO(c.stageUpdatedDate))} days stuck</p>
                    </div>
                    <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                      {c.priority}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recruiter Performance - Only for Admin or if there's data */}
      {recruiterPerformance.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-slate-800">Recruiter Performance (Joined)</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recruiterPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  name="Candidates Joined" 
                  fill="#002B5B" 
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
