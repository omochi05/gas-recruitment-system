import {
  ResumeConfig,
} from '../gas/config';

import {
  ResumeMaintenanceService,
} from './ResumeMaintenanceService';

import {
  GasImportLogRepository,
} from '../infrastructure/GasImportLogRepository';

export class ResumeSetupService {
  constructor(
    private readonly spreadsheetId: string,
    private readonly maintenance:
      ResumeMaintenanceService,
    private readonly logs:
      GasImportLogRepository,
  ) {}

  setupApiKey(): void {
    this.requireAdmin();

    const ui =
      SpreadsheetApp.getUi();

    const properties =
      PropertiesService
        .getScriptProperties();

    const current =
      properties.getProperty(
        ResumeConfig
          .properties
          .geminiApiKey,
      );

    const result =
      ui.prompt(
        'Gemini APIキーの設定',
        [
          current
            ? '現在キーは設定済みです。新しいキーを入力すると上書きします。'
            : '',
          'Google AI Studioで発行したAPIキーを入力してください。',
        ]
          .filter(Boolean)
          .join('\n'),
        ui.ButtonSet.OK_CANCEL,
      );

    if (
      result.getSelectedButton() !==
      ui.Button.OK
    ) {
      return;
    }

    const apiKey =
      result
        .getResponseText()
        .trim();

    if (!apiKey) {
      ui.alert(
        'APIキーが入力されませんでした。',
      );

      return;
    }

    properties.setProperty(
      ResumeConfig
        .properties
        .geminiApiKey,
      apiKey,
    );

    this.logs.access(
      '操作実行',
      'Gemini APIキーを設定/更新',
    );

    ui.alert(
      'Gemini APIキーを保存しました。',
    );
  }

  setupFolders(): void {
    this.requireAdmin();

    const root =
      DriveApp.getRootFolder();

    const inbox =
      this.getOrCreateFolder(
        ResumeConfig
          .folderNames
          .inbox,
        root,
      );

    const processed =
      this.getOrCreateFolder(
        ResumeConfig
          .folderNames
          .processed,
        inbox,
      );

    const error =
      this.getOrCreateFolder(
        ResumeConfig
          .folderNames
          .error,
        inbox,
      );

    const duplicate =
      this.getOrCreateFolder(
        ResumeConfig
          .folderNames
          .duplicate,
        inbox,
      );

    const properties =
      PropertiesService
        .getScriptProperties();

    properties.setProperty(
      ResumeConfig
        .properties
        .inboxFolderId,
      inbox.getId(),
    );

    properties.setProperty(
      ResumeConfig
        .properties
        .processedFolderId,
      processed.getId(),
    );

    properties.setProperty(
      ResumeConfig
        .properties
        .errorFolderId,
      error.getId(),
    );

    properties.setProperty(
      ResumeConfig
        .properties
        .duplicateFolderId,
      duplicate.getId(),
    );

    this.logs.access(
      '操作実行',
      'アップロード用Driveフォルダを準備',
    );

    SpreadsheetApp
      .getUi()
      .alert(
        'フォルダを準備しました',
        [
          'このフォルダに履歴書ファイル（.txt または .pdf）をアップロードしてください:',
          inbox.getUrl(),
          '',
          `既存候補者と氏名・連絡先が一致した場合は「${ResumeConfig.folderNames.duplicate}」フォルダに振り分けられます。`,
        ].join('\n'),
        SpreadsheetApp
          .getUi()
          .ButtonSet
          .OK,
      );
  }

  setupRetentionPolicy(): void {
    this.requireAdmin();

    const ui =
      SpreadsheetApp.getUi();

    const properties =
      PropertiesService
        .getScriptProperties();

    const current =
      properties.getProperty(
        ResumeConfig
          .properties
          .retentionDays,
      ) ?? '';

    const result =
      ui.prompt(
        'データ保持期間を設定',
        [
          '候補者の個人情報を保持する日数を入力してください。',
          `現在: ${current || '未設定'}`,
        ].join('\n'),
        ui.ButtonSet.OK_CANCEL,
      );

    if (
      result.getSelectedButton() !==
      ui.Button.OK
    ) {
      return;
    }

    const days =
      Number(
        result
          .getResponseText()
          .trim(),
      );

    if (
      !Number.isInteger(days) ||
      days <= 0
    ) {
      throw new Error(
        '保持期間は1以上の整数（日数）で入力してください。',
      );
    }

    properties.setProperty(
      ResumeConfig
        .properties
        .retentionDays,
      String(days),
    );

    this.logs.access(
      '操作実行',
      `データ保持期間を${days}日に設定`,
    );

    ui.alert(
      `保持期間を${days}日に設定しました。`,
    );
  }

  setupImportTrigger(): void {
    this.requireAdmin();

    this.maintenance
      .installImportTrigger();

    this.logs.access(
      '操作実行',
      '自動取込トリガーを設定',
    );

    SpreadsheetApp
      .getUi()
      .alert(
        '10分ごとに自動取込を実行するトリガーを設定しました。',
      );
  }

