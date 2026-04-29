import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import Markdown from "react-markdown";
import { 
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
  AlertCircle,
  Sparkles,
  FileText,
  ClipboardCheck,
  UserCheck,
  Brain
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../AuthContext";
import { importCsvData } from "../lib/importCsv";
import { addCandidate } from "../lib/api";
import { format } from "date-fns";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export function RecruiterTools() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"tips" | "import" | "screener">("screener");

  // Screener state
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [screenerError, setScreenerError] = useState("");

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

  const handleScreening = async () => {
    if (!jdText.trim() || !resumeText.trim()) {
      setScreenerError("Please provide both a Job Description and a Candidate Resume.");
      return;
    }

    setAnalyzing(true);
    setScreenerError("");
    setAnalysis(null);

    try {
      const response = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: `Analyze the following Job Description and Candidate Resume.
      
      JOB DESCRIPTION:
      ${jdText}
      
      CANDIDATE RESUME:
      ${resumeText}
      
      Generate the Elite Talent Screener report in Markdown format.`,
        config: {
          systemInstruction: `You are an Elite Talent Screener, a world-class Talent Acquisition Partner with 20+ years of experience hiring for global tech companies, fintech firms, and investment banks. Your purpose is to analyze a Job Description (JD) and a Candidate Resume with the rigor of both a senior recruiter and a hiring manager.

You perform structured hiring evaluations and produce clear, recruiter-grade assessments that help companies decide whether to hire a candidate.

When a user provides a Job Description and a Resume, follow this structured process:

STEP 1 — JD INTELLIGENCE
Extract and clearly summarize:
• Core responsibilities
• Must-have technical skills
• Good-to-have skills
• Required years of experience
• Domain or industry preference
• Seniority level
• Tools and technologies required

STEP 2 — CANDIDATE ANALYSIS
Evaluate the candidate resume against the JD and assess:
1. Skills match
2. Technical depth
3. Domain relevance
4. Years of relevant experience
5. Project complexity
6. Impact and measurable achievements
7. Stability of career
8. Seniority alignment
9. Red flags or potential hiring risks

STEP 3 — MATCH SCORING
Score the candidate from 0–10 on:
• Technical skills match
• Domain expertise
• Experience relevance
• Project experience
• Overall profile strength

Then calculate an Overall Match Score out of 100.

STEP 4 — KEYWORD ANALYSIS
Extract the most important keywords from the JD and compare them with the resume.
Provide:
• Missing keywords
• Strong matching keywords
• Suggested Boolean search keywords recruiters could use to source similar candidates.

STEP 5 — RECRUITER DECISION
Provide a clear hiring recommendation using one of the following:
✔ Strong Hire
✔ Shortlist
✔ Consider Later
✖ Reject

STEP 6 — RECRUITER NOTES
Provide practical insights a recruiter would share with the hiring manager:
• Why the candidate is strong or weak
• Interview focus areas
• Questions to validate skills
• Expected seniority and compensation level estimate if possible.

Always present the response in a clean structured report using the following sections:
1. JD Breakdown
2. Candidate Match Analysis
3. Skill Match Table
4. Missing Skills
5. Keyword Analysis
6. Recruiter Insights
7. Interview Questions to Validate Candidate
8. Final Hiring Recommendation

If the JD or Resume is missing, ask the user to provide both before performing the analysis. Use clear recruiter-style language, concise bullet points, and analytical reasoning similar to internal hiring evaluations used by large tech companies.`
        }
      });

      setAnalysis(response.text || "No analysis generated.");
    } catch (err) {
      console.error("Screening error:", err);
      setScreenerError("Failed to perform AI analysis. Please check your API configuration.");
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
          <h1 className="text-2xl font-bold text-slate-900">Recruiter Tools</h1>
          <p className="text-slate-500">Essential tools to help you manage and hire the best talent</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
          <button
            onClick={() => setActiveTab("screener")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === "screener" ? "bg-white text-[#002B5B] shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
          >
            Elite Screener
          </button>
          <button
            onClick={() => setActiveTab("tips")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === "tips" ? "bg-white text-[#002B5B] shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
          >
            Tips & Tricks
          </button>
          {profile?.role === "recruiter" && (
            <button
              onClick={() => setActiveTab("import")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === "import" ? "bg-white text-[#002B5B] shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Bulk Import
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "screener" ? (
          <motion.div
            key="screener"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Job Description
                </label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the Job Description here..."
                  className="w-full h-80 p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#002B5B] outline-none transition-all text-sm resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <UserCheck className="w-3 h-3" /> Candidate Resume
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste the Candidate Resume text here..."
                  className="w-full h-80 p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#002B5B] outline-none transition-all text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleScreening}
                disabled={analyzing || !jdText.trim() || !resumeText.trim()}
                className="group relative px-12 py-4 bg-[#002B5B] text-white rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-[#002B5B]/20 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative flex items-center gap-3">
                  {analyzing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-6 h-6" />
                      Run Elite Screening
                    </>
                  )}
                </span>
              </button>
            </div>

            {screenerError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 font-medium text-sm text-center">
                {screenerError}
              </div>
            )}

            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/50"
              >
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
                  <div className="w-12 h-12 bg-[#002B5B] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#002B5B]/20">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight italic">Elite Talent Assessment Report</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Confidential Recruitment Intelligence</p>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none 
                  prose-headings:text-slate-900 prose-headings:font-black prose-headings:tracking-tight
                  prose-h1:text-3xl prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-slate-100
                  prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:flex prose-h2:items-center prose-h2:gap-2
                  prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-base
                  prose-li:text-slate-600 prose-li:text-base
                  prose-strong:text-slate-900 prose-strong:font-bold
                  prose-table:border prose-table:border-slate-200 prose-table:rounded-xl prose-table:overflow-hidden
                  prose-th:bg-slate-50 prose-th:px-4 prose-th:py-3 prose-th:text-xs prose-th:font-black prose-th:uppercase prose-th:tracking-widest
                  prose-td:px-4 prose-td:py-3 prose-td:text-sm prose-td:border-t prose-td:border-slate-100
                  prose-blockquote:border-l-4 prose-blockquote:border-[#002B5B] prose-blockquote:bg-slate-50 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-xl prose-blockquote:italic
                ">
                  <Markdown>{analysis}</Markdown>
                </div>
              </motion.div>
            )}
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
