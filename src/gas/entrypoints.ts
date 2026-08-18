import {
  ResumeImportService,
} from '../application/ResumeImportService';

import {
  formatAllSheets,
} from '../ui/SpreadsheetView';

import {
  ResumeMaintenanceService,
} from '../application/ResumeMaintenanceService';

import {
  ResumeSetupService,
} from '../application/ResumeSetupService';

import {
  AiEvaluationLegacyService,
} from '../application/AiEvaluationLegacyService';

import {
  GasDriveResumeRepository,
} from '../infrastructure/GasDriveResumeRepository';

import {
  GasResumeGeminiClient,
} from '../infrastructure/GasResumeGeminiClient';

import {
  GasResumeCandidateRepository,
} from '../infrastructure/GasResumeCandidateRepository';

import {
  GasImportLogRepository,
} from '../infrastructure/GasImportLogRepository';

import {
  ResumeConfig,
} from './config';

interface SelectionChangeEvent {
  range:
    GoogleAppsScript
      .Spreadsheet
      .Range;
}

interface SpreadsheetUiState {
  sheetName: string;
  activeRangeA1: string;
}

interface ResumeCommonServices {
  logs:
    GasImportLogRepository;

  maintenance:
    ResumeMaintenanceService;

  setup:
    ResumeSetupService;

  candidates:
    GasResumeCandidateRepository;
}

const aiEvaluationService =
  new AiEvaluationLegacyService();

export function onOpen(): void {
  initializeResumeSession();

  createResumeImportMenu();

  createAiEvaluationMenu();

  createUiMenu();
}

export function formatAllUiSheets(): void {
  formatAllSheets();

  SpreadsheetApp
    .getUi()
    .alert(
      '全シートの表示を整えました。',
    );
}

export function onSelectionChange(
  e: SelectionChangeEvent,
): void {
  try {
    if (
      !e ||
      !e.range
    ) {
      return;
    }

    const sheetName =
      e.range
        .getSheet()
        .getName();

    const userProperties =
      PropertiesService
        .getUserProperties();

    const previous =
      userProperties
        .getProperty(
          'LAST_VIEWED_SHEET',
        );

    if (
      previous ===
      sheetName
    ) {
      return;
    }

    userProperties
      .setProperty(
        'LAST_VIEWED_SHEET',
        sheetName,
      );

    if (
      sheetName !==
        ResumeConfig.sheetName &&
      sheetName !==
        ResumeConfig
          .applicantListSheetName
    ) {
      return;
    }

    writeSimpleTriggerAccessLog(
      'シート選択',
      `シート「${sheetName}」に切り替え`,
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'onSelectionChangeでエラーが発生しました。',
      error,
    );
  }
}

export function onEdit(
  e:
    GoogleAppsScript
      .Events
      .SheetsOnEdit,
): void {
  try {
    if (
      !e ||
      !e.range
    ) {
      return;
    }

    const sheet =
      e.range.getSheet();

    if (
      sheet.getName() !==
      ResumeConfig.sheetName
    ) {
      return;
    }

    const lastColumn =
      sheet.getLastColumn();

    if (
      lastColumn < 1
    ) {
      return;
    }

    const headerRow =
      sheet
        .getRange(
          1,
          1,
          1,
          lastColumn,
        )
        .getValues()[0];

    const headers =
      headerRow?.map(
        (
          value: unknown,
        ): string =>
          String(
            value,
          ).trim(),
      ) ?? [];

    const columnName =
      headers[
        e.range.getColumn() - 1
      ] ?? '不明な列';

    const safeValueColumns =
      new Set([
        '面接ステータス',
        '処理ステータス',
      ]);

    let detail =
      `セル ${e.range.getA1Notation()} / 列: ${columnName}`;

    if (
      e.range.getNumRows() === 1 &&
      e.range.getNumColumns() === 1 &&
      safeValueColumns.has(
        columnName,
      )
    ) {
      detail +=
        ` / 新しい値: ${String(
          e.value ?? '',
        )}`;
    }

    writeSimpleTriggerAccessLog(
      '面接官シート編集',
      detail,
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'onEditでエラーが発生しました。',
      error,
    );
  }
}

export function setupApiKey(): void {
  createResumeCommonServices()
    .setup
    .setupApiKey();
}

export function setupFolders(): void {
  createResumeCommonServices()
    .setup
    .setupFolders();
}

