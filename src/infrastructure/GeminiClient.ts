import type {
  AiCandidateData,
} from '../security/AiDataPolicy';

import type {
  DepartmentCriteria,
} from '../domain/Criteria';

import type {
  AiEvaluationResult,
} from '../domain/Evaluation';

export interface GeminiClient {
  evaluate(
    candidate: AiCandidateData,
    criteria: DepartmentCriteria,
  ): AiEvaluationResult;
}