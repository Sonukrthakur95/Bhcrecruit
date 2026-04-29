import React, { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle, Trash2, UserPlus, Briefcase, Building, MapPin, X } from "lucide-react";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { extractCandidatesFromText, extractCandidatesFromFile, ParsedResume } from "../lib/cvParser";
import { addCandidate, subscribeToJobs } from "../lib/api";
import { format } from "date-fns";
import { useAuth } from "../AuthContext";
import { Job } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface ExtractedCandidate extends ParsedResume {
  id: string;
  added?: boolean;
}

export function BulkImportView({ onComplete }: { onComplete?: () => void }) {
  const { profile } = useAuth();
  const [candidates, setCandidates] = useState<ExtractedCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [isOver, setIsOver] = useState(false);

  React.useEffect(() => {
    return subscribeToJobs(setJobs);
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let extracted: ParsedResume[] = [];

      if (ext === "csv" || ext === "xlsx" || ext === "xls") {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        let allText = "";
        workbook.SheetNames.forEach(sheetName => {
          allText += `Sheet: ${sheetName}\n` + XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]) + "\n\n";
        });
        extracted = await extractCandidatesFromText(allText);
      } else if (ext === "pdf") {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.readAsDataURL(file);
        });
        const b64 = await base64Promise;
        extracted = await extractCandidatesFromFile(b64, "application/pdf");
      } else if (ext === "docx" || ext === "doc") {
        const data = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer: data });
        extracted = await extractCandidatesFromText(res.value);
      } else {
        throw new Error("Unsupported file type. Please upload Excel, CSV, PDF, or Word documents.");
      }

      const withIds = extracted.map(c => ({
        ...c,
        id: Math.random().toString(36).substr(2, 9),
        added: false
      }));
      setCandidates(prev => [...prev, ...withIds]);
    } catch (err: any) {
      setError(err.message || "Failed to process file.");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  }, []);

  const removeCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const addCandidateToPipeline = async (candidate: ExtractedCandidate) => {
    const job = jobs.find(j => j.id === selectedJobId);
    
    const candidateData = {
      candidateName: candidate.fullName,
      candidateEmail: candidate.email,
      candidatePhone: candidate.phone,
      skill: candidate.skills.join(", "),
      experience: candidate.totalExperience,
      education: candidate.education,
      workHistory: candidate.workHistory,
      currentCompany: candidate.currentCompany,
      currentLocation: candidate.currentLocation,
      roleName: job?.title || "Unknown Role",
      clientName: job?.clientName || "Unknown Client",
      positionId: selectedJobId || "N/A",
      status: "Submitted",
      source: "Bulk Import",
      priority: "Medium",
      followUpDate: format(new Date(), "yyyy-MM-dd"),
      date: format(new Date(), "yyyy-MM-dd"),
      recruiterName: profile?.displayName || "Unknown",
      recruiterUid: profile?.uid || "Unknown",
      stageUpdatedDate: format(new Date(), "yyyy-MM-dd"),
      remarks: `Extracted via AI Bulk Import. Confidence: ${candidate.confidenceScore}%`,
      resumeText: `Name: ${candidate.fullName}\nExperience: ${candidate.totalExperience}\nWork History: ${candidate.workHistory}\nSkills: ${candidate.skills.join(", ")}`,
    };

    try {
      await addCandidate(candidateData as any);
      setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, added: true } : c));
    } catch (err) {
      alert("Failed to add " + candidate.fullName);
    }
  };

  const addAll = async () => {
    if (!selectedJobId) {
      alert("Please select a job position to assign these candidates to.");
      return;
    }
    const toAdd = candidates.filter(c => !c.added);
    for (const c of toAdd) {
      await addCandidateToPipeline(c);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Upload Zone */}
        <div className="flex-1 space-y-4">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
            onDragLeave={() => setIsOver(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById("bulk-file")?.click()}
            className={cn(
              "border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all",
              isOver ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50",
              loading && "opacity-50 pointer-events-none"
            )}
          >
            <input 
              type="file" 
              id="bulk-file" 
              className="hidden" 
              accept=".csv,.xlsx,.xls,.pdf,.doc,.docx"
              onChange={(e) => handleFileUpload(e.target.files?.[0]!)}
            />
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {loading ? <Loader2 className="w-8 h-8 text-blue-600 animate-spin" /> : <Upload className="w-8 h-8 text-blue-600" />}
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {loading ? "AI is Extracting Data..." : "Bulk Import Candidates"}
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Drop CVs, Excel sheets or Word files here. AI will extract structured profiles instantly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              {["CSV", "Excel", "PDF", "Word"].map(type => (
                <span key={type} className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">{type}</span>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Configuration Side */}
        <div className="w-full md:w-80 space-y-4">
          <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Assignment Setting</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Job / Role</label>
                <select 
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                >
                  <option value="">Select Position...</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={addAll}
                disabled={candidates.length === 0 || !selectedJobId || candidates.every(c => c.added)}
                className="w-full py-4 bg-[#002B5B] text-white rounded-2xl font-bold disabled:opacity-50 shadow-lg shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-900 transition-all"
              >
                <UserPlus className="w-5 h-5" />
                Add All to Pipeline
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            Extraction Queue ({candidates.length})
          </h3>
          {candidates.length > 0 && (
            <button onClick={() => setCandidates([])} className="text-xs font-bold text-red-500 hover:underline">Clear All</button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {candidates.map((c) => (
              <motion.div 
                key={c.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex gap-4 relative group",
                  c.added && "opacity-60 grayscale bg-slate-50"
                )}
              >
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-900 truncate">{c.fullName || "Parsing..."}</h4>
                    {c.added ? (
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Synced</span>
                    ) : (
                      <button 
                        onClick={() => removeCandidate(c.id)}
                        className="p-1 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium"><Building className="w-3 h-3" /> {c.currentCompany || "N/A"}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium"><MapPin className="w-3 h-3" /> {c.currentLocation || "N/A"}</span>
                  </div>
                  {!c.added && (
                    <button 
                      onClick={() => addCandidateToPipeline(c)}
                      className="mt-4 w-full py-2 border border-blue-100 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      Process Profile
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {candidates.length === 0 && !loading && (
            <div className="md:col-span-2 py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <p className="text-slate-400 font-medium">No candidates in queue yet. Upload or drop a file above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
