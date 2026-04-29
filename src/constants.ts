import { CandidateStatus } from "./types";

export const STATUS_OPTIONS: CandidateStatus[] = [
  "Submitted",
  "Screening",
  "Interview Round 1",
  "Interview Round 2",
  "Client Round",
  "Offered",
  "Joined",
  "Rejected",
];

export const PRIORITY_OPTIONS = ["Low", "Medium", "High"] as const;

export const ADMIN_EMAILS = ["sonu@bullhornconsultants.com", "sonukrthakur93@gmail.com"]; // Authorized BHC admin emails