  setupRetentionTrigger(): void {
    this.requireAdmin();

    this.maintenance
      .installRetentionTrigger();

    this.logs.access(
      '操作実行',
      '保持期間チェックの自動実行を設定',
    );

    SpreadsheetApp
      .getUi()
      .alert(
        '毎日、保持期間を超えた候補者データを自動的に匿名化するトリガーを設定しました。',
      );
  }

  setupAdminEditors(): void {
    this.requireAdmin();

    const admins =
      this.getCsvProperty(
        ResumeConfig
          .properties
          .adminEmails,
      );

    if (
      admins.length === 0
    ) {
      throw new Error(
        'ADMIN_EMAILSが設定されていません。',
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
      throw new Error(
        `「${ResumeConfig.sheetName}」シートがありません。`,
      );
    }

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
          ResumeConfig
            .protectionDescriptions
            .interviewer,
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

    const protection =
      sheet
        .protect()
        .setDescription(
          ResumeConfig
            .protectionDescriptions
            .interviewer,
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

    const headers =
      this.getHeaders(
        sheet,
      );

    const statusIndex =
      headers.indexOf(
        '面接ステータス',
      );

    if (
      statusIndex >= 0
    ) {
      protection.setUnprotectedRanges([
        sheet.getRange(
          2,
          statusIndex + 1,
          Math.max(
            sheet.getMaxRows() - 1,
            1,
          ),
          1,
        ),
      ]);
    }

    this.logs.access(
      '操作実行',
      '個人情報列の編集を管理者のみに制限',
    );

    SpreadsheetApp
      .getUi()
      .alert(
        '面接ステータス列以外を管理者のみ編集可能にしました。',
      );
  }

  initializeAccessLogSheet(): void {
    this.requireAdmin();

    this.logs
      .initializeAccessLogSheet();

    SpreadsheetApp
      .getUi()
      .alert(
        `「${ResumeConfig.accessLogSheetName}」シートを準備しました。`,
      );
  }

  initializeErrorLogSheet(): void {
    this.requireAdmin();

    this.logs
      .initializeErrorLogSheet();

    SpreadsheetApp
      .getUi()
      .alert(
        `「${ResumeConfig.errorLogSheetName}」シートを準備しました。`,
      );
  }

  setupLogAdminEditors(): void {
    this.requireAdmin();

    this.logs
      .protectAccessLogSheet();

    this.logs
      .protectErrorLogSheet();

    this.logs.access(
      '操作実行',
      'ログシートの編集を管理者のみに制限',
    );

    SpreadsheetApp
      .getUi()
      .alert(
        'アクセスログ・エラーログを管理者のみ編集可能にしました。',
      );
  }

  removeAllTriggers(): void {
    this.requireAdmin();

    this.maintenance
      .removeAllManagedTriggers();

    this.logs.access(
      '操作実行',
      'すべての自動実行トリガーを解除',
    );

    SpreadsheetApp
      .getUi()
      .alert(
        'すべての自動実行トリガーを解除しました。',
      );
  }

  private requireAdmin(): void {
    const admins =
      this.getCsvProperty(
        ResumeConfig
          .properties
          .adminEmails,
      );

    if (
      admins.length === 0
    ) {
      throw new Error(
        'システム管理者が設定されていません。',
      );
    }

    const currentUser =
      this.getCurrentUserEmail();

    if (
      !currentUser ||
      !admins.includes(
        currentUser,
      )
    ) {
      throw new Error(
        'この操作はシステム管理者のみ実行できます。',
      );
    }
  }

  private getCurrentUserEmail():
    string {
    try {
      return Session
        .getActiveUser()
        .getEmail()
        .trim();
    } catch {
      return '';
    }
  }

  private getCsvProperty(
    key: string,
  ): string[] {
    return String(
      PropertiesService
        .getScriptProperties()
        .getProperty(
          key,
        ) ?? '',
    )
      .split(',')
      .map(
        (value: string): string =>
          value.trim(),
      )
      .filter(
        (value: string): boolean =>
          value !== '',
      );
  }

  private getOrCreateFolder(
    name: string,
    parent:
      GoogleAppsScript.Drive.Folder,
  ): GoogleAppsScript.Drive.Folder {
    const folders =
      parent.getFoldersByName(
        name,
      );

    if (
      folders.hasNext()
    ) {
      return folders.next();
    }

    return parent.createFolder(
      name,
    );
  }

  private getHeaders(
    sheet:
      GoogleAppsScript.Spreadsheet.Sheet,
  ): string[] {
    const lastColumn =
      sheet.getLastColumn();

    if (
      lastColumn < 1
    ) {
      return [];
    }

    const values =
      sheet
        .getRange(
          1,
          1,
          1,
          lastColumn,
        )
        .getValues()[0];

    if (!values) {
      return [];
    }

    return values.map(
      (
        value: unknown,
      ): string =>
        String(
          value,
        ).trim(),
    );
  }
}