import type {
  ImportResult,
} from '../domain/ImportResult';

import type {
  ResumeSource,
} from '../domain/Resume';

import type {
  ImportLogRepository,
  ResumeCandidateRepository,
  ResumeExtractionClient,
  ResumeSourceRepository,
} from '../infrastructure/ResumeRepositories';

export interface ResumeImportLimits {
  maxFilesPerRun: number;
  maxResumeTextLength: number;
  maxTotalTextLengthPerRun: number;
}

export class ResumeImportService {
  constructor(
    private readonly sources:
      ResumeSourceRepository,

    private readonly candidates:
      ResumeCandidateRepository,

    private readonly extractor:
      ResumeExtractionClient,

    private readonly logs:
      ImportLogRepository,

    private readonly limits:
      ResumeImportLimits,
  ) {}

  execute(): ImportResult[] {
    const files =
      this.sources.findPending(
        this.limits.maxFilesPerRun,
      );

    const results:
      ImportResult[] = [];

    let totalTextLength = 0;

    for (const source of files) {
      try {
        const textLength =
          this.getSourceLength(
            source,
          );

        if (
          textLength >
          this.limits.maxResumeTextLength
        ) {
          throw new Error(
            `抽出テキストが上限${this.limits.maxResumeTextLength}文字を超えています。`,
          );
        }

        if (
          totalTextLength +
            textLength >
          this.limits.maxTotalTextLengthPerRun
        ) {
          throw new Error(
            `1回の実行でAIへ送信できる総文字数${this.limits.maxTotalTextLengthPerRun}文字を超えます。`,
          );
        }

        totalTextLength +=
          textLength;

        const candidate =
          this.extractor.extract(
            source,
          );

        if (
          this.candidates.isDuplicate(
            candidate,
          )
        ) {
          this.candidates.save(
            candidate,
            '重複',
            '既存候補者と氏名・連絡先が一致',
          );

          this.sources
            .moveToDuplicate(
              source.fileId,
            );

          this.logs.access(
            '履歴書取込',
            `重複候補者: ${source.fileName}`,
          );

          results.push({
            fileId:
              source.fileId,

            fileName:
              source.fileName,

            status:
              'duplicate',
          });

          continue;
        }

        this.candidates.save(
          candidate,
          '成功',
          '',
        );

        this.sources
          .moveToProcessed(
            source.fileId,
          );

        this.logs.access(
          '履歴書取込',
          `処理成功: ${source.fileName}`,
        );

        results.push({
          fileId:
            source.fileId,

          fileName:
            source.fileName,

          status:
            'processed',
        });
      } catch (
        error: unknown
      ) {
        const message =
          error instanceof Error
            ? error.message
            : String(error);

        try {
          this.candidates
            .saveError(
              source,
              message,
            );
        } catch (
          saveError: unknown
        ) {
          console.error(
            'エラー行の保存に失敗しました。',
            saveError,
          );
        }

        this.logs.error(
          source.fileName,
          message,
        );

        try {
          this.sources
            .moveToError(
              source.fileId,
            );
        } catch (
          moveError: unknown
        ) {
          console.error(
            'エラーフォルダへの移動に失敗しました。',
            moveError,
          );
        }

        results.push({
          fileId:
            source.fileId,

          fileName:
            source.fileName,

          status:
            'error',

          message,
        });
      }
    }

    try {
      this.candidates
        .rebuildApplicantList();
    } catch (
      error: unknown
    ) {
      console.error(
        '応募者一覧の更新に失敗しました。',
        error,
      );
    }

    return results;
  }

  private getSourceLength(
    source: ResumeSource,
  ): number {
    if (source.text) {
      return source.text.length;
    }

    if (source.base64) {
      return source.base64.length;
    }

    return 0;
  }
}