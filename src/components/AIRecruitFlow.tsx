import React, { useState } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Search, 
  Loader2, 
  Linkedin, 
  ExternalLink, 
  UserCircle,
  MapPin,
  Briefcase,
  Send,
  Zap,
  Copy,
  Check,
  UserPlus,
  Save,
  Github,
  Twitter,
  Facebook,
  Mail,
  Phone,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Download,
  Filter,
  X,
  Plus,
  MessageSquare
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../AuthContext";
import { addCandidate } from "../lib/api";
import { format } from "date-fns";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface CandidateResult {
  name: string;
  currentCompany: string;
  currentRole: string;
  experience: string;
  location: string;
  keySkillsMatch: string;
  whyRelevant: string;
  linkedinProfileSummary: string;
  linkedinUrl: string;
  role: string; // for internal mapping
  email?: string;
  phone?: string;
  education?: string;
  topSkills?: string[];
}

export function AIRecruitFlow() {
  const { profile } = useAuth();
  const [filters, setFilters] = useState({
    location: "Karnataka, India",
    jobTitle: "",
    skills: "",
    yearsOfExperience: "",
    excludeList: ""
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [error, setError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());

  const handleCopy = (url: string, idx: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSave = async (candidate: CandidateResult, idx: number) => {
    if (!profile) return;
    setSavingIdx(idx);
    try {
      await addCandidate({
        date: format(new Date(), "yyyy-MM-dd"),
        clientName: "Direct Sourced",
        skill: filters.skills || "AI Sourced",
        remarks: `Sourced via AI Recruit Flow. Why Relevant: ${candidate.whyRelevant}`,
        positionId: "AI-RECRUIT",
        candidateName: candidate.name,
        candidatePhone: candidate.phone || "N/A",
        candidateEmail: candidate.email || "sourced@linkedin.com",
        experience: candidate.experience || "N/A",
        noticePeriod: "N/A",
        status: "Submitted",
        comments: `Location: ${candidate.location}. LinkedIn: ${candidate.linkedinUrl}. Summary: ${candidate.linkedinProfileSummary}`,
        recruiterName: profile.displayName,
        roleName: candidate.role || candidate.currentCompany,
        stageUpdatedDate: format(new Date(), "yyyy-MM-dd"),
        source: "LinkedIn",
        priority: "Medium",
        followUpDate: "",
        recruiterUid: profile.uid
      });
      setSavedIdxs(prev => new Set(prev).add(idx));
    } catch (err) {
      console.error("Error saving candidate:", err);
    } finally {
      setSavingIdx(null);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate input: Ensure at least Job Title or Skills are provided
    if (!filters.jobTitle.trim() && !filters.skills.trim()) {
      setError("Please provide a Job Title or Must-Have Skills to begin your search.");
      return;
    }
    
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const searchContext = `
        Role Title: ${filters.jobTitle}
        Experience Range: ${filters.yearsOfExperience}
        Location: ${filters.location}
        MUST-HAVE SKILLS: ${filters.skills}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Identify candidates for the following requirements:
        ${searchContext}`,
        config: {
          systemInstruction: `Act as a senior technical recruiter with deep expertise in sourcing highly relevant candidates from LinkedIn.
          Your task is to identify candidates who closely match the job requirements with high precision.
          
          🎯 CORE DIRECTIVES:
          1. **STRICT LOCATION FILTER**: You MUST ONLY return candidates who are currently located in or around the specified location. If a candidate is not in this location, EXCLUDE them entirely.
          2. **STRICT SKILL FILTER**: Candidates MUST have direct, hands-on experience in the required skills. Do not include candidates who only list these skills without professional application.
          3. **REAL LINKEDIN URLS**: You MUST return REAL, direct LinkedIn profile URLs (format: https://www.linkedin.com/in/username). 
             - Use the 'googleSearch' tool to find actual LinkedIn profiles. 
             - DO NOT return search result pages or Google redirect URLs.
          4. **HIGH PRECISION**: Prioritize candidates whose current or recent roles directly match the required skills.
          5. **OUTPUT LIMIT**: Only return top 10 highly relevant candidates.
          6. **SEARCH STRATEGY**: When using the 'googleSearch' tool, include the specified location (e.g., "Karnataka") and specific skills in your search queries to ensure the results are geographically and technically relevant.`,
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                currentRole: { type: Type.STRING },
                currentCompany: { type: Type.STRING },
                experience: { type: Type.STRING },
                location: { type: Type.STRING },
                keySkillsMatch: { type: Type.STRING },
                whyRelevant: { type: Type.STRING },
                linkedinProfileSummary: { type: Type.STRING },
                linkedinUrl: { type: Type.STRING },
                role: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                education: { type: Type.STRING },
                topSkills: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["name", "linkedinUrl", "currentCompany", "currentRole", "experience", "location", "keySkillsMatch", "whyRelevant", "linkedinProfileSummary"]
            }
          }
        }
      });

      if (!response.text) {
        throw new Error("AI returned an empty response. Please try again with different keywords.");
      }

      const data = JSON.parse(response.text);
      const sanitizedData = data.map((item: any) => {
        let url = item.linkedinUrl;
        if (!url) return null;

        // Handle Google Search redirect URLs
        if (url.includes("google.com/url?")) {
          try {
            const urlObj = new URL(url);
            const q = urlObj.searchParams.get('q') || urlObj.searchParams.get('url');
            if (q) url = q;
          } catch (e) {
            const match = url.match(/[?&](q|url)=([^&]+)/);
            if (match) url = decodeURIComponent(match[2]);
          }
        }

        // Basic cleanup
        url = url.split("?")[0].split("#")[0].trim();
        
        // Ensure it's a LinkedIn profile URL (allow /in/, /pub/, /profile/)
        const isLinkedInProfile = url.includes("linkedin.com/in/") || 
                                  url.includes("linkedin.com/pub/") || 
                                  url.includes("linkedin.com/profile/view");
        
        if (!isLinkedInProfile) return null;

        // Ensure protocol
        if (!url.startsWith("http")) {
          url = `https://${url.replace(/^\/+/, '')}`;
        }

        // Final check to remove search result pages
        if (url.includes("/search/results/")) return null;

        return { ...item, linkedinUrl: url, role: item.currentRole || item.role };
      }).filter((item: any): item is CandidateResult => item !== null);

      if (sanitizedData.length === 0) {
        setError("No relevant profiles found. Try broadening your search terms.");
      } else {
        setResults(sanitizedData);
      }
    } catch (err) {
      console.error("AI Recruit Flow Error:", err);
      setError("Failed to fetch candidates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-slate-50 overflow-hidden rounded-3xl border border-slate-200">
      {/* Sidebar Filters */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold border-b-2 border-blue-600 pb-1">People</span>
            <span className="text-slate-400 font-medium pb-1 cursor-not-allowed">Companies</span>
          </div>
          <button 
            onClick={() => setFilters({
              location: "",
              jobTitle: "",
              skills: "",
              yearsOfExperience: "",
              excludeList: ""
            })}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Clear all
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Job Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role Title</label>
            <input 
              type="text" 
              placeholder="e.g. Senior Backend Engineer"
              value={filters.jobTitle}
              onChange={(e) => setFilters({...filters, jobTitle: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Years of Experience */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience Range</label>
            <input 
              type="text" 
              placeholder="e.g. 5-8 Years"
              value={filters.yearsOfExperience}
              onChange={(e) => setFilters({...filters, yearsOfExperience: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</label>
            <input 
              type="text" 
              placeholder="City / Remote / Region"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          {/* MUST-HAVE SKILLS */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Must-Have Skills</label>
            <textarea 
              placeholder="Skill 1, Skill 2..."
              value={filters.skills}
              onChange={(e) => setFilters({...filters, skills: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-slate-50/50 h-16 resize-none"
            />
          </div>

          {/* Search Button */}
          <button 
            onClick={() => handleSearch()}
            disabled={loading}
            className="w-full py-3 bg-[#3d29b7] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>

          <div className="flex items-center justify-between pt-2">
            <button className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Save className="w-3 h-3" /> Saved searches ⓘ
            </button>
            <button className="text-[10px] font-bold text-slate-500 border border-slate-200 px-2 py-1 rounded-md hover:bg-slate-50">
              Save search
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Results List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-slate-500 font-bold animate-pulse">Finding matching profiles...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {results.map((candidate, idx) => (
                <div key={idx} className="p-6 hover:bg-slate-50/50 transition-colors flex gap-6">
                  <div className="pt-1">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                  </div>
                  
                  {/* Profile Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        <UserCircle className="w-10 h-10 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <a 
                              href={candidate.linkedinUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-lg font-bold text-slate-900 hover:text-blue-600 flex items-center gap-2 group"
                            >
                              {candidate.name}
                              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                            </a>
                            <div className="flex items-center gap-2">
                              <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[#0077B5] hover:opacity-80">
                                <Linkedin className="w-4 h-4" />
                              </a>
                            </div>
                            <span className={cn(
                              "text-xs flex items-center gap-1 px-2 py-0.5 rounded-full font-medium",
                              filters.location && candidate.location.toLowerCase().includes(filters.location.toLowerCase().split(',')[0].trim())
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : "text-slate-400"
                            )}>
                              <MapPin className="w-3 h-3" /> {candidate.location}
                            </span>
                            <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-amber-100">
                              ⭐ Highly Relevant
                            </span>
                          </div>
                        
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Role</p>
                              <p className="text-sm font-bold text-slate-700">{candidate.currentRole || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Company</p>
                              <p className="text-sm font-bold text-slate-700">{candidate.currentCompany}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience</p>
                              <p className="text-sm font-bold text-slate-700">{candidate.experience}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Education</p>
                              <p className="text-sm font-bold text-slate-700">{candidate.education || "N/A"}</p>
                            </div>
                          </div>

                          <div className="space-y-1 pt-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Skills</p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {candidate.topSkills?.map((skill, sIdx) => (
                                <span key={sIdx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                                  {skill}
                                </span>
                              )) || <span className="text-xs text-slate-400 italic">No skills listed</span>}
                            </div>
                          </div>

                        <div className="space-y-1 pt-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Skills Match</p>
                          <p className="text-sm text-slate-600 font-medium">{candidate.keySkillsMatch}</p>
                        </div>

                        <div className="space-y-1 pt-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Why Relevant</p>
                          <p className="text-sm text-blue-700 font-bold italic">"{candidate.whyRelevant}"</p>
                        </div>

                        <div className="space-y-1 pt-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Summary</p>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{candidate.linkedinProfileSummary}</p>
                        </div>
                        
                        <button className="text-xs font-bold text-blue-600 hover:underline pt-1">...more</button>
                      </div>
                    </div>
                  </div>

                  {/* Actions Right Side */}
                  <div className="w-72 space-y-4 shrink-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail className="w-4 h-4" />
                          <span>{candidate.email || "***@gmail.com"}</span>
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <button className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100">View email</button>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Phone className="w-4 h-4" />
                          <span>{candidate.phone || "*-***-***-****"}</span>
                        </div>
                        <button className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100">Find phone</button>
                      </div>
                    </div>

                    <button className="w-full py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      AI write personalized message
                    </button>

                    <button 
                      onClick={() => handleSave(candidate, idx)}
                      disabled={savingIdx === idx || savedIdxs.has(idx)}
                      className={cn(
                        "w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all",
                        savedIdxs.has(idx)
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      )}
                    >
                      {savingIdx === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : savedIdxs.has(idx) ? <Check className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                      {savedIdxs.has(idx) ? "Saved to ATS" : "Save to ATS"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              <Search className="w-16 h-16 text-slate-200" />
              <p className="text-red-500 font-medium">{error}</p>
              <button onClick={() => handleSearch()} className="text-blue-600 font-bold hover:underline">Try again</button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              <Search className="w-16 h-16 text-slate-200" />
              <h3 className="text-lg font-bold text-slate-900">Start your search</h3>
              <p className="text-slate-500 max-w-xs">Use the filters on the left or the search bar above to find top talent.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
