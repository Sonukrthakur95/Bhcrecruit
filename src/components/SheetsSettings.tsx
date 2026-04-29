import React, { useEffect, useState } from "react";
import { checkConfig, subscribeToCandidates } from "../lib/api";
import { 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Key, 
  Mail, 
  Database,
  RefreshCw,
  AlertTriangle,
  Info,
  ArrowRightLeft
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { Candidate } from "../types";

export function SheetsSettings() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeToCandidates(setAllCandidates);
    return () => unsub();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await checkConfig();
      setConfig(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleInitHeaders = async () => {
    setInitializing(true);
    try {
      const res = await fetch("/api/sheets/init", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setInitializing(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleBulkSync = async () => {
    if (allCandidates.length === 0) {
      setMessage({ type: 'error', text: "No candidates found to sync." });
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch("/api/sheets/sync-all", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: allCandidates })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const isConfigured = config && config.googleSheetId && config.googleServiceAccountEmail && config.googlePrivateKey;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#002B5B] tracking-tight">Database Integration</h1>
          <p className="text-slate-500 font-medium">Connect and manage your Google Sheet database sync</p>
        </div>
        <button 
          onClick={fetchConfig}
          className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-blue-600"
        >
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Google Sheets Connection</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {isConfigured ? (
                      <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                        <CheckCircle className="w-3 h-3" /> Live & Synced
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest">
                        <AlertTriangle className="w-3 h-3" /> Setup Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isConfigured && config.googleSheetId && (
                <a 
                  href={`https://docs.google.com/spreadsheets/d/${config.googleSheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline"
                >
                  View Spreadsheet <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connection Detail</h4>
                  <div className="space-y-3">
                    <StatusItem 
                      label="Spreadsheet ID" 
                      configured={config?.googleSheetId} 
                      icon={Database}
                    />
                    <StatusItem 
                      label="Service Account Email" 
                      configured={config?.googleServiceAccountEmail} 
                      icon={Mail}
                    />
                    <StatusItem 
                      label="Private Key (RSA)" 
                      configured={config?.googlePrivateKey} 
                      icon={Key}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" /> Synchronization Logic
                  </h4>
                  <ul className="space-y-3">
                    <li className="text-xs text-slate-600 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      Bi-directional sync: Firestore as primary, Google Sheets as secondary real-time report.
                    </li>
                    <li className="text-xs text-slate-600 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      All candidate entries, status updates, and deletions from the app are pushed to your Sheet.
                    </li>
                    <li className="text-xs text-slate-600 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      Sheet columns are mapped to candidate profile fields automatically.
                    </li>
                  </ul>
                </div>
              </div>

              {isConfigured && (
                <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-end gap-4">
                  <div className="flex-1 text-sm text-slate-500 font-medium">
                    Sheet management & data synchronization:
                  </div>
                  <button 
                    onClick={handleInitHeaders}
                    disabled={initializing || syncing}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {initializing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Reset Headers
                  </button>
                  <button 
                    onClick={handleBulkSync}
                    disabled={initializing || syncing}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
                  >
                    {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                    Bulk Sync Firestore → Sheets ({allCandidates.length})
                  </button>
                </div>
              )}

              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-xl text-sm font-medium border animate-in slide-in-from-bottom-2",
                    message.type === 'success' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                  )}
                >
                  {message.text}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Setup Guide</h3>
            <div className="space-y-6">
              <Step 
                num="1" 
                title="Google Cloud Console" 
                text="Enable Google Sheets API and create a Service Account." 
              />
              <Step 
                num="2" 
                title="Credentials Cache" 
                text="Download JSON Key. Copy Client Email and Private Key." 
              />
              <Step 
                num="3" 
                title="Share Sheet" 
                text="Share your target Google Sheet with the Service Account email (Editor access)." 
              />
              <Step 
                num="4" 
                title="Set Platform Secrets" 
                text="Enter GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in Settings > Secrets." 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, configured, icon: Icon }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-slate-50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold text-slate-700">{label}</span>
      </div>
      {configured ? (
        <CheckCircle className="w-4 h-4 text-emerald-500" />
      ) : (
        <XCircle className="w-4 h-4 text-slate-200" />
      )}
    </div>
  );
}

function Step({ num, title, text }: any) {
  return (
    <div className="flex gap-4">
      <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black shrink-0">
        {num}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
