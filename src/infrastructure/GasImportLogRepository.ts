import type {
  ImportLogRepository,
} from './ResumeRepositories';

import {
  ResumeConfig,
} from '../gas/config';

export class GasImportLogRepository
  implements ImportLogRepository
{
  constructor(
    private readonly spreadsheetId: string,
  ) {}

  access(
    actionType: string,
    detail: string,
  ): void {
    try {
      const sheet =
        this.getOrCreateAccessLogSheet();

      sheet.appendRow([
        new Date(),
        this.getCurrentUserIdentifier(),
        this.sanitize(
          actionType,
        ),
        this.sanitize(
          detail,
        ),
      ]);
    } catch (
      error: unknown
    ) {
      console.error(
        'アクセスログの記録に失敗しました。',
        error,
      );
    }
  }

  error(
    fileName: string,
    message: string,
  ): void {
    try {
      const sheet =
        this.getOrCreateErrorLogSheet();

      sheet.appendRow([
        new Date(),
        this.getCurrentUserIdentifier(),
        this.sanitize(
          fileName,
        ),
        this.sanitize(
          message,
        ),
        ResumeConfig.systemVersion,
      ]);
    } catch (
      error: unknown
    ) {
      console.error(
        'エラーログの記録に失敗しました。',
        error,
      );
    }
  }

  initializeAccessLogSheet(): void {
    this.getOrCreateAccessLogSheet();
  }

  initializeErrorLogSheet(): void {
    this.getOrCreateErrorLogSheet();
  }

  protectAccessLogSheet(): void {
    const admins =
      this.getLogAdminEmails();

    if (
      admins.length === 0
    ) {
      throw new Error(
        'LOG_ADMIN_EMAILSが設定されていません。',
      );
    }

    const sheet =
      this.getOrCreateAccessLogSheet();

    this.removeProtection(
      sheet,
      ResumeConfig
        .protectionDescriptions
        .accessLog,
    );

    const protection =
      sheet
        .protect()
        .setDescription(
          ResumeConfig
            .protectionDescriptions
            .accessLog,
        );

    protection.setWarningOnly(
      false,
    );

    const editors =
      protection.getEditors();

    if (
      editors.length > 0
    ) {
      protection.removeEditors(
        editors,
      );
    }

    protection.addEditors(
      admins,
    );
  }

  protectErrorLogSheet(): void {
    const admins =
      this.getLogAdminEmails();

    if (
      admins.length === 0
    ) {
      throw new Error(
        'LOG_ADMIN_EMAILSが設定されていません。',
      );
    }

    const sheet =
      this.getOrCreateErrorLogSheet();

    this.removeProtection(
      sheet,
      ResumeConfig
        .protectionDescriptions
        .errorLog,
    );

    const protection =
      sheet
        .protect()
        .setDescription(
          ResumeConfig
            .protectionDescriptions
            .errorLog,
        );

    protection.setWarningOnly(
      false,
    );

    const editors =
      protection.getEditors();

    if (
      editors.length > 0
    ) {
      protection.removeEditors(
        editors,
      );
    }

    protection.addEditors(
      admins,
    );
  }

  private getOrCreateAccessLogSheet():
    GoogleAppsScript.Spreadsheet.Sheet {
    const spreadsheet =
      SpreadsheetApp.openById(
        this.spreadsheetId,
      );

    let sheet =
      spreadsheet.getSheetByName(
        ResumeConfig
          .accessLogSheetName,
      );

    if (!sheet) {
      sheet =
        spreadsheet.insertSheet(
          ResumeConfig
            .accessLogSheetName,
        );

      sheet
        .getRange(
          1,
          1,
          1,
          4,
        )
        .setValues([
          [
            '日時',
            '実行者',
            '操作種別',
            '詳細',
          ],
        ]);

      sheet.setFrozenRows(
        1,
      );

      this.formatHeader(
        sheet,
        4,
      );
    }

    return sheet;
  }

  private getOrCreateErrorLogSheet():
    GoogleAppsScript.Spreadsheet.Sheet {
    const spreadsheet =
      SpreadsheetApp.openById(
        this.spreadsheetId,
      );

    let sheet =
      spreadsheet.getSheetByName(
        ResumeConfig
          .errorLogSheetName,
      );

    if (!sheet) {
      sheet =
        spreadsheet.insertSheet(
          ResumeConfig
            .errorLogSheetName,
        );

      sheet
        .getRange(
          1,
          1,
          1,
          5,
        )
        .setValues([
          [
            '日時',
            '実行者',
            '対象ファイル',
            'エラー内容',
            'システムバージョン',
          ],
        ]);

      sheet.setFrozenRows(
        1,
      );

      this.formatHeader(
        sheet,
        5,
      );
    }

    return sheet;
  }

  private formatHeader(
    sheet:
      GoogleAppsScript.Spreadsheet.Sheet,
    columnCount: number,
  ): void {
    sheet
      .getRange(
        1,
        1,
        1,
        columnCount,
      )
      .setFontWeight(
        'bold',
      )
      .setBackground(
        '#4a86e8',
      )
      .setFontColor(
        '#ffffff',
      )
      .setWrap(
        true,
      )
      .setVerticalAlignment(
        'middle',
      );

    sheet.autoResizeColumns(
      1,
      columnCount,
    );
  }

  private getCurrentUserIdentifier():
    string {
    try {
      const activeUserEmail =
        Session
          .getActiveUser()
          .getEmail()
          .trim();

      if (
        activeUserEmail
      ) {
        return activeUserEmail;
      }

      const temporaryKey =
        Session
          .getTemporaryActiveUserKey();

      if (
        temporaryKey
      ) {
        return (
          '匿名ユーザー:' +
          temporaryKey
        );
      }

      return '(取得不可)';
    } catch {
      return '(取得不可)';
    }
  }

  private getLogAdminEmails():
    string[] {
    return String(
      PropertiesService
        .getScriptProperties()
        .getProperty(
          ResumeConfig
            .properties
            .logAdminEmails,
        ) ?? '',
    )
      .split(',')
      .map(
        (email: string): string =>
          email.trim(),
      )
      .filter(
        (email: string): boolean =>
          email !== '',
      );
  }

  private removeProtection(
    sheet:
      GoogleAppsScript.Spreadsheet.Sheet,
    description: string,
  ): void {
    const protections =
      sheet.getProtections(
        SpreadsheetApp
          .ProtectionType
          .SHEET,
      );

    protections
      .filter(
        (
          protection:
            GoogleAppsScript
              .Spreadsheet
              .Protection,
        ): boolean =>
          protection
            .getDescription() ===
          description,
      )
      .forEach(
        (
          protection:
            GoogleAppsScript
              .Spreadsheet
              .Protection,
        ): void => {
          protection.remove();
        },
      );
  }

  private sanitize(
    value: unknown,
  ): string {
    const text =
      String(
        value ?? '',
      );

    if (
      /^[=+\-@]/.test(
        text.trimStart(),
      )
    ) {
      return `'${text}`;
    }

    return text;
  }
}