import Papa from 'papaparse';
import { addCandidate } from './api';
import { Candidate, CandidateStatus } from '../types';
import { format } from 'date-fns';

const statusMapping: Record<string, CandidateStatus> = {
  "Submitted": "Submitted",
  "Screening": "Screening",
  "YTS": "Screening",
  "FB pending": "Screening",
  "FB Pending": "Screening",
  "Screening Done": "Screening",
  "Screen Reject": "Rejected",
  "L1 Reject": "Rejected",
  "L1 - reject": "Rejected",
  "L1- Reject": "Rejected",
  "L1-Reject": "Rejected",
  "CV Reject": "Rejected",
  "Internal CV Reject": "Rejected",
  "Reject": "Rejected",
  "Dropped": "Rejected",
  "L2 - reject": "Rejected",
  "L1  - Reject": "Rejected",
  "Reject on NP": "Rejected",
  "Interview scheduled": "Interview Round 1",
  "Scheduled": "Interview Round 1",
  "L1": "Interview Round 1",
  "L2": "Interview Round 1",
  "L3": "Interview Round 1",
  "F2F round - reject": "Rejected",
  "Offered": "Offered",
  "Joined": "Joined",
};

function mapStatus(csvStatus: string): CandidateStatus {
  if (!csvStatus) return "Submitted";
  const normalized = csvStatus.trim();
  return statusMapping[normalized] || "Submitted";
}

function parseDate(dateStr: string): string {
  if (!dateStr) return format(new Date(), "yyyy-MM-dd");
  const parts = dateStr.split(/[-/]/);
  if (parts.length !== 3) return format(new Date(), "yyyy-MM-dd");
  
  let day = parts[0].trim().padStart(2, '0');
  let month = parts[1].trim().padStart(2, '0');
  let year = parts[2].trim();
  
  if (year.length === 2) {
    year = "20" + year;
  }
  
  return `${year}-${month}-${day}`;
}

function getVal(record: any, possibleKeys: string[]): string {
  for (const key of Object.keys(record)) {
    const normalizedKey = key.trim().toLowerCase();
    if (possibleKeys.some(pk => normalizedKey === pk.toLowerCase())) {
      return String(record[key] || "").trim();
    }
  }
  return "";
}

export async function importCsvData(csvText: string, recruiterUid: string, recruiterName: string): Promise<{ success: number; skipped: number; failed: number }> {
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let success = 0;
        let skipped = 0;
        let failed = 0;

        for (const record of results.data as any[]) {
          try {
            // Flexible header mapping
            const date = getVal(record, ["Date", "date", ""]);
            const client = getVal(record, ["Client", "client"]);
            const candidateName = getVal(record, ["Candidate Name", "candidateName", "Candidate Name "]);
            const skill = getVal(record, ["Skill", "skill"]);
            const positionId = getVal(record, ["Position ID", "positionId"]);
            const contact = getVal(record, ["Contact", "contact", "Phone"]);
            const email = getVal(record, ["Email id", "Email", "email id"]);
            const exp = getVal(record, ["Exp", "experience"]);
            const noticePeriod = getVal(record, ["Notice period", "notice period"]);
            const status = getVal(record, ["Status", "status"]);
            const comments = getVal(record, ["Comments", "comments", "Remarks"]);

            // Skip rows that are clearly not candidate entries
            if (!candidateName || ["Saturday", "Sunday", "Holiday", "Leave", "No Submission"].some(s => client.includes(s) || candidateName.includes(s) || skill.includes(s))) {
              skipped++;
              continue;
            }

            const candidate: Omit<Candidate, "id"> = {
              date: parseDate(date),
              clientName: client || "N/A",
              skill: skill || "N/A",
              positionId: positionId || "N/A",
              candidateName: candidateName,
              candidatePhone: contact || "N/A",
              candidateEmail: email || "N/A",
              experience: exp || "N/A",
              noticePeriod: noticePeriod || "N/A",
              status: mapStatus(status),
              remarks: comments || "",
              comments: comments || "",
              recruiterName: recruiterName,
              recruiterUid: recruiterUid,
              roleName: skill || "N/A",
              stageUpdatedDate: format(new Date(), "yyyy-MM-dd"),
              source: "Imported",
              priority: "Medium",
              followUpDate: parseDate(date),
            };

            await addCandidate(candidate);
            success++;
          } catch (e) {
            console.error("Failed to import record:", record, e);
            failed++;
          }
        }

        resolve({ success, skipped, failed });
      },
      error: (err) => {
        console.error("PapaParse error:", err);
        resolve({ success: 0, skipped: 0, failed: 1 });
      }
    });
  });
}
