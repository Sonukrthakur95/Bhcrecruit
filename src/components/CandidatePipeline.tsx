import React, { useEffect, useState, useMemo } from "react";
import { subscribeToCandidates, updateCandidate } from "../lib/api";
import { Candidate, CandidateStatus } from "../types";
import { useAuth } from "../AuthContext";
import { STATUS_OPTIONS } from "../constants";
import { 
  Filter, 
  Loader2, 
  Briefcase, 
  User, 
  ChevronRight, 
  MoreHorizontal,
  Mail,
  Phone,
  Clock,
  Layout,
  Search,
  Calendar,
  ArrowRightLeft,
  X,
  Award,
  Globe,
  MessageSquare,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { cn, safeFormat } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export function CandidatePipeline() {
  const { profile } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("All Roles");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    if (!profile) return;

    const recruiterUid = profile.role === "recruiter" ? profile.uid : undefined;
    const unsubscribe = subscribeToCandidates((data) => {
      setCandidates(data);
      setLoading(false);
    }, recruiterUid);

    return () => unsubscribe();
  }, [profile]);

  const roles = useMemo(() => {
    const uniqueRoles = Array.from(new Set(candidates.map(c => c.roleName))).filter(Boolean);
    return ["All Roles", ...uniqueRoles.sort()];
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesRole = selectedRole === "All Roles" || c.roleName === selectedRole;
      const matchesSearch = c.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [candidates, selectedRole, searchTerm]);

  const groupedCandidates = useMemo(() => {
    const groups: Record<CandidateStatus, Candidate[]> = {} as any;
    STATUS_OPTIONS.forEach(status => {
      groups[status] = filteredCandidates.filter(c => c.status === status);
    });
    return groups;
  }, [filteredCandidates]);

  const handleStatusChange = async (candidateId: string, newStatus: CandidateStatus) => {
    try {
      await updateCandidate(candidateId, {
        status: newStatus,
        stageUpdatedDate: format(new Date(), "yyyy-MM-dd"),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layout className="w-6 h-6 text-blue-600" />
            Recruitment Pipeline
          </h1>
          <p className="text-slate-500 text-sm mt-1">Visualize and manage candidate progress across roles</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 ml-2" />
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer pr-8 py-1"
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
        {STATUS_OPTIONS.map((status) => (
          <div key={status} className="flex-shrink-0 w-80 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest">{status}</h3>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {groupedCandidates[status].length}
                </span>
              </div>
              <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 bg-slate-50/50 rounded-[2rem] p-3 min-h-[600px] border border-dashed border-slate-200">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {groupedCandidates[status].map((candidate) => (
                    <motion.div
                      key={candidate.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedCandidate(candidate)}
                      className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all group cursor-pointer"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shadow-inner">
                              {candidate.candidateName[0]}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {candidate.candidateName}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Briefcase className="w-3 h-3 text-slate-400" />
                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{candidate.roleName}</p>
                              </div>
                            </div>
                          </div>
                          <div className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                            candidate.priority === "High" ? "bg-red-50 text-red-600" : 
                            candidate.priority === "Medium" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {candidate.priority}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50/50 p-2 rounded-2xl border border-slate-100/50">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Experience</p>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
                              <Award className="w-3 h-3 text-blue-500" />
                              {candidate.experience}
                            </div>
                          </div>
                          <div className="bg-slate-50/50 p-2 rounded-2xl border border-slate-100/50">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notice Period</p>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
                              <Clock className="w-3 h-3 text-amber-500" />
                              {candidate.noticePeriod}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 border border-white shadow-sm">
                              {candidate.recruiterName[0]}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">{candidate.recruiterName.split(' ')[0]}</span>
                          </div>
                          
                          <div className="relative group/select" onClick={(e) => e.stopPropagation()}>
                            <ArrowRightLeft className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-500 pointer-events-none" />
                            <select
                              value={candidate.status}
                              onChange={(e) => handleStatusChange(candidate.id, e.target.value as CandidateStatus)}
                              className="text-[10px] font-bold bg-blue-50/50 text-blue-700 border-none rounded-xl py-1.5 pl-7 pr-8 focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none hover:bg-blue-50 transition-colors"
                            >
                              {STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-500 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {groupedCandidates[status].length === 0 && (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-300 gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100/50 flex items-center justify-center">
                      <User className="w-6 h-6 opacity-20" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">No Candidates</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Details Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="relative h-32 bg-[#002B5B] p-8">
                <button 
                  onClick={() => setSelectedCandidate(null)}
                  className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute -bottom-10 left-8">
                  <div className="w-24 h-24 rounded-[2rem] bg-white p-1.5 shadow-xl">
                    <div className="w-full h-full rounded-[1.5rem] bg-blue-50 flex items-center justify-center text-blue-600 font-black text-3xl">
                      {selectedCandidate.candidateName[0]}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-16 p-8 space-y-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">{selectedCandidate.candidateName}</h2>
                    <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                      <Briefcase className="w-4 h-4" />
                      {selectedCandidate.roleName} at {selectedCandidate.clientName}
                    </p>
                  </div>
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                    selectedCandidate.priority === "High" ? "bg-red-50 text-red-600" : 
                    selectedCandidate.priority === "Medium" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {selectedCandidate.priority} Priority
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-blue-500" />
                        {selectedCandidate.candidateEmail}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-blue-500" />
                        {selectedCandidate.candidatePhone}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Details</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Award className="w-4 h-4 text-blue-500" />
                        {selectedCandidate.experience} Experience
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Clock className="w-4 h-4 text-blue-500" />
                        {selectedCandidate.noticePeriod} Notice
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission Info</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        {safeFormat(selectedCandidate.date)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Globe className="w-4 h-4 text-blue-500" />
                        {selectedCandidate.source}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks & Comments</h4>
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remarks</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{selectedCandidate.remarks || "No remarks provided"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Comments</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{selectedCandidate.comments || "No comments provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                      {selectedCandidate.recruiterName[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedCandidate.recruiterName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Assigned Recruiter</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {selectedCandidate.resumeUrl && (
                      <a 
                        href={selectedCandidate.resumeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold transition-all"
                      >
                        View Resume
                      </a>
                    )}
                    <button 
                      onClick={() => setSelectedCandidate(null)}
                      className="px-8 py-3 bg-[#002B5B] hover:bg-[#003d82] text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-100 transition-all"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