export function importResumes(): void {
  const uiState =
    captureSpreadsheetUiState();

  const importService =
    createResumeImportService();

  const lock =
    LockService
      .getScriptLock();

  if (
    !lock.tryLock(
      ResumeConfig
        .limits
        .importLockTimeoutMs,
    )
  ) {
    throw new Error(
      '別の履歴書取込処理が実行中です。しばらくしてから再実行してください。',
    );
  }

  try {
    const results =
      importService.execute();

    const processed =
      results.filter(
        (result): boolean =>
          result.status ===
          'processed',
      );

    const duplicate =
      results.filter(
        (result): boolean =>
          result.status ===
          'duplicate',
      );

    const errors =
      results.filter(
        (result): boolean =>
          result.status ===
          'error',
      );

    if (
      processed.length > 0
    ) {
      const services =
        createResumeCommonServices();

      services
        .candidates
        .rebuildApplicantList();

      services.logs.access(
        '操作実行',
        '履歴書取込後に応募者一覧シートを自動更新',
      );
    }

    restoreSpreadsheetUiState(
      uiState,
    );

    const lines = [
      '履歴書取込が完了しました。',
      '',
      `成功: ${processed.length}`,
      `重複: ${duplicate.length}`,
      `エラー: ${errors.length}`,
    ];

    if (
      errors.length > 0
    ) {
      lines.push(
        '',
        '--- エラー詳細 ---',
      );

      errors.forEach(
        (
          result,
          index,
        ): void => {
          lines.push(
            `${index + 1}. ${result.fileName}`,
            result.message ??
              '詳細不明',
          );
        },
      );
    }

    SpreadsheetApp
      .getUi()
      .alert(
        lines.join('\n'),
      );
  } finally {
    restoreSpreadsheetUiState(
      uiState,
    );

    lock.releaseLock();
  }
}

export function setupTrigger(): void {
  createResumeCommonServices()
    .setup
    .setupImportTrigger();
}

export function setupRetentionPolicy(): void {
  createResumeCommonServices()
    .setup
    .setupRetentionPolicy();
}

export function purgeExpiredCandidates(): void {
  const services =
    createResumeCommonServices();

  services
    .maintenance
    .applyRetentionPolicy();

  services.logs.access(
    '保持期間処理',
    '保持期間を超えた候補者データを匿名化',
  );

  SpreadsheetApp
    .getUi()
    .alert(
      '保持期間を超えた候補者データの処理が完了しました。',
    );
}

export function applyResumeRetentionPolicy(): void {
  createResumeCommonServices()
    .maintenance
    .applyRetentionPolicy();
}

export function setupRetentionTrigger(): void {
  createResumeCommonServices()
    .setup
    .setupRetentionTrigger();
}

export function setupAdminEditors(): void {
  createResumeCommonServices()
    .setup
    .setupAdminEditors();
}

export function rebuildApplicantListSheet(): void {
  const uiState =
    captureSpreadsheetUiState();

  try {
    const services =
      createResumeCommonServices();

    services
      .candidates
      .rebuildApplicantList();

    services.logs.access(
      '操作実行',
      '応募者一覧シートを作成/更新',
    );

    SpreadsheetApp
      .getUi()
      .alert(
        `「${ResumeConfig.applicantListSheetName}」シートを更新しました。`,
      );
  } finally {
    restoreSpreadsheetUiState(
      uiState,
    );
  }
}

export function initAccessLogSheet(): void {
  createResumeCommonServices()
    .setup
    .initializeAccessLogSheet();
}

export function setupLogAdminEditors(): void {
  createResumeCommonServices()
    .setup
    .setupLogAdminEditors();
}

export function initErrorLogSheet(): void {
  createResumeCommonServices()
    .setup
    .initializeErrorLogSheet();
}

export function removeAllTriggers(): void {
  createResumeCommonServices()
    .setup
    .removeAllTriggers();
}

export function setupAiEvaluationSheet(): void {
  aiEvaluationService
    .setupAiEvaluationSheet();
}

export function showCurrentApplicantDetail(): void {
  aiEvaluationService
    .showCurrentApplicantDetail();
}

export function restoreLatestEvaluation(): void {
  aiEvaluationService
    .restoreLatestEvaluation();
}

export function evaluateCurrentApplicant(): void {
  aiEvaluationService
    .evaluateCurrentApplicant();
}

export function compareCurrentApplicantAcrossDepartments(): void {
  aiEvaluationService
    .compareCurrentApplicantAcrossDepartments();
}

export function recreateAiEvaluationSheet(): void {
  aiEvaluationService
    .recreateAiEvaluationSheet();
}

export function initializeAiSecurity(): void {
  aiEvaluationService
    .initializeAiSecurity();
}

