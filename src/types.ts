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
  // Extended fields
  education?: string;
  workHistory?: string;
  currentCompany?: string;
  currentLocation?: string;
  totalExperience?: string;
  resumeText?: string;
  matchScore?: number;
  screenerReport?: string;
  screenerDecision?: "Strong Hire" | "Shortlist" | "Reject";
  clientFeedback?: string;
  internalFeedback?: string;
  rejectionReason?: string;
  hiringNotes?: string;
  interviewStage?: string;

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

export type PaymentTerms = "Net 15" | "Net 30" | "Net 45" | "Advance Payment";
export type Currency = "INR" | "USD" | "EUR" | "GBP" | "AED";

export interface Client {
  id: string;
  name: string;
  paymentTerms: PaymentTerms;
  currency: Currency;
  country: string;
  countries: string[]; // Multi-select
  industries: string[];
  website?: string;
  contactPerson?: string;
  contactEmail?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Job {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  location: string;
  jobType: "Full-time" | "Contract" | "Freelance";
  description: string;
  requirements: string[];
  skills: string[];
  experienceRange: string;
  salaryRange?: string;
  status: "Open" | "Closed" | "On Hold";
  createdAt: any;
  updatedAt: any;
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
