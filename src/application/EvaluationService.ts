import type {
  EvaluationResult,
} from '../domain/Evaluation';

import type {
  CandidateRepository,
} from '../infrastructure/CandidateRepository';

import type {
  CriteriaRepository,
} from '../infrastructure/CriteriaRepository';

import type {
  EvaluationHistoryRepository,
} from '../infrastructure/EvaluationHistoryRepository';

import type {
  GeminiClient,
} from '../infrastructure/GeminiClient';

import {
  AuthorizationService,
} from '../security/AuthorizationService';

import {
  AiDataPolicy,
} from '../security/AiDataPolicy';

export class EvaluationService {
  constructor(
    private readonly authorization:
      AuthorizationService,

    private readonly candidates:
      CandidateRepository,

    private readonly criteria:
      CriteriaRepository,

    private readonly aiDataPolicy:
      AiDataPolicy,

    private readonly gemini:
      GeminiClient,

    private readonly history:
      EvaluationHistoryRepository,
  ) {}

  evaluate(
    candidateKey: string,
    departmentId: string,
  ): EvaluationResult {
    this.authorization.requireEvaluator();
    
    const candidate =
      this.candidates.findByKey(
        candidateKey,
      );
    
    const departmentCriteria =
      this.criteria.findByDepartment(
        departmentId,
      );
    
    const safeCandidate =
      this.aiDataPolicy.createSafeCandidate(
        candidate,
      );
    this.aiDataPolicy.validate(
      safeCandidate,
    );
    
    const aiResult =
      this.gemini.evaluate(
        safeCandidate,
        departmentCriteria,
      );
    
    const result: EvaluationResult = {
      candidateKey,
      departmentId,

      evaluations:
        aiResult.evaluations,

      strengths:
        aiResult.strengths,

      concerns:
        aiResult.concerns,

      reviewPoints:
        aiResult.reviewPoints,
    };

    this.history.save(result);
    return result;
  }
}