export function setupGeminiApiKey(): void {
  aiEvaluationService
    .setupGeminiApiKey();
}

export function setupSourceSpreadsheet(): void {
  aiEvaluationService
    .setupSourceSpreadsheet();
}

export function setupAiEvaluatorEmails(): void {
  aiEvaluationService
    .setupAiEvaluatorEmails();
}

export function setupCriteriaMaster(): void {
  aiEvaluationService
    .setupCriteriaMaster();
}

function createResumeImportMenu(): void {
  SpreadsheetApp
    .getUi()
    .createMenu(
      '履歴書取込',
    )
    .addItem(
      '① Gemini APIキーを設定',
      'setupApiKey',
    )
    .addItem(
      '② アップロード用Driveフォルダを準備',
      'setupFolders',
    )
    .addSeparator()
    .addItem(
      '③ 履歴書を取り込む（今すぐ実行）',
      'importResumes',
    )
    .addSeparator()
    .addItem(
      '④ 自動取込トリガーを設定（10分ごと）',
      'setupTrigger',
    )
    .addSeparator()
    .addItem(
      '⑤ データ保持期間を設定',
      'setupRetentionPolicy',
    )
    .addItem(
      '保持期間を超えたデータを今すぐ削除',
      'purgeExpiredCandidates',
    )
    .addItem(
      '保持期間チェックの自動実行を設定（毎日）',
      'setupRetentionTrigger',
    )
    .addSeparator()
    .addItem(
      '⑥ 個人情報列の編集を管理者のみに制限',
      'setupAdminEditors',
    )
    .addSeparator()
    .addItem(
      '⑦ 応募者一覧シートを作成/更新',
      'rebuildApplicantListSheet',
    )
    .addItem(
      '⑧ アクセスログシートを作成',
      'initAccessLogSheet',
    )
    .addItem(
      '⑨ アクセスログの編集を管理者のみに制限',
      'setupLogAdminEditors',
    )
    .addItem(
      '⑩ エラーログシートを作成',
      'initErrorLogSheet',
    )
    .addSeparator()
    .addItem(
      'すべての自動実行トリガーを解除',
      'removeAllTriggers',
    )
    .addToUi();
}

function createAiEvaluationMenu(): void {
  const ui =
    SpreadsheetApp.getUi();

  ui
    .createMenu(
      'AI評価',
    )
    .addItem(
      '応募者・部門一覧を更新',
      'setupAiEvaluationSheet',
    )
    .addItem(
      '選択中の応募者詳細を表示',
      'showCurrentApplicantDetail',
    )
    .addItem(
      '最新の評価結果を復元',
      'restoreLatestEvaluation',
    )
    .addItem(
      '選択部門でAI評価',
      'evaluateCurrentApplicant',
    )
    .addItem(
      '全部門で比較',
      'compareCurrentApplicantAcrossDepartments',
    )
    .addSeparator()
    .addSubMenu(
      ui
        .createMenu(
          '保守',
        )
        .addItem(
          'AI評価画面を再作成',
          'recreateAiEvaluationSheet',
        ),
    )
    .addSubMenu(
      ui
        .createMenu(
          '初期設定',
        )
        .addItem(
          '管理者を初期化',
          'initializeAiSecurity',
        )
        .addItem(
          'Gemini APIキー設定',
          'setupGeminiApiKey',
        )
        .addItem(
          '採用管理Spreadsheet設定',
          'setupSourceSpreadsheet',
        )
        .addItem(
          'AI評価実行ユーザー設定',
          'setupAiEvaluatorEmails',
        )
        .addItem(
          '評価基準マスタ作成',
          'setupCriteriaMaster',
        ),
    )
    .addToUi();
}

function createUiMenu(): void {
  SpreadsheetApp
    .getUi()
    .createMenu(
      '表示設定',
    )
    .addItem(
      '全シートの表示を整える',
      'formatAllUiSheets',
    )
    .addToUi();
}

function initializeResumeSession(): void {
  const spreadsheet =
    SpreadsheetApp
      .getActiveSpreadsheet();

  const activeSheet =
    spreadsheet
      .getActiveSheet();

  const sheetName =
    activeSheet
      ? activeSheet.getName()
      : '';

  PropertiesService
    .getUserProperties()
    .setProperty(
      'LAST_VIEWED_SHEET',
      sheetName,
    );

  try {
    const services =
      createResumeCommonServices();

    services.logs.access(
      'シートを開いた',
      (
        sheetName
          ? `開いたときのタブ: ${sheetName}`
          : '（タブ名を取得できませんでした）'
      ) +
        ` / version ${ResumeConfig.systemVersion}`,
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'onOpenアクセスログに失敗しました。',
      error,
    );
  }
}

