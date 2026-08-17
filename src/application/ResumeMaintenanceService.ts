import {
  ResumeConfig,
} from '../gas/config';

export class ResumeMaintenanceService {
  constructor(
    private readonly spreadsheetId: string,
  ) {}

  applyRetentionPolicy(): void {
    const retentionDays =
      this.getRetentionDays();

    if (
      retentionDays <= 0
    ) {
      throw new Error(
        'RETENTION_DAYSは1以上で設定してください。',
      );
    }

    const spreadsheet =
      SpreadsheetApp.openById(
        this.spreadsheetId,
      );

    const sheet =
      spreadsheet.getSheetByName(
        ResumeConfig.sheetName,
      );

    if (!sheet) {
      return;
    }

    const values =
      sheet
        .getDataRange()
        .getValues();

    if (
      values.length < 2
    ) {
      return;
    }

    const headerRow =
      values[0];

    if (!headerRow) {
      return;
    }

    const headers =
      headerRow.map(
        (
          value: unknown,
        ): string =>
          String(
            value,
          ).trim(),
      );

    const timestampIndex =
      headers.indexOf(
        'タイムスタンプ',
      );

    if (
      timestampIndex === -1
    ) {
      throw new Error(
        'タイムスタンプ列が見つかりません。',
      );
    }

    const personalFields = [
      'フリガナ',
      '生年月日',
      '年齢',
      '性別',
      '現住所',
      '電話番号',
      'メールアドレス',
    ];

    const personalIndexes =
      personalFields
        .map(
          (
            field: string,
          ): number =>
            headers.indexOf(
              field,
            ),
        )
        .filter(
          (
            index: number,
          ): boolean =>
            index >= 0,
        );

    if (
      personalIndexes.length ===
      0
    ) {
      return;
    }

    const cutoff =
      new Date();

    cutoff.setDate(
      cutoff.getDate() -
        retentionDays,
    );

    for (
      let rowIndex = 1;
      rowIndex <
      values.length;
      rowIndex++
    ) {
      const row =
        values[rowIndex];

      if (!row) {
        continue;
      }

      const timestamp =
        this.toDate(
          row[
            timestampIndex
          ],
        );

      if (!timestamp) {
        continue;
      }

      if (
        timestamp >= cutoff
      ) {
        continue;
      }

      for (
        const columnIndex
        of personalIndexes
      ) {
        const currentValue =
          String(
            row[
              columnIndex
            ] ?? '',
          ).trim();

        if (
          currentValue === '' ||
          currentValue ===
            ResumeConfig
              .redactedText
        ) {
          continue;
        }

        sheet
          .getRange(
            rowIndex + 1,
            columnIndex + 1,
          )
          .setValue(
            ResumeConfig
              .redactedText,
          );
      }
    }

    SpreadsheetApp.flush();
  }

  installImportTrigger(): void {
    this.deleteTriggersByHandler(
      'importResumes',
    );

    ScriptApp
      .newTrigger(
        'importResumes',
      )
      .timeBased()
      .everyMinutes(
        5,
      )
      .create();
  }

  installRetentionTrigger(): void {
    this.deleteTriggersByHandler(
      'applyResumeRetentionPolicy',
    );

    ScriptApp
      .newTrigger(
        'applyResumeRetentionPolicy',
      )
      .timeBased()
      .everyDays(
        1,
      )
      .atHour(
        3,
      )
      .create();
  }

  installAllTriggers(): void {
    this.installImportTrigger();

    this.installRetentionTrigger();
  }

  removeAllManagedTriggers(): void {
    this.deleteTriggersByHandler(
      'importResumes',
    );

    this.deleteTriggersByHandler(
      'applyResumeRetentionPolicy',
    );
  }

  getManagedTriggerSummary():
    string[] {
    const managedHandlers =
      new Set([
        'importResumes',
        'applyResumeRetentionPolicy',
      ]);

    return ScriptApp
      .getProjectTriggers()
      .filter(
        (
          trigger:
            GoogleAppsScript
              .Script
              .Trigger,
        ): boolean =>
          managedHandlers.has(
            trigger
              .getHandlerFunction(),
          ),
      )
      .map(
        (
          trigger:
            GoogleAppsScript
              .Script
              .Trigger,
        ): string =>
          [
            trigger
              .getHandlerFunction(),

            trigger
              .getEventType(),

            trigger
              .getTriggerSource(),
          ].join(
            ' / ',
          ),
      );
  }

  private getRetentionDays():
    number {
    const value =
      PropertiesService
        .getScriptProperties()
        .getProperty(
          ResumeConfig
            .properties
            .retentionDays,
        );

    if (!value) {
      return 90;
    }

    const parsed =
      Number(
        value,
      );

    if (
      !Number.isFinite(
        parsed,
      ) ||
      parsed <= 0
    ) {
      throw new Error(
        `RETENTION_DAYSの設定値が不正です: ${value}`,
      );
    }

    return Math.floor(
      parsed,
    );
  }

  private deleteTriggersByHandler(
    handlerName: string,
  ): void {
    const triggers =
      ScriptApp
        .getProjectTriggers();

    triggers
      .filter(
        (
          trigger:
            GoogleAppsScript
              .Script
              .Trigger,
        ): boolean =>
          trigger
            .getHandlerFunction() ===
          handlerName,
      )
      .forEach(
        (
          trigger:
            GoogleAppsScript
              .Script
              .Trigger,
        ): void => {
          ScriptApp
            .deleteTrigger(
              trigger,
            );
        },
      );
  }

  private toDate(
    value: unknown,
  ): Date | null {
    if (
      value instanceof Date &&
      !Number.isNaN(
        value.getTime(),
      )
    ) {
      return value;
    }

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null;
    }

    const date =
      new Date(
        String(
          value,
        ),
      );

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return null;
    }

    return date;
  }
}