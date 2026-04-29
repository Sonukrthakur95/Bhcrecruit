import React, { useEffect, useState } from "react";
import { subscribeToCandidates, updateCandidate, deleteCandidate } from "../lib/api";
import { Candidate } from "../types";
import { useAuth } from "../AuthContext";
import { STATUS_OPTIONS } from "../constants";
import { 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Calendar,
  ChevronDown,
  Loader2,
  Briefcase,
  MessageSquare,
  Award,
  Trash2,
  User,
  MapPin,
  Building,
  GraduationCap,
  History,
  Save,
  CheckCircle,
  XCircle,
  Edit,
  X,
  Cpu,
  Zap,
  BarChart,
  ListChecks
} from "lucide-react";
import { format } from "date-fns";
import { cn, safeFormat } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export function CandidateList() {
  const { profile } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackMode, setFeedbackMode] = useState<{ id: string, type: 'client' | 'internal' | 'rejection' } | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    if (!profile) return;
    const recruiterUid = profile.role === "recruiter" ? profile.uid : undefined;
    return subscribeToCandidates((data) => {
      setCandidates(data);
      setLoading(false);
    }, recruiterUid);
  }, [profile]);

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      await updateCandidate(candidateId, {
        status: newStatus as any,
        stageUpdatedDate: format(new Date(), "yyyy-MM-dd"),
      });
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleSaveFeedback = async () => {
    if (!feedbackMode) return;
    try {
      const updates: any = {};
      if (feedbackMode.type === 'client') updates.clientFeedback = feedbackText;
      if (feedbackMode.type === 'internal') updates.internalFeedback = feedbackText;
      if (feedbackMode.type === 'rejection') updates.rejectionReason = feedbackText;
      
      await updateCandidate(feedbackMode.id, updates);
      setFeedbackMode(null);
      setFeedbackText("");
    } catch (err) {
      alert("Failed to save feedback");
    }
  };

  const filteredData = candidates.filter(c => {
    const searchStr = `${c.candidateName} ${c.candidateEmail} ${c.skill} ${c.roleName} ${c.clientName}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDeleteCandidate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this profile forever?")) return;
    try {
      await deleteCandidate(id);
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#002B5B] tracking-tight">Talent Pipeline</h1>
          <p className="text-slate-500 font-medium">Manage and track your expert candidates</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Instant search profiles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all w-full md:w-80 bg-white"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-semibold text-slate-700"
          >
            <option value="All">All Stages</option>
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-slate-500 font-medium animate-pulse">Syncing pipeline data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium font-mono uppercase tracking-widest">No candidates found</p>
          </div>
        ) : (
          filteredData.map((c) => (
            <motion.div 
              key={c.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300",
                expandedId === c.id ? "ring-2 ring-blue-500/20 shadow-xl" : "hover:shadow-md hover:border-slate-200"
              )}
            >
              <div 
                onClick={() => toggleExpand(c.id)}
                className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-blue-50 transition-colors">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-2">
                      {c.candidateName}
                      {c.matchScore && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {c.matchScore}% Match
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {c.clientName}</span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {c.roleName}</span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {safeFormat(c.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1">
                    <select
                      value={c.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      className={cn(
                        "text-xs font-black px-4 py-1.5 rounded-full border-none outline-none cursor-pointer uppercase tracking-widest",
                        getStatusColor(c.status)
                      )}
                    >
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Pipeline State</span>
                  </div>
                  
                  <div className="h-10 w-[1px] bg-slate-100 mx-2 hidden md:block"></div>
                  
                  <button 
                    onClick={(e) => handleDeleteCandidate(e, c.id)}
                    className="p-2 hover:bg-red-50 rounded-xl transition-all text-slate-300 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  <motion.div
                    animate={{ rotate: expandedId === c.id ? 180 : 0 }}
                    className="text-slate-400"
                  >
                    <ChevronDown className="w-6 h-6" />
                  </motion.div>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === c.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-50 bg-[#F8FAFC]"
                  >
                    <div className="p-8 space-y-10">
                      {/* Top Bar Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <button 
                          onClick={() => { setFeedbackMode({ id: c.id, type: 'client' }); setFeedbackText(c.clientFeedback || ""); }}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4 text-blue-500" /> Client Feedback
                        </button>
                        <button 
                          onClick={() => { setFeedbackMode({ id: c.id, type: 'internal' }); setFeedbackText(c.internalFeedback || ""); }}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4 text-emerald-500" /> Recruiter Notes
                        </button>
                        <button 
                          onClick={() => { setFeedbackMode({ id: c.id, type: 'rejection' }); setFeedbackText(c.rejectionReason || ""); }}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4 text-red-500" /> Rejection Log
                        </button>
                      </div>

                      {/* AI Screening Insights */}
                      {c.screenerReport && (
                        <div className="bg-white border border-emerald-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row gap-8">
                          <div className="md:w-1/4 flex flex-col items-center justify-center p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                              <Cpu className="w-8 h-8 text-emerald-600" />
                            </div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">AI Recommendation</p>
                            <h5 className={cn(
                              "text-lg font-black uppercase tracking-tighter",
                              c.screenerDecision === "Strong Hire" ? "text-emerald-700" :
                              c.screenerDecision === "Shortlist" ? "text-amber-600" : "text-red-600"
                            )}>
                              {c.screenerDecision}
                            </h5>
                            <div className="mt-4 flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
                              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span className="text-xs font-bold text-slate-700">{c.matchScore}% Match</span>
                            </div>
                          </div>

                          <div className="flex-1 space-y-6">
                            <div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <BarChart className="w-3 h-3 text-blue-500" /> Technical Alignment Reasoning
                              </h4>
                              {(() => {
                                try {
                                  const report = JSON.parse(c.screenerReport || "{}");
                                  return (
                                    <div className="space-y-4">
                                      <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-emerald-200 pl-4 bg-emerald-50/30 py-2 rounded-r-lg">
                                        "{report.reasoning}"
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Skills Gap Analysis</p>
                                          <p className="text-xs text-slate-600 leading-relaxed">{report.skillsMatch}</p>
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Expert Screening Questions</p>
                                          <ul className="space-y-2">
                                            {report.interviewQuestions?.map((q: string, i: number) => (
                                              <li key={i} className="text-[10px] text-slate-500 flex items-start gap-2 bg-slate-50 p-2 rounded-lg">
                                                <span className="w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] font-black border border-slate-100 shrink-0">{i+1}</span>
                                                {q}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                } catch { return <p className="text-xs italic text-slate-400">Analysis report format deprecated.</p>; }
                              })()}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Profile Info */}
                        <div className="space-y-8">
                          <section>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Core Intelligence</h4>
                            <div className="space-y-4">
                              <div className="flex items-start gap-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100"><Mail className="w-4 h-4 text-slate-400" /></div>
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Email</p><p className="text-sm font-semibold text-slate-700">{c.candidateEmail}</p></div>
                              </div>
                              <div className="flex items-start gap-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100"><Phone className="w-4 h-4 text-slate-400" /></div>
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Phone</p><p className="text-sm font-semibold text-slate-700">{c.candidatePhone}</p></div>
                              </div>
                              <div className="flex items-start gap-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100"><MapPin className="w-4 h-4 text-slate-400" /></div>
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Location</p><p className="text-sm font-semibold text-slate-700">{c.currentLocation || "N/A"}</p></div>
                              </div>
                              <div className="flex items-start gap-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100"><Building className="w-4 h-4 text-slate-400" /></div>
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Employer</p><p className="text-sm font-semibold text-slate-700">{c.currentCompany || "N/A"}</p></div>
                              </div>
                            </div>
                          </section>
                          
                          <section>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Qualifications</h4>
                            <div className="space-y-4">
                              <div className="flex items-start gap-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100"><History className="w-4 h-4 text-blue-400" /></div>
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Exp Level</p><p className="text-sm font-semibold text-slate-700">{c.experience}</p></div>
                              </div>
                              <div className="flex items-start gap-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100"><GraduationCap className="w-4 h-4 text-blue-400" /></div>
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Education</p><p className="text-xs font-semibold text-slate-600 leading-relaxed">{c.education || "N/A"}</p></div>
                              </div>
                            </div>
                          </section>
                        </div>

                        {/* Experience & Skills */}
                        <div className="lg:col-span-2 space-y-8">
                          <section>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Skill Arsenal</h4>
                            <div className="flex flex-wrap gap-2">
                              {c.skill.split(',').map(s => (
                                <span key={s} className="px-4 py-2 bg-white rounded-xl border border-slate-100 text-[11px] font-black text-slate-600 shadow-sm uppercase tracking-tighter hover:border-blue-400 transition-colors">
                                  {s.trim()}
                                </span>
                              ))}
                            </div>
                          </section>

                          <section>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Career Trajectory</h4>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                              <div className="flex gap-4">
                                <div className="p-3 bg-blue-50 rounded-2xl text-blue-500 h-fit"><Briefcase className="w-6 h-6" /></div>
                                <div className="space-y-2">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">Work History / Summary</p>
                                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                    {c.workHistory || "No detailed work history extracted."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </section>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Recruiter Remarks</h4>
                              <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 italic text-sm text-slate-600">
                                "{c.remarks || "No internal remarks provided."}"
                              </div>
                            </section>
                            <section>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Submission Notes</h4>
                              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 text-sm text-slate-600">
                                {c.comments || "No additional comments."}
                              </div>
                            </section>
                          </div>
                        </div>
                      </div>

                      {/* Feedback Display */}
                      {(c.clientFeedback || c.internalFeedback || c.rejectionReason) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-slate-100">
                          {c.clientFeedback && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="w-3 h-3" /> Client Response
                              </p>
                              <p className="text-xs text-slate-600 bg-blue-50 p-4 rounded-xl border border-blue-100">{c.clientFeedback}</p>
                            </div>
                          )}
                          {c.internalFeedback && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                <Award className="w-3 h-3" /> Internal Review
                              </p>
                              <p className="text-xs text-slate-600 bg-emerald-50 p-4 rounded-xl border border-emerald-100">{c.internalFeedback}</p>
                            </div>
                          )}
                          {c.rejectionReason && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                <XCircle className="w-3 h-3" /> Rejection Summary
                              </p>
                              <p className="text-xs text-slate-600 bg-red-50 p-4 rounded-xl border border-red-100">{c.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {feedbackMode && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 capitalize">
                  {feedbackMode.type === 'rejection' ? 'Log Rejection Detail' : `Add ${feedbackMode.type} Feedback`}
                </h3>
                <button onClick={() => setFeedbackMode(null)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X />
                </button>
              </div>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share detailed points here..."
                rows={6}
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all resize-none bg-slate-50"
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => setFeedbackMode(null)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSaveFeedback}
                  className="flex-1 py-3 bg-[#002B5B] text-white rounded-xl font-bold hover:bg-blue-900 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Update
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "Submitted": return "bg-blue-600 text-white";
    case "Screening": return "bg-indigo-600 text-white";
    case "Interview Round 1":
    case "Interview Round 2": return "bg-purple-600 text-white";
    case "Client Round": return "bg-amber-500 text-white";
    case "Offered": return "bg-emerald-500 text-white";
    case "Joined": return "bg-green-600 text-white";
    case "Rejected": return "bg-red-600 text-white";
    default: return "bg-slate-100 text-slate-700";
  }
}
