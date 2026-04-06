import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Search, 
  Lightbulb, 
  Target, 
  ChevronRight, 
  Loader2,
  BookOpen,
  Zap,
  CheckCircle2,
  Database,
  FileUp,
  AlertCircle
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../AuthContext";
import { importCsvData } from "../lib/importCsv";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function RecruiterTools() {
  const { profile } = useAuth();
  const [jd, setJd] = useState("");
  const [analysis, setAnalysis] = useState<{ summary: string; focus: string[] } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"analyzer" | "tips" | "import">("analyzer");

  // CSV Import state
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; skipped: number; failed: number } | null>(null);
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!csvText || !profile) return;
    setImporting(true);
    setImportResult(null);
    setError("");
    try {
      const result = await importCsvData(csvText, profile.uid, profile.displayName);
      setImportResult(result);
      setCsvText("");
    } catch (err) {
      console.error("Import error:", err);
      setError("Failed to parse CSV. Please check the format.");
    } finally {
      setImporting(false);
    }
  };

  const analyzeJD = async () => {
    if (!jd.trim()) return;
    setAnalyzing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following Job Description and provide:
1. A short, clear summary of what exactly this role is (2-3 sentences).
2. A list of 3-5 key focus areas/skills to look for to get the best relevant candidates.

Format the response as a JSON object with keys "summary" (string) and "focus" (array of strings).

JD:
${jd}`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const result = JSON.parse(response.text || "{}");
      setAnalysis(result);
    } catch (error) {
      console.error("Error analyzing JD:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const recruitmentTips = [
    {
      title: "The 24-Hour Rule",
      description: "Always follow up with top-tier candidates within 24 hours of their interview. Speed is your biggest competitive advantage in a tight talent market.",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-50"
    },
    {
      title: "Passive Sourcing",
      description: "Don't just wait for applicants. Use LinkedIn and GitHub to find people who aren't looking but have the perfect skill set for your niche roles.",
      icon: Search,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      title: "Candidate Experience",
      description: "Treat every candidate like a customer. Even if you reject them, a positive experience can lead to referrals or future hires.",
      icon: Target,
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    {
      title: "Structured Interviews",
      description: "Use the same set of questions for all candidates for a specific role to ensure objective comparison and reduce bias.",
      icon: CheckCircle2,
      color: "text-indigo-500",
      bg: "bg-indigo-50"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recruiter Intelligence</h1>
          <p className="text-slate-500">AI-powered tools to help you find and hire the best talent</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("analyzer")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "analyzer" ? "bg-white text-[#002B5B] shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
          >
            JD Analyzer
          </button>
          <button
            onClick={() => setActiveTab("tips")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "tips" ? "bg-white text-[#002B5B] shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
          >
            Tips & Tricks
          </button>
          {profile?.role === "recruiter" && (
            <button
              onClick={() => setActiveTab("import")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === "import" ? "bg-white text-[#002B5B] shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Bulk Import
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "analyzer" ? (
          <motion.div
            key="analyzer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-[#002B5B]" />
                <h2 className="font-semibold text-slate-800">Job Description Analyzer</h2>
              </div>
              <p className="text-sm text-slate-500">
                Paste the full job description below to get a concise summary and targeted sourcing focus areas.
              </p>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste Job Description here..."
                className="w-full h-80 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#002B5B] focus:border-transparent outline-none transition-all resize-none text-sm"
              />
              <button
                onClick={analyzeJD}
                disabled={analyzing || !jd.trim()}
                className="w-full py-3 bg-[#002B5B] text-white rounded-xl font-semibold hover:bg-[#001a38] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze Role
                  </>
                )}
              </button>
            </div>

            <div className="space-y-6">
              {!analysis && !analyzing && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                    <BookOpen className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-slate-900 font-semibold mb-1">No Analysis Yet</h3>
                  <p className="text-slate-500 text-sm max-w-xs">
                    Enter a job description on the left to see AI insights here.
                  </p>
                </div>
              )}

              {analyzing && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 animate-pulse">
                    <Sparkles className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-slate-900 font-semibold mb-1">Analyzing JD...</h3>
                  <p className="text-slate-500 text-sm">Our AI is extracting the core requirements.</p>
                </div>
              )}

              {analysis && !analyzing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      <h3 className="font-semibold text-slate-800">Role Summary</h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {analysis.summary}
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5 text-emerald-500" />
                      <h3 className="font-semibold text-slate-800">Sourcing Focus Areas</h3>
                    </div>
                    <div className="space-y-3">
                      {analysis.focus.map((item, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                          <div className="mt-1">
                            <ChevronRight className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="text-sm text-emerald-900 font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : activeTab === "tips" ? (
          <motion.div
            key="tips"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {recruitmentTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", tip.bg)}>
                    <Icon className={cn("w-6 h-6", tip.color)} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{tip.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {tip.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="import"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Bulk Import Candidates</h2>
                  <p className="text-xs text-slate-500">Paste CSV data to import candidates into Firestore.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Date,Client,Skill,Position ID,Candidate Name,Contact,Email id,Exp,Notice period,Status,Comments..."
                className="w-full h-64 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-xs resize-none"
              />
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Expected columns: Date, Client, Skill, Position ID, Candidate Name, Contact, Email id, Exp, Notice period, Status, Comments
                </div>
                <button
                  onClick={handleImport}
                  disabled={importing || !csvText}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-100"
                >
                  {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                  Import Data
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
                {importResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm grid grid-cols-3 gap-4 text-center"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase opacity-60">Success</p>
                      <p className="text-lg font-black">{importResult.success}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase opacity-60">Skipped</p>
                      <p className="text-lg font-black">{importResult.skipped}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase opacity-60">Failed</p>
                      <p className="text-lg font-black">{importResult.failed}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
