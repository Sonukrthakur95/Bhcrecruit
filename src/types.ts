export type CandidateStatus = 
  | "Submitted"
  | "Screening"
  | "Interview Round 1"
  | "Interview Round 2"
  | "Client Round"
  | "Offered"
  | "Joined"
  | "Rejected";

export interface Candidate {
  id: string;
  date: string;
  clientName: string;
  skill: string;
  remarks: string;
  positionId: string;
  candidateName: string;
  candidatePhone: string;
  candidateEmail: string;
  experience: string;
  noticePeriod: string;
  status: CandidateStatus;
  comments: string;
  // Internal/System fields
  recruiterName: string;
  recruiterUid: string;
  roleName: string;
  stageUpdatedDate: string;
  source: string;
  priority: "Low" | "Medium" | "High";
  followUpDate: string;
  resumeUrl?: string;
}

export type UserRole = "admin" | "recruiter";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface DailyLead {
  id?: string;
  date: string;
  recruiterUid: string;
  recruiterName: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  roleName: string;
  clientName: string;
  source: string; // Naukri, LinkedIn, Team Lead, etc.
  remarks: string;
  createdAt: string;
}
