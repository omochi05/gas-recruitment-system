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

  findPending(
    limit: number,
  ): ResumeSource[] {
    const inboxFolder =
      DriveApp.getFolderById(
        this.inboxFolderId,
      );

    const files =
      inboxFolder.getFiles();

    const results:
      ResumeSource[] = [];

    while (
      files.hasNext() &&
      results.length < limit
    ) {
      const file =
        files.next();

      results.push(
        this.toResumeSource(
          file,
        ),
      );
    }

    return results;
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
    const fileSize =
      file.getSize();

    if (
      fileSize >
      ResumeConfig
        .limits
        .maxFileSizeBytes
    ) {
      throw new Error(
        `ファイルサイズが上限10MBを超えています: ${file.getName()}`,
      );
    }

    const mimeType =
      file.getMimeType();

    if (
      mimeType ===
      'text/plain'
    ) {
      const text =
        file
          .getBlob()
          .getDataAsString(
            'UTF-8',
          );

      return {
        fileId:
          file.getId(),

        fileName:
          file.getName(),

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

      return {
        fileId:
          file.getId(),

        fileName:
          file.getName(),

        mimeType,

        size:
          fileSize,

        text,
      };
    }

    throw new Error(
      `未対応のファイル形式です（対応形式: テキストファイル / PDF）: ${mimeType}`,
    );
  }

  private extractTextFromPdf(
    file:
      GoogleAppsScript.Drive.File,
  ): string {
    const blob =
      file.getBlob();

    const resource = {
      name:
        `temp_convert_${file.getName()}`,

      mimeType:
        'application/vnd.google-apps.document',
    };

    const advancedDrive =
      Drive!;

    if (
      !advancedDrive.Files
    ) {
      throw new Error(
        'Advanced Drive Serviceが有効になっていません。',
      );
    }

    const converted =
      advancedDrive.Files.create(
        resource,
        blob,
        {
          ocr: true,
          ocrLanguage:
            'ja',
        },
      );

    if (!converted.id) {
      throw new Error(
        `PDFのOCR変換に失敗しました: ${file.getName()}`,
      );
    }

    try {
      const document =
        DocumentApp.openById(
          converted.id,
        );

      return document
        .getBody()
        .getText();
    } finally {
      try {
        DriveApp
          .getFileById(
            converted.id,
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
  }

  private moveFile(
    fileId: string,
    destinationFolderId: string,
  ): void {
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