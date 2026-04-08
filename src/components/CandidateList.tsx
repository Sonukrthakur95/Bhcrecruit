import React, { useEffect, useState } from "react";
import { subscribeToCandidates, updateCandidate, deleteCandidate } from "../lib/api";
import { Candidate } from "../types";
import { useAuth } from "../AuthContext";
import { STATUS_OPTIONS } from "../constants";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Loader2,
  Briefcase,
  Clock,
  MessageSquare,
  Award,
  Globe,
  RefreshCw,
  Trash2,
  CheckSquare,
  Square
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn, safeFormat } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export function CandidateList() {
  const { profile } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [externalJobs, setExternalJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingExternal, setFetchingExternal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All"); // Extra option: Filter by Internal/External
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const fetchExternalJobs = async () => {
    if (profile?.role !== "admin") return;
    
    setFetchingExternal(true);
    try {
      const response = await fetch("/api/external-jobs");
      if (!response.ok) throw new Error("Failed to fetch via proxy");
      const data = await response.json();
      setExternalJobs(data.map((j: any, i: number) => ({
        ...j,
        id: `ext-${i}`,
        isExternal: true,
        status: "Open",
        date: format(new Date(), "yyyy-MM-dd"),
        candidateName: "N/A (Job Opening)",
        recruiterName: "System",
        roleName: j.Role,
        clientName: j.Name,
        remarks: j.Location,
        skill: "N/A",
        experience: "N/A",
        noticePeriod: "N/A",
        comments: "Fetched from external job board",
        priority: "Medium",
        followUpDate: format(new Date(), "yyyy-MM-dd"),
      })));
    } catch (error) {
      console.error("Error fetching external jobs:", error);
    } finally {
      setFetchingExternal(false);
    }
  };

  useEffect(() => {
    if (!profile) return;

    const recruiterUid = profile.role === "recruiter" ? profile.uid : undefined;
    const unsubscribe = subscribeToCandidates((data) => {
      setCandidates(data);
      setLoading(false);
    }, recruiterUid);

    if (profile.role === "admin") {
      fetchExternalJobs();
    }

    return () => unsubscribe();
  }, [profile]);

  const handleStatusChange = async (candidate: Candidate, newStatus: string) => {
    if ((candidate as any).isExternal) return;
    try {
      await updateCandidate(candidate.id, {
        status: newStatus as any,
        stageUpdatedDate: format(new Date(), "yyyy-MM-dd"),
      });
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const mergedData = [...candidates, ...externalJobs];

  const filteredData = mergedData.filter(c => {
    const matchesSearch = 
      c.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.candidateEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.skill?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    
    const matchesType = typeFilter === "All" || 
      (typeFilter === "Internal" && !c.isExternal) || 
      (typeFilter === "External" && c.isExternal);

    return matchesSearch && matchesStatus && matchesType;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.filter(c => !c.isExternal).length) {
      setSelectedIds(new Set());
    } else {
      const internalIds = filteredData.filter(c => !c.isExternal).map(c => c.id);
      setSelectedIds(new Set(internalIds));
    }
  };

  const handleDeleteCandidate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;
    
    setDeleting(true);
    try {
      await deleteCandidate(id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete candidate");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} selected candidates?`)) return;
    
    setDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map((id: string) => deleteCandidate(id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Failed to delete some candidates");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {profile?.role === "admin" ? "All Submissions & Openings" : "My Submissions"}
          </h1>
          <p className="text-slate-500">
            {profile?.role === "admin" 
              ? "Unified view of internal submissions and external job board data" 
              : "Track and manage your candidate pipeline"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all w-full md:w-64"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
            >
              <option value="All">All Status</option>
              {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              {profile?.role === "admin" && <option value="Open">Open (External)</option>}
            </select>

            {profile?.role === "admin" && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
              >
                <option value="All">All Types</option>
                <option value="Internal">Internal Submissions</option>
                <option value="External">External Openings</option>
              </select>
            )}
          </div>

          {profile?.role === "admin" && (
            <button 
              onClick={fetchExternalJobs}
              disabled={fetchingExternal}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
              title="Refresh External Data"
            >
              <RefreshCw className={cn("w-4 h-4", fetchingExternal && "animate-spin")} />
            </button>
          )}

          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-all font-medium text-sm"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Selected ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="w-10 px-6 py-4">
                  <button 
                    onClick={toggleSelectAll}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                  >
                    {selectedIds.size > 0 && selectedIds.size === filteredData.filter(c => !c.isExternal).length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="w-10 px-6 py-4"></th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate / Opening</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role & Client</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Follow-up</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    <p className="text-slate-500">Loading data...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No data found matching your criteria.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredData.flatMap((c) => [
                    <motion.tr 
                      key={c.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "hover:bg-slate-50 transition-colors group cursor-pointer",
                        expandedId === c.id && "bg-blue-50/30",
                        c.isExternal && "border-l-4 border-l-emerald-500"
                      )}
                      onClick={() => toggleExpand(c.id)}
                    >
                      <td className="px-6 py-4">
                        {!c.isExternal && (
                          <button
                            onClick={(e) => toggleSelect(e, c.id)}
                            className="p-1 hover:bg-white rounded transition-colors"
                          >
                            {selectedIds.has(c.id) ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {expandedId === c.id ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{c.candidateName}</span>
                          {c.candidateEmail && (
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-xs text-slate-500"><Mail className="w-3 h-3" /> {c.candidateEmail}</span>
                              <span className="flex items-center gap-1 text-xs text-slate-500"><Phone className="w-3 h-3" /> {c.candidatePhone}</span>
                            </div>
                          )}
                          {c.isExternal && <span className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1"><Globe className="w-3 h-3" /> External Job Board</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">{c.roleName}</span>
                          <span className="text-xs text-slate-500">{c.clientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {c.isExternal ? (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">Open</span>
                        ) : (
                          <select
                            value={c.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStatusChange(c, e.target.value)}
                            className={cn(
                              "text-xs font-bold px-3 py-1 rounded-full border-none outline-none cursor-pointer",
                              getStatusColor(c.status)
                            )}
                          >
                            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-xs font-medium px-2 py-1 rounded",
                          c.isExternal ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                        )}>
                          {c.isExternal ? "External" : "Internal"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {safeFormat(c.followUpDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {!c.isExternal && (
                          <button 
                            onClick={(e) => handleDeleteCandidate(e, c.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600"
                            title="Delete Candidate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </motion.tr>,
                    
                    /* Expanded Details */
                    <AnimatePresence key={`${c.id}-expanded-presence`}>
                      {expandedId === c.id && (
                        <motion.tr
                          key={`${c.id}-expanded-row`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-50/50"
                        >
                            <td colSpan={7} className="px-12 py-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {c.isExternal ? "Job Details" : "Candidate Profile"}
                                  </h4>
                                  {!c.isExternal ? (
                                    <>
                                      <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <Award className="w-4 h-4 text-blue-500" />
                                        <span className="font-medium">Skills:</span> {c.skill}
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <Briefcase className="w-4 h-4 text-blue-500" />
                                        <span className="font-medium">Experience:</span> {c.experience}
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span className="font-medium">Notice Period:</span> {c.noticePeriod}
                                      </div>
                                      {c.resumeUrl && (
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                          <Globe className="w-4 h-4 text-blue-500" />
                                          <span className="font-medium">Resume:</span> 
                                          <a href={c.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            View Resume
                                          </a>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="text-sm text-slate-700">
                                      <p className="font-medium">Location:</p>
                                      <p className="text-slate-600">{c.remarks}</p>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Position Details</h4>
                                  <div className="text-sm text-slate-700">
                                    <span className="font-medium">Position ID / Name:</span> {c.clientName}
                                  </div>
                                  <div className="text-sm text-slate-700">
                                    <span className="font-medium">Source:</span> {c.source}
                                  </div>
                                  <div className="text-sm text-slate-700">
                                    <span className="font-medium">Recruiter:</span> {c.recruiterName}
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes & Remarks</h4>
                                  <div className="flex gap-2 text-sm text-slate-700">
                                    <MessageSquare className="w-4 h-4 text-blue-500 shrink-0 mt-1" />
                                    <div>
                                      <p className="font-medium">Remarks:</p>
                                      <p className="text-slate-600 italic">"{c.remarks || "No remarks"}"</p>
                                    </div>
                                  </div>
                                  {!c.isExternal && (
                                    <div className="text-sm text-slate-700 mt-2">
                                      <p className="font-medium">Comments:</p>
                                      <p className="text-slate-600">{c.comments || "No comments"}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    ]
                  )}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "Submitted": return "bg-blue-100 text-blue-700";
    case "Screening": return "bg-indigo-100 text-indigo-700";
    case "Interview Round 1":
    case "Interview Round 2": return "bg-purple-100 text-purple-700";
    case "Client Round": return "bg-amber-100 text-amber-700";
    case "Offered": return "bg-emerald-100 text-emerald-700";
    case "Joined": return "bg-green-600 text-white";
    case "Rejected": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-slate-700";
  }
}
