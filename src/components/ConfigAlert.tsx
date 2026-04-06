import React, { useEffect, useState } from "react";
import { checkConfig } from "../lib/api";
import { AlertCircle, ExternalLink, Key, FileSpreadsheet, Mail } from "lucide-react";

export function ConfigAlert() {
  const [config, setConfig] = useState<{
    googleSheetId: boolean;
    googleServiceAccountEmail: boolean;
    googlePrivateKey: boolean;
  } | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const status = await checkConfig();
        setConfig(status);
      } catch (error) {
        console.error("Failed to check config:", error);
      }
    };
    check();
  }, []);

  if (!config) return null;

  const isConfigured = config.googleSheetId && config.googleServiceAccountEmail && config.googlePrivateKey;

  if (isConfigured) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-xl mb-8 animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-600 shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-900 mb-1">Google Sheets Integration Required</h3>
          <p className="text-amber-800 text-sm mb-4">
            To start using the ATS, you must configure the following Google Sheets API credentials in the 
            <span className="font-bold"> Secrets</span> panel (Settings → Secrets).
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <ConfigItem 
              label="GOOGLE_SHEET_ID" 
              isSet={config.googleSheetId} 
              icon={<FileSpreadsheet className="w-4 h-4" />} 
            />
            <ConfigItem 
              label="GOOGLE_SERVICE_ACCOUNT_EMAIL" 
              isSet={config.googleServiceAccountEmail} 
              icon={<Mail className="w-4 h-4" />} 
            />
            <ConfigItem 
              label="GOOGLE_PRIVATE_KEY" 
              isSet={config.googlePrivateKey} 
              icon={<Key className="w-4 h-4" />} 
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors uppercase tracking-wider"
            >
              <ExternalLink className="w-3 h-3" /> Get Service Account Credentials
            </a>
            <a 
              href="https://docs.google.com/spreadsheets/u/0/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors uppercase tracking-wider"
            >
              <ExternalLink className="w-3 h-3" /> Create Google Sheet
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigItem({ label, isSet, icon }: { label: string; isSet: boolean; icon: React.ReactNode }) {
  return (
    <div className={`p-3 rounded-lg border flex items-center gap-3 ${isSet ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-white border-amber-200 text-slate-500"}`}>
      <div className={`p-1.5 rounded ${isSet ? "bg-emerald-100" : "bg-slate-100"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-tight opacity-60">{label}</p>
        <p className="text-xs font-semibold truncate">{isSet ? "Configured" : "Missing"}</p>
      </div>
      {isSet && (
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      )}
    </div>
  );
}