function createResumeCommonServices():
  ResumeCommonServices {
  const spreadsheetId =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getId();

  const logs =
    new GasImportLogRepository(
      spreadsheetId,
    );

  const maintenance =
    new ResumeMaintenanceService(
      spreadsheetId,
    );

  const setup =
    new ResumeSetupService(
      spreadsheetId,
      maintenance,
      logs,
    );

  const candidates =
    new GasResumeCandidateRepository(
      spreadsheetId,
    );

  return {
    logs,
    maintenance,
    setup,
    candidates,
  };
}

function createResumeImportService():
  ResumeImportService {
  const properties =
    PropertiesService
      .getScriptProperties();

  const services =
    createResumeCommonServices();

  const apiKey =
    requireResumeProperty(
      properties,
      ResumeConfig
        .properties
        .geminiApiKey,
      'Gemini APIキー',
    );

  const inboxFolderId =
    requireResumeProperty(
      properties,
      ResumeConfig
        .properties
        .inboxFolderId,
      '履歴書アップロードフォルダ',
    );

  const processedFolderId =
    requireResumeProperty(
      properties,
      ResumeConfig
        .properties
        .processedFolderId,
      '処理済みフォルダ',
    );

  const duplicateFolderId =
    requireResumeProperty(
      properties,
      ResumeConfig
        .properties
        .duplicateFolderId,
      '重複フォルダ',
    );

  const errorFolderId =
    requireResumeProperty(
      properties,
      ResumeConfig
        .properties
        .errorFolderId,
      '処理エラーフォルダ',
    );

  const sourceRepository =
    new GasDriveResumeRepository(
      inboxFolderId,
      processedFolderId,
      duplicateFolderId,
      errorFolderId,
    );

  const extractionClient =
    new GasResumeGeminiClient(
      apiKey,
    );

  return new ResumeImportService(
    sourceRepository,
    services.candidates,
    extractionClient,
    services.logs,
    {
      maxFilesPerRun:
        ResumeConfig
          .limits
          .maxFilesPerRun,

      maxResumeTextLength:
        ResumeConfig
          .limits
          .maxResumeTextLength,

      maxTotalTextLengthPerRun:
        ResumeConfig
          .limits
          .maxTotalTextLengthPerRun,
    },
  );
}

function requireResumeProperty(
  properties:
    GoogleAppsScript
      .Properties
      .Properties,
  key: string,
  label: string,
): string {
  const value =
    String(
      properties
        .getProperty(
          key,
        ) ?? '',
    ).trim();

  if (
    !value
  ) {
    throw new Error(
      `${label}が設定されていません。`,
    );
  }

  return value;
}


function captureSpreadsheetUiState():
  SpreadsheetUiState {
  const spreadsheet =
    SpreadsheetApp
      .getActiveSpreadsheet();

  const activeSheet =
    spreadsheet
      .getActiveSheet();

  const activeRange =
    activeSheet
      .getActiveRange();

  return {
    sheetName:
      activeSheet.getName(),

    activeRangeA1:
      activeRange
        ? activeRange
            .getA1Notation()
        : 'A1',
  };
}

function restoreSpreadsheetUiState(
  state:
    SpreadsheetUiState,
): void {
  try {
    const spreadsheet =
      SpreadsheetApp
        .getActiveSpreadsheet();

    const sheet =
      spreadsheet
        .getSheetByName(
          state.sheetName,
        );

    if (!sheet) {
      return;
    }

    spreadsheet
      .setActiveSheet(
        sheet,
      );

    sheet
      .getRange(
        state.activeRangeA1,
      )
      .activate();
  } catch (
    error: unknown
  ) {
    console.error(
      'UI状態の復元に失敗しました。',
      error,
    );
  }
}

function writeSimpleTriggerAccessLog(
  actionType: string,
  detail: string,
): void {
  try {
    const spreadsheet =
      SpreadsheetApp
        .getActiveSpreadsheet();

    const sheet =
      spreadsheet
        .getSheetByName(
          ResumeConfig
            .accessLogSheetName,
        );

    if (
      !sheet
    ) {
      return;
    }

    sheet.appendRow([
      new Date(),
      '(simple trigger)',
      actionType,
      detail,
    ]);
  } catch (
    error: unknown
  ) {
    console.error(
      'simple triggerアクセスログの記録に失敗しました。',
      error,
    );
  }
}