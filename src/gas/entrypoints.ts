import {
  EvaluationService,
} from '../application/EvaluationService';

import {
  GasCandidateRepository,
} from '../infrastructure/GasCandidateRepository';

import {
  GasCriteriaRepository,
} from '../infrastructure/GasCriteriaRepository';

import {
  GasEvaluationHistoryRepository,
} from '../infrastructure/GasEvaluationHistoryRepository';

import {
  GasGeminiClient,
} from '../infrastructure/GasGeminiClient';

import {
  GasUserIdentityProvider,
} from '../infrastructure/GasUserIdentityProvider';

import {
  ScriptPropertiesPermissionRepository,
} from '../infrastructure/ScriptPropertiesPermissionRepository';

import {
  SpreadsheetEvaluationInputReader,
} from '../infrastructure/SpreadsheetEvaluationInputReader';

import {
  SpreadsheetEvaluationResultWriter,
} from '../infrastructure/SpreadsheetEvaluationResultWriter';

import {
  AuthorizationService,
} from '../security/AuthorizationService';

import {
  AiDataPolicy,
} from '../security/AiDataPolicy';

import {
  SpreadsheetSanitizer,
} from '../security/SpreadsheetSanitizer';

// ========================================
// Script Properties
// ========================================

const PROP_GEMINI_API_KEY =
  'GEMINI_API_KEY';

const PROP_SOURCE_SPREADSHEET_ID =
  'SOURCE_SPREADSHEET_ID';

const PROP_ADMIN_EMAIL =
  'AI_ADMIN_EMAIL';

const PROP_EVALUATOR_EMAILS =
  'AI_EVALUATOR_EMAILS';

// ========================================
// Sheet Names
// ========================================

const CANDIDATE_SHEET_NAME =
  '応募者一覧';

const CRITERIA_SHEET_NAME =
  '評価基準マスタ';

const HISTORY_SHEET_NAME =
  'AI評価履歴';

const EVALUATION_UI_SHEET_NAME =
  'AI評価';

// ========================================
// Application Context
// ========================================

interface ApplicationContext {
  evaluationService:
    EvaluationService;

  inputReader:
    SpreadsheetEvaluationInputReader;

  resultWriter:
    SpreadsheetEvaluationResultWriter;
}

// ========================================
// GAS Public Entry Points
// ========================================

/**
 * Spreadsheetを開いた際に
 * AI評価メニューを追加する。
 *
 * GASから直接公開する処理は
 * 必要最低限に留める。
 */
export function onOpen(): void {
  SpreadsheetApp
    .getUi()
    .createMenu('AI評価')
    .addItem(
      'AI評価を実行',
      'evaluateSelectedApplicant',
    )
    .addToUi();
}

/**
 * Spreadsheet上で選択された
 * 応募者・部門を利用してAI評価を実行する。
 *
 * GAS側では業務ロジックを持たず、
 * Application層へ処理を委譲する。
 */
export function evaluateSelectedApplicant(): void {
  try {
    const context =
      createApplicationContext();

    const input =
      context.inputReader.read();

    const result =
      context.evaluationService.evaluate(
        input.candidateKey,
        input.departmentId,
      );

    context.resultWriter.write(
      result,
    );

    SpreadsheetApp
      .getUi()
      .alert(
        'AI評価が完了しました。',
      );
  } catch (error: unknown) {
    handleError(error);
  }
}

// ========================================
// Composition Root
// ========================================

/**
 * アプリケーションで利用する
 * 各クラスの依存関係を生成・接続する。
 *
 * Google固有APIへの依存は
 * Infrastructure層へ閉じ込める。
 */
function createApplicationContext():
  ApplicationContext {

  const scriptProperties =
    PropertiesService
      .getScriptProperties();

  // ----------------------------------------
  // Configuration
  // ----------------------------------------

  const spreadsheetId =
    scriptProperties.getProperty(
      PROP_SOURCE_SPREADSHEET_ID,
    );

  if (!spreadsheetId) {
    throw new Error(
      '採用管理Spreadsheet IDが設定されていません。',
    );
  }

  const apiKey =
    scriptProperties.getProperty(
      PROP_GEMINI_API_KEY,
    );

  if (!apiKey) {
    throw new Error(
      'Gemini APIキーが設定されていません。',
    );
  }

  // ----------------------------------------
  // Security
  // ----------------------------------------

  const identityProvider =
    new GasUserIdentityProvider();

  const permissionRepository =
    new ScriptPropertiesPermissionRepository(
      PROP_ADMIN_EMAIL,
      PROP_EVALUATOR_EMAILS,
    );

  const authorization =
    new AuthorizationService(
      identityProvider,
      permissionRepository,
    );

  const aiDataPolicy =
    new AiDataPolicy();

  const spreadsheetSanitizer =
    new SpreadsheetSanitizer();

  // ----------------------------------------
  // Repository
  // ----------------------------------------

  const candidateRepository =
    new GasCandidateRepository(
      spreadsheetId,
      CANDIDATE_SHEET_NAME,
    );

  const criteriaRepository =
    new GasCriteriaRepository(
      spreadsheetId,
      CRITERIA_SHEET_NAME,
    );

  const historyRepository =
    new GasEvaluationHistoryRepository(
      spreadsheetId,
      HISTORY_SHEET_NAME,
    );

  // ----------------------------------------
  // External AI
  // ----------------------------------------

  const geminiClient =
    new GasGeminiClient(
      apiKey,
    );

  // ----------------------------------------
  // Application
  // ----------------------------------------

  const evaluationService =
    new EvaluationService(
      authorization,
      candidateRepository,
      criteriaRepository,
      aiDataPolicy,
      geminiClient,
      historyRepository,
    );

  // ----------------------------------------
  // Spreadsheet Adapter
  // ----------------------------------------

  const inputReader =
    new SpreadsheetEvaluationInputReader(
      spreadsheetId,
      EVALUATION_UI_SHEET_NAME,
    );

  const resultWriter =
    new SpreadsheetEvaluationResultWriter(
      spreadsheetId,
      EVALUATION_UI_SHEET_NAME,
      spreadsheetSanitizer,
    );

  return {
    evaluationService,
    inputReader,
    resultWriter,
  };
}

// ========================================
// Error Handling
// ========================================

function handleError(
  error: unknown,
): void {
  const message =
    error instanceof Error
      ? error.message
      : '予期しないエラーが発生しました。';

  console.error(
    '[AI Evaluation Error]',
    message,
  );

  SpreadsheetApp
    .getUi()
    .alert(
      `AI評価を実行できませんでした。\n\n${message}`,
    );
}