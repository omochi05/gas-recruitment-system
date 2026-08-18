import type {
  ResumeSource,
} from '../domain/Resume';

import type {
  ResumeSourceRepository,
} from './ResumeRepositories';

import {
  ResumeConfig,
} from '../gas/config';

export class GasDriveResumeRepository
  implements ResumeSourceRepository
{
  constructor(
    private readonly inboxFolderId: string,
    private readonly processedFolderId: string,
    private readonly duplicateFolderId: string,
    private readonly errorFolderId: string,
  ) {}

  findPendingFileIds(
    limit: number,
  ): string[] {
    if (
      limit <= 0
    ) {
      return [];
    }

    const inboxFolder =
      DriveApp.getFolderById(
        this.inboxFolderId,
      );

    const files =
      inboxFolder.getFiles();

    const results:
      string[] = [];

    while (
      files.hasNext() &&
      results.length < limit
    ) {
      const file =
        files.next();

      results.push(
        file.getId(),
      );
    }

    return results;
  }

  getSource(
    fileId: string,
  ): ResumeSource {
    if (
      !fileId
    ) {
      throw new Error(
        '履歴書ファイルIDがありません。',
      );
    }

    const file =
      DriveApp.getFileById(
        fileId,
      );

    return this.toResumeSource(
      file,
    );
  }

  moveToProcessed(
    fileId: string,
  ): void {
    this.moveFile(
      fileId,
      this.processedFolderId,
    );
  }

  moveToDuplicate(
    fileId: string,
  ): void {
    this.moveFile(
      fileId,
      this.duplicateFolderId,
    );
  }

  moveToError(
    fileId: string,
  ): void {
    this.moveFile(
      fileId,
      this.errorFolderId,
    );
  }

  private toResumeSource(
    file:
      GoogleAppsScript.Drive.File,
  ): ResumeSource {
    const fileId =
      file.getId();

    const fileName =
      file.getName();

    const fileSize =
      file.getSize();

    const mimeType =
      file.getMimeType();

    if (
      fileSize <= 0
    ) {
      throw new Error(
        `空のファイルです: ${fileName}`,
      );
    }

    if (
      fileSize >
      ResumeConfig
        .limits
        .maxFileSizeBytes
    ) {
      throw new Error(
        `ファイルサイズが上限10MBを超えています: ${fileName}`,
      );
    }

    if (
      mimeType ===
      'text/plain'
    ) {
      const text =
        file
          .getBlob()
          .getDataAsString(
            'UTF-8',
          )
          .trim();

      if (
        !text
      ) {
        throw new Error(
          `テキストファイルの内容が空です: ${fileName}`,
        );
      }

      return {
        fileId,
        fileName,
        mimeType,
        size:
          fileSize,
        text,
      };
    }

    if (
      mimeType ===
      'application/pdf'
    ) {
      const text =
        this.extractTextFromPdf(
          file,
        );

      if (
        !text.trim()
      ) {
        throw new Error(
          `PDFからテキストを抽出できませんでした: ${fileName}`,
        );
      }

      return {
        fileId,
        fileName,
        mimeType,
        size:
          fileSize,
        text:
          text.trim(),
      };
    }

    throw new Error(
      [
        '未対応のファイル形式です。',
        '対応形式: テキストファイル / PDF',
        `ファイル: ${fileName}`,
        `MIMEタイプ: ${mimeType}`,
      ].join(
        ' ',
      ),
    );
  }

  private extractTextFromPdf(
    file:
      GoogleAppsScript.Drive.File,
  ): string {
    const fileName =
      file.getName();

    const blob =
      file.getBlob();

    const resource = {
      name:
        `temp_convert_${fileName}`,

      mimeType:
        'application/vnd.google-apps.document',
    };

    if (
      typeof Drive ===
        'undefined' ||
      !Drive.Files
    ) {
      throw new Error(
        'Advanced Drive Serviceが有効になっていません。',
      );
    }

    let convertedId = '';

    try {
      const converted =
        Drive.Files.create(
          resource,
          blob,
          {
            ocr: true,
            ocrLanguage:
              'ja',
          },
        );

      convertedId =
        String(
          converted.id ?? '',
        ).trim();

      if (
        !convertedId
      ) {
        throw new Error(
          `PDFのOCR変換に失敗しました: ${fileName}`,
        );
      }

      const text =
        this.readConvertedDocument(
          convertedId,
          fileName,
        );

      if (
        !text
      ) {
        throw new Error(
          `PDFのOCR結果が空です: ${fileName}`,
        );
      }

      return text;
    } finally {
      if (
        convertedId
      ) {
        this.deleteTemporaryFile(
          convertedId,
        );
      }
    }
  }

  private readConvertedDocument(
    documentId: string,
    fileName: string,
  ): string {
    const maxAttempts =
      3;

    let lastError:
      unknown = null;

    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt++
    ) {
      try {
        const document =
          DocumentApp.openById(
            documentId,
          );

        const text =
          document
            .getBody()
            .getText()
            .trim();

        if (
          text
        ) {
          return text;
        }

        lastError =
          new Error(
            'OCR結果が空です。',
          );
      } catch (
        error: unknown
      ) {
        lastError =
          error;
      }

      if (
        attempt <
        maxAttempts
      ) {
        Utilities.sleep(
          attempt *
          500,
        );
      }
    }

    const message =
      lastError instanceof Error
        ? lastError.message
        : String(
            lastError ??
              '詳細不明',
          );

    throw new Error(
      `PDF変換後のGoogleドキュメントを読み取れませんでした: ${fileName} / ${message}`,
    );
  }

  private deleteTemporaryFile(
    fileId: string,
  ): void {
    try {
      DriveApp
        .getFileById(
          fileId,
        )
        .setTrashed(
          true,
        );
    } catch (
      error: unknown
    ) {
      console.error(
        'PDF変換用一時ファイルの削除に失敗しました。',
        error,
      );
    }
  }

  private moveFile(
    fileId: string,
    destinationFolderId: string,
  ): void {
    if (
      !fileId
    ) {
      throw new Error(
        '移動対象のファイルIDがありません。',
      );
    }

    if (
      !destinationFolderId
    ) {
      throw new Error(
        '移動先フォルダIDがありません。',
      );
    }

    const file =
      DriveApp.getFileById(
        fileId,
      );

    const destinationFolder =
      DriveApp.getFolderById(
        destinationFolderId,
      );

    file.moveTo(
      destinationFolder,
    );
  }
}