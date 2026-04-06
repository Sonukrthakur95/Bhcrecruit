import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { 
  Search, 
  Sparkles, 
  Loader2, 
  User, 
  Briefcase, 
  Mail, 
  Phone, 
  Calendar,
  AlertCircle,
  TrendingUp,
  Award
} from "lucide-react";
import { Candidate } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface AdminAISearchProps {
  candidates: Candidate[];
}

export function AdminAISearch({ candidates }: AdminAISearchProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResult(null);

    try {
      // Prepare a summary of the data for the AI
      // We don't want to send the entire object if it's too large, but for a typical ATS it should be fine.
      // We'll focus on the most relevant fields.
      const dataSummary = candidates.map(c => ({
        name: c.candidateName,
        email: c.candidateEmail,
        recruiter: c.recruiterName,
        role: c.roleName,
        client: c.clientName,
        status: c.status,
        priority: c.priority,
        date: c.date,
        remarks: c.remarks
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an AI Assistant for an ATS (Applicant Tracking System). 
The Admin is asking a question about a recruiter or a candidate. 
Use the following data to answer the question accurately and concisely.

Data:
${JSON.stringify(dataSummary, null, 2)}

Question:
${query}

Instructions:
- If the question is about a candidate, provide their key details (role, status, recruiter).
- If the question is about a recruiter, summarize their performance (total candidates, placements, etc.).
- If the person is not found, state it clearly.
- Keep the tone professional and helpful.`,
      });

      setResult(response.text || "No information found.");
    } catch (error) {
      console.error("AI Search Error:", error);
      setResult("Sorry, I encountered an error while searching. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-[#002B5B]" />
        <h2 className="font-semibold text-slate-800">AI Intelligence Search</h2>
      </div>
      
      <p className="text-sm text-slate-500">
        Ask anything about a recruiter or candidate (e.g., "Tell me about John Doe" or "How is recruiter Sarah performing?")
      </p>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search name or ask a question..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#002B5B] focus:border-transparent outline-none transition-all text-sm"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#002B5B] text-white rounded-lg text-xs font-bold hover:bg-[#001a38] disabled:opacity-50 transition-all"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ask AI"}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-blue-50 rounded text-[#002B5B]">
                <Sparkles className="w-3 h-3" />
              </div>
              <div>{result}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Insights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction label="Top Recruiter" onClick={() => { setQuery("Who is the top performing recruiter?"); handleSearch(); }} />
        <QuickAction label="Stuck Candidates" onClick={() => { setQuery("Which candidates are stuck in screening?"); handleSearch(); }} />
        <QuickAction label="Recent Joinees" onClick={() => { setQuery("Who joined recently?"); handleSearch(); }} />
        <QuickAction label="High Priority" onClick={() => { setQuery("List all high priority candidates."); handleSearch(); }} />
      </div>
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:bg-white hover:border-blue-200 hover:text-[#002B5B] transition-all text-center"
    >
      {label}
    </button>
  );
}
