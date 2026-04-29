import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../AuthContext";
import { addCandidate, subscribeToJobs, subscribeToClients } from "../lib/api";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "../constants";
import { UserPlus, Loader2, CheckCircle, RefreshCw, Briefcase, FileSearch, AlertTriangle, Edit3, Cpu, Zap, BarChart, ListChecks, Upload } from "lucide-react";
import { format } from "date-fns";
import { parseResume, ParsedResume, analyzeAlignment, AlignmentReport } from "../lib/cvParser";
import { Job, Client } from "../types";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

import { BulkImportView } from "./BulkImportView";

const candidateSchema = z.object({
  roleName: z.string().min(2, "Role name is required"),
  clientName: z.string().min(2, "Client name is required"),
  candidateName: z.string().min(2, "Candidate name is required"),
  candidateEmail: z.string().email("Invalid email address"),
  candidatePhone: z.string().min(10, "Invalid phone number"),
  status: z.string(),
  source: z.string().min(2, "Source is required"),
  priority: z.enum(["Low", "Medium", "High"]),
  followUpDate: z.string(),
  remarks: z.string().optional(),
  skill: z.string().min(2, "Skill is required"),
  positionId: z.string().optional(),
  experience: z.string().min(1, "Experience is required"),
  noticePeriod: z.string().min(1, "Notice period is required"),
  comments: z.string().optional(),
  resumeUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
  // New fields from parser
  education: z.string().optional(),
  workHistory: z.string().optional(),
  currentCompany: z.string().optional(),
  currentLocation: z.string().optional(),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

export function CandidateForm() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [fetchingData, setFetchingData] = useState(false);

  // Parsing state
  const [resumeText, setResumeText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseConfidence, setParseConfidence] = useState<number | null>(null);

  // Screening state
  const [analyzing, setAnalyzing] = useState(false);
  const [alignmentReport, setAlignmentReport] = useState<AlignmentReport | null>(null);

  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  useEffect(() => {
    setFetchingData(true);
    const unsubJobs = subscribeToJobs(setJobs);
    const unsubClients = subscribeToClients(setClients);
    return () => {
      unsubJobs();
      unsubClients();
      setFetchingData(false);
    };
  }, []);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      status: "Submitted",
      priority: "Medium",
      followUpDate: format(new Date(), "yyyy-MM-dd"),
      source: "LinkedIn",
    }
  });

  const selectedPosition = watch("positionId");

  useEffect(() => {
    if (selectedPosition) {
      const job = jobs.find(j => j.id === selectedPosition);
      if (job) {
        setValue("roleName", job.title);
        setValue("clientName", job.clientName);
      }
    }
  }, [selectedPosition, jobs, setValue]);

  const handleParseResume = async () => {
    if (!resumeText.trim()) return;
    setParsing(true);
    setParseConfidence(null);
    try {
      const parsed = await parseResume(resumeText);
      setValue("candidateName", parsed.fullName);
      setValue("candidateEmail", parsed.email);
      setValue("candidatePhone", parsed.phone);
      setValue("skill", parsed.skills.join(", "));
      setValue("experience", parsed.totalExperience);
      setValue("education", parsed.education);
      setValue("workHistory", parsed.workHistory);
      setValue("currentCompany", parsed.currentCompany);
      setValue("currentLocation", parsed.currentLocation);
      setParseConfidence(parsed.confidenceScore);
    } catch (err) {
      console.error("Parse error:", err);
      alert("Failed to parse resume. Please fill manually.");
    } finally {
      setParsing(false);
    }
  };

  const handleRunScreening = async () => {
    if (!resumeText.trim() || !selectedPosition) {
      alert("Please enter resume text and select a job first.");
      return;
    }
    const job = jobs.find(j => j.id === selectedPosition);
    if (!job) return;

    setAnalyzing(true);
    try {
      const report = await analyzeAlignment(resumeText, job.description);
      setAlignmentReport(report);
      // Auto-set score if available
      setValue("remarks", `AI Decision: ${report.decision}. Match Score: ${report.matchScore}%. ${report.reasoning}`);
    } catch (err) {
      console.error("Screening error:", err);
      alert("Failed to generate alignment report.");
    } finally {
      setAnalyzing(false);
    }
  };

  const onSubmit = async (data: CandidateFormData) => {
    setLoading(true);
    try {
      const candidateData = {
        ...data,
        date: format(new Date(), "yyyy-MM-dd"),
        recruiterName: profile?.displayName || "Unknown",
        recruiterUid: profile?.uid || "Unknown",
        stageUpdatedDate: format(new Date(), "yyyy-MM-dd"),
        status: data.status as any,
        remarks: data.remarks || "",
        comments: data.comments || "",
        positionId: data.positionId || "N/A",
        resumeUrl: data.resumeUrl || "",
        resumeText: resumeText,
        matchScore: alignmentReport?.matchScore,
        screenerDecision: alignmentReport?.decision,
        screenerReport: alignmentReport ? JSON.stringify(alignmentReport) : undefined,
      };

      await addCandidate(candidateData as any);
      setSuccess(true);
      reset();
      setResumeText("");
      setParseConfidence(null);
      setAlignmentReport(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert("Failed to add candidate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Tab Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto mb-8">
        <button
          onClick={() => setActiveTab("single")}
          className={cn(
            "px-8 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
            activeTab === "single" ? "bg-white text-[#002B5B] shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <UserPlus className="w-4 h-4" /> Single Entry
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={cn(
            "px-8 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
            activeTab === "bulk" ? "bg-white text-[#002B5B] shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Upload className="w-4 h-4" /> AI Bulk Import
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "single" ? (
          <motion.div 
            key="single"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  initial={{ rotate: -10 }}
                  animate={{ rotate: 0 }}
                  className="p-2 bg-blue-600 rounded-lg text-white"
                >
                  <UserPlus className="w-5 h-5" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Add New Candidate</h2>
                  <p className="text-sm text-slate-500">Intelligent resume parsing and manual entry</p>
                </div>
              </div>
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 text-emerald-600 font-medium"
              >
                <CheckCircle className="w-5 h-5" />
                Candidate Processed!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Parser Side */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileSearch className="w-3 h-3" /> Resume Parser
              </label>
              {parseConfidence !== null && (
                <div className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                  parseConfidence > 80 ? "bg-emerald-50 text-emerald-600" : 
                  parseConfidence > 50 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                )}>
                  {parseConfidence < 60 && <AlertTriangle className="w-3 h-3" />}
                  Confidence: {parseConfidence}%
                </div>
              )}
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste Resume text here for AI parsing..."
              className="w-full h-[500px] p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm resize-none bg-slate-50 font-mono"
            />
            <button
              type="button"
              onClick={handleParseResume}
              disabled={parsing || !resumeText.trim()}
              className="w-full py-3 bg-[#002B5B] text-white rounded-xl font-bold hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {parsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              {parsing ? "Parsing CV..." : "Auto-Fill Form"}
            </button>

            <button
              type="button"
              onClick={handleRunScreening}
              disabled={analyzing || !resumeText.trim() || !selectedPosition}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-100"
            >
              {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cpu className="w-5 h-5" />}
              {analyzing ? "AI Screening..." : "Run AI Match Alignment"}
            </button>

            {alignmentReport && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-xl shadow-emerald-50 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Screener Report</span>
                  <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-bold text-emerald-700">{alignmentReport.matchScore}% Score</span>
                  </div>
                </div>

                <div className={cn(
                  "p-3 rounded-xl text-center font-black text-sm uppercase tracking-wider",
                  alignmentReport.decision === "Strong Hire" ? "bg-emerald-500 text-white" :
                  alignmentReport.decision === "Shortlist" ? "bg-amber-500 text-white" : "bg-red-500 text-white"
                )}>
                  {alignmentReport.decision}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Skill Gap Analysis</p>
                    <p className="text-xs text-slate-600 leading-relaxed italic">"{alignmentReport.skillsMatch}"</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tech Questions to Ask</p>
                    <ul className="space-y-1">
                      {alignmentReport.interviewQuestions.map((q, i) => (
                        <li key={i} className="text-[10px] text-slate-500 flex items-start gap-2">
                          <span className="w-3 h-3 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold shrink-0">{i+1}</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
            {parseConfidence !== null && parseConfidence < 60 && (
              <p className="text-[10px] text-amber-600 font-medium bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Low confidence score. Please review all fields marked with yellow indicator.
              </p>
            )}
          </div>

          {/* Form Side */}
          <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Candidate Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-l-4 border-blue-600 pl-3">Candidate Intelligence</h3>
              
              <div className="relative group">
                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                <input
                  {...register("candidateName")}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all",
                    parseConfidence !== null && parseConfidence < 70 && "bg-amber-50/30 border-amber-200"
                  )}
                />
                {errors.candidateName && <p className="text-red-500 text-[10px] mt-1">{errors.candidateName.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Email ID</label>
                  <input
                    {...register("candidateEmail")}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all",
                      parseConfidence !== null && parseConfidence < 70 && "bg-amber-50/30 border-amber-200"
                    )}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Contact Number</label>
                  <input
                    {...register("candidatePhone")}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all",
                      parseConfidence !== null && parseConfidence < 70 && "bg-amber-50/30 border-amber-200"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Experience</label>
                  <input
                    {...register("experience")}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Notice Period</label>
                  <input
                    {...register("noticePeriod")}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Current Company</label>
                <input
                  {...register("currentCompany")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Current Location</label>
                <input
                  {...register("currentLocation")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Education</label>
                <textarea
                  {...register("education")}
                  className="w-full h-16 px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs"
                />
              </div>
            </div>

            {/* Position Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-l-4 border-emerald-600 pl-3">Job Alignment</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                  Assign to Job
                  {fetchingData && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                </label>
                <select
                  {...register("positionId")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                >
                  <option value="">-- Select Active Job --</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title} at {job.clientName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Role Name</label>
                <input
                  {...register("roleName")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Client Name</label>
                <input
                  {...register("clientName")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Skill Set</label>
                <textarea
                  {...register("skill")}
                  className="w-full h-24 px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                  <select
                    {...register("status")}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white text-xs"
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Priority</label>
                  <select
                    {...register("priority")}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white text-xs"
                  >
                    {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="bg-[#002B5B] text-white font-bold px-10 py-3 rounded-xl transition-all shadow-xl shadow-blue-100 flex items-center gap-2 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                  Save Candidate
                </motion.button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    ) : (
          <motion.div
            key="bulk"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <BulkImportView onComplete={() => setActiveTab("single")} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
