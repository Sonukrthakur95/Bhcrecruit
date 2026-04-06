import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../AuthContext";
import { addCandidate } from "../lib/api";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "../constants";
import { UserPlus, Loader2, CheckCircle, RefreshCw, Briefcase } from "lucide-react";
import { format } from "date-fns";

import { motion, AnimatePresence } from "motion/react";

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
});

type CandidateFormData = z.infer<typeof candidateSchema>;

interface ExternalJob {
  Name: string;
  Role: string;
  Location: string;
}

export function CandidateForm() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [externalJobs, setExternalJobs] = useState<ExternalJob[]>([]);
  const [fetchingJobs, setFetchingJobs] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      setFetchingJobs(true);
      try {
        const response = await fetch("/api/external-jobs");
        if (!response.ok) throw new Error("Failed to fetch via proxy");
        const data = await response.json();
        setExternalJobs(data);
      } catch (error) {
        console.error("Error fetching external jobs:", error);
      } finally {
        setFetchingJobs(false);
      }
    };
    fetchJobs();
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
      const job = externalJobs.find(j => j.Name === selectedPosition);
      if (job) {
        setValue("roleName", job.Role);
        setValue("clientName", job.Name);
      }
    }
  }, [selectedPosition, externalJobs, setValue]);

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
      };

      // 1. Local Sync (Firebase + Optional Google Sheets)
      await addCandidate(candidateData as any);

      // 2. External Sync (Via Proxy to avoid CORS)
      try {
        await fetch("/api/external-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(candidateData),
        });
      } catch (e) {
        console.warn("External sync failed, but local sync succeeded:", e);
      }

      setSuccess(true);
      reset();
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
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
              <p className="text-sm text-slate-500">Enter candidate details and sync with Google Sheets</p>
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
                Candidate Added & Synced!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Candidate Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Candidate Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  {...register("candidateName")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="John Doe"
                />
                {errors.candidateName && <p className="text-red-500 text-xs mt-1">{errors.candidateName.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email ID</label>
                  <input
                    {...register("candidateEmail")}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                  {errors.candidateEmail && <p className="text-red-500 text-xs mt-1">{errors.candidateEmail.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                  <input
                    {...register("candidatePhone")}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="+1 234 567 890"
                  />
                  {errors.candidatePhone && <p className="text-red-500 text-xs mt-1">{errors.candidatePhone.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Experience</label>
                  <input
                    {...register("experience")}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="e.g. 5 Years"
                  />
                  {errors.experience && <p className="text-red-500 text-xs mt-1">{errors.experience.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notice Period</label>
                  <input
                    {...register("noticePeriod")}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="e.g. 30 Days"
                  />
                  {errors.noticePeriod && <p className="text-red-500 text-xs mt-1">{errors.noticePeriod.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skill Set</label>
                <input
                  {...register("skill")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="React, Node.js, TypeScript"
                />
                {errors.skill && <p className="text-red-500 text-xs mt-1">{errors.skill.message}</p>}
              </div>
            </div>

            {/* Role Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Position & Client</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                  Position ID
                  {fetchingJobs && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                </label>
                <div className="relative">
                  <input
                    {...register("positionId")}
                    list="positions-list"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                    placeholder="Type or select a position ID..."
                  />
                  <datalist id="positions-list">
                    {externalJobs.map((job, idx) => (
                      <option key={idx} value={job.Name}>{job.Role} - {job.Name}</option>
                    ))}
                  </datalist>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">You can enter a custom ID or select from the list.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role Name</label>
                <input
                  {...register("roleName")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Senior Software Engineer"
                />
                {errors.roleName && <p className="text-red-500 text-xs mt-1">{errors.roleName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
                <input
                  {...register("clientName")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Tech Corp"
                />
                {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                <input
                  {...register("source")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="LinkedIn, Referral, etc."
                />
                {errors.source && <p className="text-red-500 text-xs mt-1">{errors.source.message}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                {...register("status")}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
              >
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                {...register("priority")}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
              >
                {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up Date</label>
              <input
                type="date"
                {...register("followUpDate")}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resume URL</label>
              <input
                {...register("resumeUrl")}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="https://link-to-resume.com"
              />
              {errors.resumeUrl && <p className="text-red-500 text-xs mt-1">{errors.resumeUrl.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Remark</label>
              <textarea
                {...register("remarks")}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Short remark..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comments</label>
              <textarea
                {...register("comments")}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Detailed comments..."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit & Sync"}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
