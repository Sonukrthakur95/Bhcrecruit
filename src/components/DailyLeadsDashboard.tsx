import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { DailyLead } from "../types";
import { useAuth } from "../AuthContext";
import { 
  TrendingUp, 
  Users, 
  BarChart3, 
  Calendar, 
  Search, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Globe,
  User,
  Pencil,
  X as CloseIcon,
  Save,
  Trash2,
  ClipboardList
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { format } from "date-fns";
import { cn } from "../lib/utils";

export function DailyLeadsDashboard() {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<DailyLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedRecruiter, setSelectedRecruiter] = useState("All");
  const [editingLead, setEditingLead] = useState<DailyLead | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // All authenticated users can now see all leads
    const q = query(collection(db, "dailyLeads"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyLead));
      setLeads(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leads:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#002B5B]" />
      </div>
    );
  }

  // Get unique recruiters for filter
  const recruiters = ["All", ...Array.from(new Set(leads.map(l => l.recruiterName)))];

  const isAdmin = profile?.role === "admin";

  // Filtered data
  const filteredLeads = leads.filter(l => {
    const matchesDate = l.date === filterDate;
    const matchesRecruiter = selectedRecruiter === "All" || l.recruiterName === selectedRecruiter;
    return matchesDate && matchesRecruiter;
  });

  const selectableLeads = filteredLeads.filter(l => isAdmin || l.recruiterUid === profile?.uid);
  
  // Aggregate data for chart (by recruiter for the selected date)
  const chartLeads = leads.filter(l => l.date === filterDate);
  const recruiterStats = chartLeads.reduce((acc: any, lead) => {
    if (!acc[lead.recruiterName]) {
      acc[lead.recruiterName] = { name: lead.recruiterName, count: 0 };
    }
    acc[lead.recruiterName].count += 1;
    return acc;
  }, {});

  const chartData = Object.values(recruiterStats);

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead || !editingLead.id) return;

    try {
      const leadRef = doc(db, "dailyLeads", editingLead.id);
      await updateDoc(leadRef, {
        candidateName: editingLead.candidateName,
        candidateEmail: editingLead.candidateEmail,
        candidatePhone: editingLead.candidatePhone,
        roleName: editingLead.roleName,
        clientName: editingLead.clientName,
        source: editingLead.source,
        remarks: editingLead.remarks || ""
      });
      setEditingLead(null);
    } catch (error) {
      console.error("Error updating lead:", error);
      alert("Failed to update lead.");
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this lead report?")) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "dailyLeads", id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error("Error deleting lead:", error);
      alert("Failed to delete lead.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: string, leadRecruiterUid: string) => {
    if (!isAdmin && leadRecruiterUid !== profile?.uid) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === selectableLeads.length && selectableLeads.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableLeads.map(l => l.id!)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} selected leads?`)) return;
    setDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map((id: string) => deleteDoc(doc(db, "dailyLeads", id))));
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Bulk delete leads error:", error);
      alert("Failed to delete some leads.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Reports</h1>
          <p className="text-slate-500">Detailed logs of every lead submitted by recruiters.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border-none focus:ring-0 outline-none text-sm font-semibold text-slate-700"
            />
          </div>

          {(isAdmin || true) && (
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
              <Filter className="w-4 h-4 text-slate-400 ml-2" />
              <select
                value={selectedRecruiter}
                onChange={(e) => setSelectedRecruiter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border-none focus:ring-0 outline-none text-sm font-semibold text-slate-700 bg-transparent"
              >
                {recruiters.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all font-bold text-sm shadow-sm"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#002B5B]">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Leads Today</p>
            <p className="text-2xl font-black text-slate-900">{chartLeads.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Recruiters</p>
            <p className="text-2xl font-black text-slate-900">{chartData.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Source</p>
            <p className="text-xl font-black text-slate-900 truncate max-w-[150px]">
              {chartLeads.length > 0 
                ? Object.entries(chartLeads.reduce((acc: any, l) => { acc[l.source] = (acc[l.source] || 0) + 1; return acc; }, {}))
                    .sort((a: any, b: any) => b[1] - a[1])[0][0]
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#002B5B]" />
            Leads per Recruiter
          </h2>
          
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" name="Leads" fill="#002B5B" radius={[0, 4, 4, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm">
                No data for this date.
              </div>
            )}
          </div>
        </div>

        {/* Detailed List */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#002B5B]" />
                Detailed Lead Report
              </h2>
              {selectableLeads.length > 0 && (
                <button 
                  onClick={toggleSelectAll}
                  className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
                >
                  {selectedIds.size === selectableLeads.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-500 rounded-full">
              {filteredLeads.length} Leads Found
            </span>
          </div>

          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <div 
                key={lead.id} 
                className={cn(
                  "p-6 rounded-2xl border transition-all group relative",
                  selectedIds.has(lead.id!) 
                    ? "border-blue-200 bg-blue-50/50 shadow-md" 
                    : "border-slate-50 bg-slate-50/30 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50"
                )}
                onClick={() => toggleSelect(lead.id!, lead.recruiterUid)}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-blue-600 font-bold">
                        {lead.candidateName[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{lead.candidateName}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.candidateEmail}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.candidatePhone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</p>
                        <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400" /> {lead.roleName}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client</p>
                        <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" /> {lead.clientName}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source</p>
                        <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" /> {lead.source}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recruiter</p>
                        <p className="text-xs font-bold text-blue-600">{lead.recruiterName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {lead.remarks && (
                      <div className="md:max-w-[200px] p-3 rounded-xl bg-white border border-slate-100 text-[11px] text-slate-500 italic">
                        "{lead.remarks}"
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(isAdmin || lead.recruiterUid === profile?.uid) && (
                        <>
                          <button 
                            onClick={() => setEditingLead(lead)}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteLead(lead.id!)}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredLeads.length === 0 && (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Search className="w-8 h-8" />
                </div>
                <p className="text-slate-400 italic text-sm">No lead reports found for the selected criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Edit Lead Report</h3>
              <button onClick={() => setEditingLead(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <CloseIcon className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateLead} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Candidate Name</label>
                  <input
                    value={editingLead.candidateName}
                    onChange={(e) => setEditingLead({...editingLead, candidateName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                  <input
                    type="email"
                    value={editingLead.candidateEmail}
                    onChange={(e) => setEditingLead({...editingLead, candidateEmail: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                  <input
                    value={editingLead.candidatePhone}
                    onChange={(e) => setEditingLead({...editingLead, candidatePhone: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Source</label>
                  <select
                    value={editingLead.source}
                    onChange={(e) => setEditingLead({...editingLead, source: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {["Naukri", "LinkedIn", "Team Lead", "Indeed", "Monster", "Other"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                  <input
                    value={editingLead.roleName}
                    onChange={(e) => setEditingLead({...editingLead, roleName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Client</label>
                  <input
                    value={editingLead.clientName}
                    onChange={(e) => setEditingLead({...editingLead, clientName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Remarks</label>
                <textarea
                  value={editingLead.remarks}
                  onChange={(e) => setEditingLead({...editingLead, remarks: e.target.value})}
                  className="w-full h-24 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
