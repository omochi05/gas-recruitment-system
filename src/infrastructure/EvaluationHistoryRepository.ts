import type { EvaluationResult } from '../domain/Evaluation';

export interface EvaluationHistoryRepository {
    save(result: EvaluationResult): string;

    findLatest(
        candidateKey: string,
        departmentId: string,
    ): EvaluationResult | null;
}