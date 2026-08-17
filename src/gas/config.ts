export const ResumeConfig = {
  systemVersion: '1.3.1',

  sheetName: '面接官シート',
  applicantListSheetName: '応募者一覧',
  accessLogSheetName: 'アクセスログ',
  errorLogSheetName: 'エラーログ',

  geminiModel: 'gemini-flash-latest',

  geminiEndpointBase:
    'https://generativelanguage.googleapis.com/v1beta/models/',

  properties: {
    geminiApiKey: 'GEMINI_API_KEY',
    inboxFolderId: 'INBOX_FOLDER_ID',
    processedFolderId: 'PROCESSED_FOLDER_ID',
    errorFolderId: 'ERROR_FOLDER_ID',
    duplicateFolderId: 'DUPLICATE_FOLDER_ID',
    retentionDays: 'RETENTION_DAYS',
    adminEmails: 'ADMIN_EMAILS',
    logAdminEmails: 'LOG_ADMIN_EMAILS',
  },

  limits: {
    maxFileSizeBytes:
      10 * 1024 * 1024,

    maxResumeTextLength:
      50000,

    maxFilesPerRun:
      10,

    maxTotalTextLengthPerRun:
      150000,

    importLockTimeoutMs:
      30000,

    setupRowBuffer:
      990,
  },

  folderNames: {
    inbox: '履歴書アップロード',
    processed: '処理済み',
    error: '処理エラー',
    duplicate: '重複',
  },

  interviewStatusOptions: [
    '未対応',
    '書類選考中',
    '一次面接',
    '二次面接',
    '最終面接',
    '内定',
    '不採用',
  ],

  defaultInterviewStatus:
    '未対応',

  redactedText:
    '（保持期間終了のため削除済み）',

  protectionDescriptions: {
    interviewer:
      '履歴書取込システム: 自動保護（面接ステータス列を除く）',

    applicantList:
      '履歴書取込システム: 応募者一覧の保護',

    accessLog:
      '履歴書取込システム: アクセスログの保護',

    errorLog:
      '履歴書取込システム: エラーログの保護',
  },

  resumeFields: [
    '氏名',
    'フリガナ',
    '生年月日',
    '年齢',
    '性別',
    '現住所',
    '電話番号',
    'メールアドレス',
    '最終学歴',
    '学歴サマリー',
    '直近の職歴',
    '職歴サマリー',
    '保有資格',
    '自己PR要約',
    '特記事項',
  ],

  applicantListFields: [
    '氏名',
    '面接ステータス',
    '最終学歴',
    '直近の職歴',
    '職歴サマリー',
    '保有資格',
    '自己PR要約',
    '特記事項',
    '電話番号',
    'メールアドレス',
    'タイムスタンプ',
  ],
} as const;

export const AiConfig = {
  evaluationSheetName: 'AI評価',
  criteriaSheetName: '評価基準',
  historySheetName: 'AI評価履歴',
  comparisonSheetName: '部門比較',
  interviewerSheetName: '面接官シート',

  properties: {
    adminEmail: 'AI_ADMIN_EMAIL',
    evaluatorEmails: 'AI_EVALUATOR_EMAILS',
    sourceSpreadsheetId:
      'SOURCE_SPREADSHEET_ID',
    geminiApiKey: 'GEMINI_API_KEY',
  },

  geminiModel:
    'gemini-flash-latest',

  geminiEndpointBase:
    'https://generativelanguage.googleapis.com/v1beta/models/',

  maxDepartmentsPerComparison:
    5,

  maxFieldLength:
    4000,

  maxHistoryJsonLength:
    45000,

  aiAllowedFields: [
    '最終学歴',
    '学歴サマリー',
    '直近の職歴',
    '職歴サマリー',
    '保有資格',
    '自己PR要約',
    '特記事項',
    '志望動機',
    '技術経験',
    'チーム経験',
    '問題解決経験',
  ],
} as const;