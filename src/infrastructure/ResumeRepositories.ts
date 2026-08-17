import type {
  ResumeImportRecord,
  ResumeSource,
} from '../domain/Resume';

export interface ResumeSourceRepository {
  findPending(
    limit: number,
  ): ResumeSource[];

  moveToProcessed(
    fileId: string,
  ): void;

  moveToDuplicate(
    fileId: string,
  ): void;

  moveToError(
    fileId: string,
  ): void;
}

export interface ResumeCandidateRepository {
  save(
    candidate: ResumeImportRecord,
    processStatus: string,
    processMessage: string,
  ): void;

  saveError(
    source: ResumeSource,
    message: string,
  ): void;

  isDuplicate(
    candidate: ResumeImportRecord,
  ): boolean;

  rebuildApplicantList(): void;
}

export interface ResumeExtractionClient {
  extract(
    source: ResumeSource,
  ): ResumeImportRecord;
}

export interface ImportLogRepository {
  access(
    actionType: string,
    detail: string,
  ): void;

  error(
    fileName: string,
    message: string,
  ): void;
}