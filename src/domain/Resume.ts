export interface ResumeSource {
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  text?: string;
  base64?: string;
}

export interface ResumeCandidateData {
  name: string;
  furigana: string;
  birthDate: string;
  age: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  finalEducation: string;
  educationSummary: string;
  latestCareer: string;
  careerSummary: string;
  qualifications: string;
  selfPrSummary: string;
  notes: string;
}

export interface ResumeImportRecord
  extends ResumeCandidateData {
  sourceFileId: string;
  sourceFileName: string;
  importedAt: Date;
  interviewStatus: string;
}