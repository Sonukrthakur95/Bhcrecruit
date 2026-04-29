import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ParsedResume {
  fullName: string;
  email: string;
  phone: string;
  skills: string[];
  totalExperience: string;
  education: string;
  workHistory: string;
  currentCompany: string;
  currentLocation: string;
  confidenceScore: number;
}

export interface AlignmentReport {
  matchScore: number;
  skillsMatch: string;
  experienceAlignment: string;
  decision: "Strong Hire" | "Shortlist" | "Reject";
  reasoning: string;
  interviewQuestions: string[];
}

export async function analyzeAlignment(resumeText: string, jobDescription: string): Promise<AlignmentReport> {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as an Elite Talent Screener. Analyze the following resume against the job description.
    
    JOB DESCRIPTION:
    ${jobDescription}
    
    RESUME TEXT:
    ${resumeText}
    
    Provide a structured technical alignment report in JSON format.
    Fields:
    1. matchScore: 0-100 score based strictly on technical alignment.
    2. skillsMatch: Detailed assessment of how well their skills match the required tech stack.
    3. experienceAlignment: Analysis of their career trajectory vs the role seniority.
    4. decision: Strictly one of: "Strong Hire", "Shortlist", "Reject".
    5. reasoning: High-level summary of the decision.
    6. interviewQuestions: Array of 3-5 high-gravity technical questions to ask this specific candidate.
    
    Return ONLY valid JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          matchScore: { type: "number" },
          skillsMatch: { type: "string" },
          experienceAlignment: { type: "string" },
          decision: { type: "string", enum: ["Strong Hire", "Shortlist", "Reject"] },
          reasoning: { type: "string" },
          interviewQuestions: { type: "array", items: { type: "string" } }
        },
        required: ["matchScore", "skillsMatch", "experienceAlignment", "decision", "reasoning", "interviewQuestions"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text);
}

export async function extractCandidatesFromText(text: string): Promise<ParsedResume[]> {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract ALL candidate profiles from the following content. If it's a list or multiple resumes, extract each one.
    
    TEXT CONTENT:
    ${text}
    
    Return a list of structured candidate profiles in JSON format.
    
    Return ONLY valid JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          candidates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                fullName: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                skills: { type: "array", items: { type: "string" } },
                totalExperience: { type: "string" },
                education: { type: "string" },
                workHistory: { type: "string" },
                currentCompany: { type: "string" },
                currentLocation: { type: "string" },
                confidenceScore: { type: "number" }
              },
              required: ["fullName", "email", "phone", "skills", "totalExperience", "education", "workHistory", "currentCompany", "currentLocation", "confidenceScore"]
            }
          }
        },
        required: ["candidates"]
      }
    }
  });

  const response = await model;
  const data = JSON.parse(response.text);
  return data.candidates;
}

export async function extractCandidatesFromFile(base64Data: string, mimeType: string): Promise<ParsedResume[]> {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      },
      {
        text: `Extract ALL candidate profiles from this document. If it's a list or multiple resumes, extract each one.
        
        Return a list of structured candidate profiles in JSON format.
        
        Return ONLY valid JSON.`
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          candidates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                fullName: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                skills: { type: "array", items: { type: "string" } },
                totalExperience: { type: "string" },
                education: { type: "string" },
                workHistory: { type: "string" },
                currentCompany: { type: "string" },
                currentLocation: { type: "string" },
                confidenceScore: { type: "number" }
              },
              required: ["fullName", "email", "phone", "skills", "totalExperience", "education", "workHistory", "currentCompany", "currentLocation", "confidenceScore"]
            }
          }
        },
        required: ["candidates"]
      }
    }
  });

  const response = await model;
  const data = JSON.parse(response.text);
  return data.candidates;
}

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Parse the following resume text and extract key information in structured JSON format.
    
    RESUME TEXT:
    ${resumeText}
    
    Fields to extract:
    1. fullName: Full name of the candidate
    2. email: Email address
    3. phone: Phone number
    4. skills: Array of technical and soft skills
    5. totalExperience: Estimated total years of experience (e.g. "8 years")
    6. education: Summary of education (degree, university)
    7. workHistory: Clear summary of professional background
    8. currentCompany: Most recent or current employer
    9. currentLocation: Current city and country
    10. confidenceScore: A number from 0-100 indicating parsing accuracy based on text clarity.
    
    Return ONLY valid JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          fullName: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          skills: { type: "array", items: { type: "string" } },
          totalExperience: { type: "string" },
          education: { type: "string" },
          workHistory: { type: "string" },
          currentCompany: { type: "string" },
          currentLocation: { type: "string" },
          confidenceScore: { type: "number" }
        },
        required: ["fullName", "email", "phone", "skills", "totalExperience", "education", "workHistory", "currentCompany", "currentLocation", "confidenceScore"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text);
}
