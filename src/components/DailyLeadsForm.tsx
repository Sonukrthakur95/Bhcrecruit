import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";
import { 
  ClipboardList, 
  Send, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Globe
} from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "motion/react";

const SOURCES = ["Naukri", "LinkedIn", "Team Lead", "Indeed", "Monster", "Other"];

const leadSchema = z.object({
  candidateName: z.string().min(2, "Candidate name is required"),
  candidateEmail: z.string().email("Invalid email address"),
  candidatePhone: z.string().min(10, "Invalid phone number"),
  roleName: z.string().min(2, "Role name is required"),
  clientName: z.string().min(2, "Client name is required"),
  source: z.string().min(2, "Source is required"),
  remarks: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

export function DailyLeadsForm() {
  const { profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      source: "Naukri",
    }
  });

  const onSubmit = async (data: LeadFormData) => {
    if (!profile) return;
    
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      await addDoc(collection(db, "dailyLeads"), {
        ...data,
        date: format(new Date(), "yyyy-MM-dd"),
        recruiterUid: profile.uid,
        recruiterName: profile.displayName,
        remarks: data.remarks || "",
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error adding daily lead:", err);
      setError("Failed to save lead details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 text-center md:text-left">Add New Lead</h1>
          <p className="text-slate-500 text-center md:text-left">Log details for every lead you work on today.</p>
        </div>
        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="hidden md:flex items-center gap-2 text-emerald-600 font-medium"
            >
              <CheckCircle2 className="w-5 h-5" />
              Lead Saved!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
        {/* Candidate Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <User className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Candidate Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Candidate Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register("candidateName")}
                  placeholder="Full Name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#002B5B] outline-none transition-all"
                />
              </div>
              {errors.candidateName && <p className="text-red-500 text-xs">{errors.candidateName.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register("candidateEmail")}
                  placeholder="email@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#002B5B] outline-none transition-all"
                />
              </div>
              {errors.candidateEmail && <p className="text-red-500 text-xs">{errors.candidateEmail.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register("candidatePhone")}
                  placeholder="+91 00000 00000"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#002B5B] outline-none transition-all"
                />
              </div>
              {errors.candidatePhone && <p className="text-red-500 text-xs">{errors.candidatePhone.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Source</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  {...register("source")}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#002B5B] outline-none transition-all bg-white appearance-none"
                >
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {errors.source && <p className="text-red-500 text-xs">{errors.source.message}</p>}
            </div>
          </div>
        </div>

        {/* Submission Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Submission Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Role Name</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register("roleName")}
                  placeholder="e.g. Java Developer"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#002B5B] outline-none transition-all"
                />
              </div>
              {errors.roleName && <p className="text-red-500 text-xs">{errors.roleName.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Client Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register("clientName")}
                  placeholder="e.g. Google"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#002B5B] outline-none transition-all"
                />
              </div>
              {errors.clientName && <p className="text-red-500 text-xs">{errors.clientName.message}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Remarks / Notes</label>
          <textarea
            {...register("remarks")}
            placeholder="Any specific details about this lead..."
            className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#002B5B] outline-none transition-all resize-none"
          />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="md:hidden p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Lead details saved successfully!
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-[#002B5B] text-white rounded-2xl font-bold hover:bg-[#001a38] transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Lead Detail
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
