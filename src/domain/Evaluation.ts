export type EvaluationStatus =
  | 'evaluated'
  | 'hold';

export type EvaluationScore =
  | 1
  | 2
  | 3
  | 4
  | 5;

export type EvidenceLevel =
  | 1
  | 2
  | 3
  | 4
  | 5;

export interface EvaluationItem {
  criterionId: string;
  criterionName: string;
  status: EvaluationStatus;
  score?: EvaluationScore;
  evidenceLevel: EvidenceLevel;
  reason: string;
  followUpQuestion?: string;
}

export interface AiEvaluationResult {
  evaluations: EvaluationItem[];
  strengths: string[];
  concerns: string[];
  reviewPoints: string[];
}

export interface EvaluationResult
  extends AiEvaluationResult {
  candidateKey: string;
  departmentId: string;
}