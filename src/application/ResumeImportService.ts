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
    const fileIds =
      this.sources
        .findPendingFileIds(
          this.limits
            .maxFilesPerRun,
        );

    const results:
      ImportResult[] = [];

    let totalTextLength = 0;

    for (
      const fileId
      of fileIds
    ) {
      let source:
        ResumeSource |
        null = null;

      let fileName =
        fileId;

      try {
        /*
         * ここで初めてTXT読込・PDF OCRを行う。
         *
         * そのため1ファイルが壊れていても
         * バッチ全体には影響しない。
         */
        source =
          this.sources
            .getSource(
              fileId,
            );

        fileName =
          source.fileName;

        const textLength =
          this.getSourceLength(
            source,
          );

        if (
          textLength >
          this.limits
            .maxResumeTextLength
        ) {
          throw new Error(
            `抽出テキストが上限${this.limits.maxResumeTextLength}文字を超えています。`,
          );
        }

        if (
          totalTextLength +
            textLength >
          this.limits
            .maxTotalTextLengthPerRun
        ) {
          throw new Error(
            `1回の実行でAIへ送信できる総文字数${this.limits.maxTotalTextLengthPerRun}文字を超えます。`,
          );
        }

        const candidate =
          this.extractor.extract(
            source,
          );

        totalTextLength +=
          textLength;

        if (
          this.candidates
            .isDuplicate(
              candidate,
            )
        ) {
          this.sources
            .moveToDuplicate(
              fileId,
            );

          this.logs.access(
            '履歴書取込',
            `重複候補者: ${source.fileName}`,
          );

          results.push({
            fileId,

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
            fileId,
          );

        this.logs.access(
          '履歴書取込',
          `処理成功: ${source.fileName}`,
        );

        results.push({
          fileId,

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
            : String(
                error,
              );

        console.error(
          [
            '[ResumeImportService]',
            `fileId=${fileId}`,
            `fileName=${fileName}`,
            message,
          ].join(
            ' / ',
          ),
        );

        /*
         * ResumeSource生成後のエラーであれば
         * Repositoryへ情報を渡す。
         *
         * getSource()自体が失敗した場合は
         * ResumeSourceが存在しないので
         * saveError()は呼ばない。
         */
        if (
          source
        ) {
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
              'エラー情報の記録に失敗しました。',
              saveError,
            );
          }
        }

        try {
          this.logs.error(
            fileName,
            message,
          );
        } catch (
          logError: unknown
        ) {
          console.error(
            'エラーログの記録に失敗しました。',
            logError,
          );
        }

        try {
          this.sources
            .moveToError(
              fileId,
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
          fileId,

          fileName,

          status:
            'error',

          message,
        });

        /*
         * 重要:
         * このファイルだけ失敗させ、
         * 次の履歴書へ進む。
         */
        continue;
      }
    }

    if (
      results.length > 0
    ) {
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
    }

    return results;
  }

  private getSourceLength(
    source: ResumeSource,
  ): number {
    if (
      source.text
    ) {
      return source.text.length;
    }

    if (
      source.base64
    ) {
      return source.base64.length;
    }

    return 0;
  }
}