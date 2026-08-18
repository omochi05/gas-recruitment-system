export function formatAllSheets(): void {
  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheets = [
    '評価基準',
    'アクセスログ',
    '面接官シート',
    'AI評価',
    '部門比較',
    'AI評価履歴',
    'エラーログ',
    '応募者一覧',
  ];

  for (
    const sheetName
    of sheets
  ) {
    const sheet =
      spreadsheet.getSheetByName(
        sheetName,
      );

    if (!sheet) {
      continue;
    }

    switch (sheetName) {
      case '評価基準':
        formatCriteriaSheet(
          sheet,
        );
        break;

      case 'アクセスログ':
        formatAccessLogSheet(
          sheet,
        );
        break;

      case '面接官シート':
        formatInterviewerSheet(
          sheet,
        );
        break;

      case 'AI評価':
        formatAiEvaluationSheet(
          sheet,
        );
        break;

      case '部門比較':
        formatDepartmentComparisonSheet(
          sheet,
        );
        break;

      case 'AI評価履歴':
        formatAiHistorySheet(
          sheet,
        );
        break;

      case 'エラーログ':
        formatErrorLogSheet(
          sheet,
        );
        break;

      case '応募者一覧':
        formatApplicantListSheet(
          sheet,
        );
        break;
    }
  }

  SpreadsheetApp.flush();
}

function formatCriteriaSheet(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): void {
  applyTableBase(
    sheet,
  );

  setColumnWidths(
    sheet,
    [
      120,
      180,
      90,
      420,
    ],
  );

  wrapColumns(
    sheet,
    [
      4,
    ],
  );

  sheet
    .getRange(
      'C:C',
    )
    .setHorizontalAlignment(
      'center',
    );
}

function formatAccessLogSheet(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): void {
  applyTableBase(
    sheet,
  );

  autoResizeWithLimits(
    sheet,
    100,
    320,
  );

  applyDateFormatByHeader(
    sheet,
    [
      '日時',
      'タイムスタンプ',
      '実行日時',
    ],
  );

  wrapAllBody(
    sheet,
  );
}

function formatInterviewerSheet(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): void {
  applyTableBase(
    sheet,
  );

  const headers =
    getHeaders(
      sheet,
    );

  const longHeaders =
    new Set([
      '現住所',
      '学歴サマリー',
      '職歴サマリー',
      '自己PR要約',
      '特記事項',
      '処理メッセージ',
    ]);

  const centerHeaders =
    new Set([
      '年齢',
      '性別',
      '面接ステータス',
      '処理ステータス',
    ]);

  headers.forEach(
    (
      header: string,
      index: number,
    ): void => {
      const column =
        index + 1;

      if (
        longHeaders.has(
          header,
        )
      ) {
        sheet.setColumnWidth(
          column,
          280,
        );

        sheet
          .getRange(
            1,
            column,
            sheet.getMaxRows(),
            1,
          )
          .setWrap(
            true,
          )
          .setVerticalAlignment(
            'top',
          );

        return;
      }

      sheet.autoResizeColumn(
        column,
      );

      limitColumnWidth(
        sheet,
        column,
        90,
        220,
      );

      if (
        centerHeaders.has(
          header,
        )
      ) {
        sheet
          .getRange(
            2,
            column,
            Math.max(
              sheet.getMaxRows() - 1,
              1,
            ),
            1,
          )
          .setHorizontalAlignment(
            'center',
          );
      }
    },
  );

  applyDateFormatByHeader(
    sheet,
    [
      'タイムスタンプ',
    ],
  );
}

function formatAiEvaluationSheet(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): void {
  sheet.setHiddenGridlines(
    true,
  );

  sheet.setFrozenRows(
    3,
  );

  sheet
    .getRange(
      'A1:G1',
    )
    .setBackground(
      '#1f4e78',
    )
    .setFontColor(
      '#ffffff',
    )
    .setFontWeight(
      'bold',
    )
    .setFontSize(
      16,
    )
    .setHorizontalAlignment(
      'center',
    )
    .setVerticalAlignment(
      'middle',
    );

  sheet.setRowHeight(
    1,
    42,
  );

  sheet
    .getRange(
      'A2:A3',
    )
    .setBackground(
      '#d9eaf7',
    )
    .setFontWeight(
      'bold',
    )
    .setFontColor(
      '#1f1f1f',
    )
    .setVerticalAlignment(
      'middle',
    );

  sheet
    .getRange(
      'B2:B3',
    )
    .setBackground(
      '#ffffff',
    )
    .setFontWeight(
      'bold',
    )
    .setVerticalAlignment(
      'middle',
    );

  sheet
    .getRange(
      'A2:B3',
    )
    .setBorder(
      true,
      true,
      true,
      true,
      true,
      true,
    );

  styleSectionHeader(
    sheet,
    'A5:B5',
    '応募者情報',
  );

  styleSectionHeader(
    sheet,
    'A15:C15',
    '評価基準',
  );

  styleSectionHeader(
    sheet,
    'A24:G24',
    'AI評価結果',
  );

  sheet
    .getRange(
      'A6:A13',
    )
    .setBackground(
      '#f3f6f9',
    )
    .setFontWeight(
      'bold',
    );

  sheet
    .getRange(
      'A6:B13',
    )
    .setBorder(
      true,
      true,
      true,
      true,
      true,
      true,
    )
    .setVerticalAlignment(
      'top',
    );

  sheet
    .getRange(
      'A16:C22',
    )
    .setBorder(
      true,
      true,
      true,
      true,
      true,
      true,
    )
    .setVerticalAlignment(
      'top',
    );

  sheet
    .getRange(
      'A25:G100',
    )
    .setVerticalAlignment(
      'top',
    )
    .setWrap(
      true,
    );

  sheet
    .getRange(
      'A24:G24',
    )
    .setHorizontalAlignment(
      'center',
    );

  sheet
    .getRange(
      'B24:D100',
    )
    .setHorizontalAlignment(
      'center',
    );

  setColumnWidths(
    sheet,
    [
      180,
      260,
      100,
      110,
      320,
      320,
      320,
    ],
  );

  sheet
    .getRange(
      'E:G',
    )
    .setWrap(
      true,
    );

  applyAiEvaluationConditionalFormatting(
    sheet,
  );

  styleEvaluationSummaryArea(
    sheet,
  );

  try {
    sheet.hideColumns(
      10,
      2,
    );
  } catch {
    // 既に非表示なら無視
  }
}

function styleEvaluationSummaryArea(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): void {
  const lastRow =
    sheet.getLastRow();

  if (
    lastRow < 25
  ) {
    return;
  }

  const values =
    sheet
      .getRange(
        25,
        1,
        lastRow - 24,
        2,
      )
      .getValues();

  const summaryLabels =
    new Set([
      '加重平均',
      '評価ばらつき',
      '根拠十分度平均',
      '評価済み件数',
      '評価保留件数',
      '強み',
      '懸念点',
      '総評',
      '要確認事項',
    ]);

  for (
    let index = 0;
    index < values.length;
    index++
  ) {
    const label =
      String(
        values[index]?.[0] ?? '',
      ).trim();

    if (
      !summaryLabels.has(
        label,
      )
    ) {
      continue;
    }

    const row =
      index + 25;

    sheet
      .getRange(
        row,
        1,
        1,
        2,
      )
      .setBorder(
        true,
        true,
        true,
        true,
        true,
        true,
      )
      .setVerticalAlignment(
        'top',
      )
      .setWrap(
        true,
      );

    sheet
      .getRange(
        row,
        1,
      )
      .setFontWeight(
        'bold',
      );

    if (
      label ===
      '強み'
    ) {
      sheet
        .getRange(
          row,
          1,
          1,
          2,
        )
        .setBackground(
          '#e2f0d9',
        );
    } else if (
      label ===
      '懸念点'
    ) {
      sheet
        .getRange(
          row,
          1,
          1,
          2,
        )
        .setBackground(
          '#fce8e6',
        );
    } else if (
      label ===
      '総評'
    ) {
      sheet
        .getRange(
          row,
          1,
          1,
          2,
        )
        .setBackground(
          '#fff2cc',
        );
    } else if (
      label ===
      '要確認事項'
    ) {
      sheet
        .getRange(
          row,
          1,
          1,
          2,
        )
        .setBackground(
          '#fde9d9',
        );
    } else {
      sheet
        .getRange(
          row,
          1,
          1,
          2,
        )
        .setBackground(
          '#f3f6f9',
        );
    }
  }
}

function applyAiEvaluationConditionalFormatting(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): void {
  const rules =
    sheet
      .getConditionalFormatRules()
      .filter(
        (
          rule:
            GoogleAppsScript
              .Spreadsheet
              .ConditionalFormatRule,
        ): boolean => {
          const ranges =
            rule.getRanges();

          return !ranges.some(
            (
              range:
                GoogleAppsScript
                  .Spreadsheet
                  .Range,
            ): boolean => {
              const a1 =
                range.getA1Notation();

              return (
                a1 ===
                  'B25:B100' ||
                a1 ===
                  'C25:C100' ||
                a1 ===
                  'D25:D100'
              );
            },
          );
        },
      );

  const statusRange =
    sheet.getRange(
      'B25:B100',
    );

  const scoreRange =
    sheet.getRange(
      'C25:C100',
    );

  const evidenceRange =
    sheet.getRange(
      'D25:D100',
    );

  rules.push(
    SpreadsheetApp
      .newConditionalFormatRule()
      .whenTextEqualTo(
        '評価保留',
      )
      .setBackground(
        '#fce8e6',
      )
      .setFontColor(
        '#b31412',
      )
      .setBold(
        true,
      )
      .setRanges([
        statusRange,
      ])
      .build(),
  );

  rules.push(
    SpreadsheetApp
      .newConditionalFormatRule()
      .whenNumberGreaterThanOrEqualTo(
        4,
      )
      .setBackground(
        '#e2f0d9',
      )
      .setFontColor(
        '#274e13',
      )
      .setBold(
        true,
      )
      .setRanges([
        scoreRange,
      ])
      .build(),
  );

  rules.push(
    SpreadsheetApp
      .newConditionalFormatRule()
      .whenNumberLessThanOrEqualTo(
        2,
      )
      .setBackground(
        '#fce8e6',
      )
      .setFontColor(
        '#b31412',
      )
      .setBold(
        true,
      )
      .setRanges([
        scoreRange,
      ])
      .build(),
  );

  rules.push(
    SpreadsheetApp
      .newConditionalFormatRule()
      .whenNumberLessThanOrEqualTo(
        2,
      )
      .setBackground(
        '#fff2cc',
      )
      .setFontColor(
        '#7f6000',
      )
      .setBold(
        true,
      )
      .setRanges([
        evidenceRange,
      ])
      .build(),
  );

  sheet
    .setConditionalFormatRules(
      rules,
    );
}

function formatDepartmentComparisonSheet(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): void {
  applyTableBase(
    sheet,
  );

  sheet.setHiddenGridlines(
    true,
  );

  setColumnWidths(
    sheet,
    [
      120,
      110,
      110,
      130,
      110,
      110,
      300,
      300,
      380,
    ],
  );

  wrapColumns(
    sheet,
    [
      7,
      8,
      9,
    ],
  );

  sheet
    .getRange(
      'A:A',
    )
    .setFontWeight(
      'bold',
    );

  sheet
    .getRange(
      'B:F',
    )
    .setHorizontalAlignment(
      'center',
    );

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow > 1
  ) {
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        9,
      )
      .setBorder(
        true,
        true,
        true,
        true,
        true,
        true,
      );

    for (
      let row = 2;
      row <= lastRow;
      row++
    ) {
      sheet.setRowHeight(
        row,
        72,
      );
    }
  }

  applyDepartmentComparisonConditionalFormatting(
    sheet,
  );
}

function applyDepartmentComparisonConditionalFormatting(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): void {
  const rules =
    sheet.getConditionalFormatRules();

  const averageRange =
    sheet.getRange(
      'B2:B100',
    );

  rules.push(
    SpreadsheetApp
      .newConditionalFormatRule()
      .whenNumberGreaterThanOrEqualTo(
        4,
      )
      .setBackground(
        '#e2f0d9',
      )
      .setBold(
        true,
      )
      .setRanges([
        averageRange,
      ])
      .build(),
  );

  rules.push(
    SpreadsheetApp
      .newConditionalFormatRule()
      .whenNumberLessThanOrEqualTo(
        2.5,
      )
      .setBackground(
        '#fce8e6',
      )
      .setBold(
        true,
      )
      .setRanges([
        averageRange,
      ])
      .build(),
  );

  sheet.setConditionalFormatRules(
    rules,
  );
}

function formatAiHistorySheet(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): void {
  applyTableBase(
    sheet,
  );

  const headers =
    getHeaders(
      sheet,
    );

  headers.forEach(
    (
      header: string,
      index: number,
    ): void => {
      const column =
        index + 1;

      if (
        header ===
        '評価結果JSON'
      ) {
        sheet.setColumnWidth(
          column,
          420,
        );

        sheet
          .getRange(
            1,
            column,
            sheet.getMaxRows(),
            1,
          )
          .setWrap(
            true,
          );

        return;
      }

      sheet.autoResizeColumn(
        column,
      );

      limitColumnWidth(
        sheet,
        column,
        100,
        240,
      );
    },
  );

  applyDateFormatByHeader(
    sheet,
    [
      '評価日時',
    ],
  );
}

function formatErrorLogSheet(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): void {
  applyTableBase(
    sheet,
  );

  autoResizeWithLimits(
    sheet,
    100,
    320,
  );

  const headers =
    getHeaders(
      sheet,
    );

  headers.forEach(
    (
      header: string,
      index: number,
    ): void => {
      if (
        header.includes(
          'エラー',
        ) ||
        header.includes(
          'メッセージ',
        ) ||
        header.includes(
          '詳細',
        )
      ) {
        const column =
          index + 1;

        sheet.setColumnWidth(
          column,
          420,
        );

        sheet
          .getRange(
            1,
            column,
            sheet.getMaxRows(),
            1,
          )
          .setWrap(
            true,
          );
      }
    },
  );

  applyDateFormatByHeader(
    sheet,
    [
      '日時',
      'タイムスタンプ',
    ],
  );
}

function formatApplicantListSheet(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): void {
  applyTableBase(
    sheet,
  );

  sheet.setHiddenGridlines(
    true,
  );

  sheet.setFrozenRows(
    1,
  );

  const headers =
    getHeaders(
      sheet,
    );

  const lastRow =
    Math.max(
      sheet.getLastRow(),
      1,
    );

  const importantWidths:
    Record<string, number> = {
      氏名:
        150,

      面接ステータス:
        130,

      メールアドレス:
        220,

      電話番号:
        150,

      最終学歴:
        220,

      直近の職歴:
        240,

      保有資格:
        220,

      自己PR要約:
        300,

      履歴書リンク:
        140,

      タイムスタンプ:
        170,
    };

  const wrapHeaders =
    new Set([
      '最終学歴',
      '直近の職歴',
      '保有資格',
      '自己PR要約',
      '学歴サマリー',
      '職歴サマリー',
      '特記事項',
    ]);

  const centerHeaders =
    new Set([
      '年齢',
      '性別',
      '面接ステータス',
    ]);

  headers.forEach(
    (
      header: string,
      index: number,
    ): void => {
      const column =
        index + 1;

      const configuredWidth =
        importantWidths[
          header
        ];

      if (
        configuredWidth
      ) {
        sheet.setColumnWidth(
          column,
          configuredWidth,
        );
      } else {
        sheet.autoResizeColumn(
          column,
        );

        limitColumnWidth(
          sheet,
          column,
          100,
          240,
        );
      }

      if (
        wrapHeaders.has(
          header,
        )
      ) {
        sheet
          .getRange(
            1,
            column,
            sheet.getMaxRows(),
            1,
          )
          .setWrap(
            true,
          )
          .setVerticalAlignment(
            'top',
          );
      }

      if (
        centerHeaders.has(
          header,
        ) &&
        lastRow > 1
      ) {
        sheet
          .getRange(
            2,
            column,
            lastRow - 1,
            1,
          )
          .setHorizontalAlignment(
            'center',
          );
      }
    },
  );

  /*
   * ヘッダーを少し強めにする
   */
  if (
    headers.length > 0
  ) {
    sheet
      .getRange(
        1,
        1,
        1,
        headers.length,
      )
      .setBackground(
        '#1f4e78',
      )
      .setFontColor(
        '#ffffff',
      )
      .setFontWeight(
        'bold',
      )
      .setHorizontalAlignment(
        'center',
      )
      .setVerticalAlignment(
        'middle',
      );

    sheet.setRowHeight(
      1,
      36,
    );
  }

  /*
   * 本文
   */
  if (
    lastRow > 1 &&
    headers.length > 0
  ) {
    const body =
      sheet.getRange(
        2,
        1,
        lastRow - 1,
        headers.length,
      );

    body
      .setVerticalAlignment(
        'top',
      )
      .setWrap(
        true,
      );

    /*
     * 1行ごとの高さを少し広げる
     */
    for (
      let row = 2;
      row <= lastRow;
      row++
    ) {
      sheet.setRowHeight(
        row,
        48,
      );
    }

    /*
     * 軽い罫線
     */
    body.setBorder(
      true,
      true,
      true,
      true,
      true,
      true,
      '#d9e2f3',
      SpreadsheetApp.BorderStyle.SOLID,
    );
  }

  /*
   * 氏名を強調
   */
  const nameIndex =
    headers.indexOf(
      '氏名',
    );

  if (
    nameIndex >= 0 &&
    lastRow > 1
  ) {
    sheet
      .getRange(
        2,
        nameIndex + 1,
        lastRow - 1,
        1,
      )
      .setFontWeight(
        'bold',
      )
      .setFontSize(
        11,
      );
  }

  /*
   * 日時
   */
  applyDateFormatByHeader(
    sheet,
    [
      'タイムスタンプ',
    ],
  );

  /*
   * ステータス色分け
   */
  styleApplicantStatuses(
    sheet,
  );

  /*
   * 履歴書リンク列を見やすく
   */
  const linkIndex =
    headers.indexOf(
      '履歴書リンク',
    );

  if (
    linkIndex >= 0 &&
    lastRow > 1
  ) {
    sheet
      .getRange(
        2,
        linkIndex + 1,
        lastRow - 1,
        1,
      )
      .setHorizontalAlignment(
        'center',
      );
  }

  /*
   * フィルタ
   */
  if (
    headers.length > 0 &&
    !sheet.getFilter()
  ) {
    sheet
      .getRange(
        1,
        1,
        Math.max(
          lastRow,
          2,
        ),
        headers.length,
      )
      .createFilter();
  }

  SpreadsheetApp.flush();
}

function styleApplicantStatuses(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): void {
  const headers =
    getHeaders(
      sheet,
    );

  const statusIndex =
    headers.indexOf(
      '面接ステータス',
    );

  if (
    statusIndex === -1
  ) {
    return;
  }

  const range =
    sheet.getRange(
      2,
      statusIndex + 1,
      Math.max(
        sheet.getMaxRows() - 1,
        1,
      ),
      1,
    );

  const existingRules =
    sheet
      .getConditionalFormatRules()
      .filter(
        (
          rule:
            GoogleAppsScript
              .Spreadsheet
              .ConditionalFormatRule,
        ): boolean =>
          !rule
            .getRanges()
            .some(
              (
                item:
                  GoogleAppsScript
                    .Spreadsheet
                    .Range,
              ): boolean =>
                item.getColumn() ===
                  statusIndex + 1,
            ),
      );

  existingRules.push(
    SpreadsheetApp
      .newConditionalFormatRule()
      .whenTextContains(
        '通過',
      )
      .setBackground(
        '#e2f0d9',
      )
      .setFontColor(
        '#274e13',
      )
      .setBold(
        true,
      )
      .setRanges([
        range,
      ])
      .build(),
  );

  existingRules.push(
    SpreadsheetApp
      .newConditionalFormatRule()
      .whenTextContains(
        '選考中',
      )
      .setBackground(
        '#d9eaf7',
      )
      .setFontColor(
        '#1f4e78',
      )
      .setBold(
        true,
      )
      .setRanges([
        range,
      ])
      .build(),
  );

  existingRules.push(
    SpreadsheetApp
      .newConditionalFormatRule()
      .whenTextContains(
        '保留',
      )
      .setBackground(
        '#fff2cc',
      )
      .setFontColor(
        '#7f6000',
      )
      .setBold(
        true,
      )
      .setRanges([
        range,
      ])
      .build(),
  );

  existingRules.push(
    SpreadsheetApp
      .newConditionalFormatRule()
      .whenTextContains(
        '不合格',
      )
      .setBackground(
        '#fce8e6',
      )
      .setFontColor(
        '#b31412',
      )
      .setBold(
        true,
      )
      .setRanges([
        range,
      ])
      .build(),
  );

  sheet
    .setConditionalFormatRules(
      existingRules,
    );
}

function applyTableBase(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): void {
  const lastRow =
    Math.max(
      sheet.getLastRow(),
      1,
    );

  const lastColumn =
    Math.max(
      sheet.getLastColumn(),
      1,
    );

  sheet.setFrozenRows(
    1,
  );

  sheet
    .getRange(
      1,
      1,
      1,
      lastColumn,
    )
    .setBackground(
      '#4a86e8',
    )
    .setFontColor(
      '#ffffff',
    )
    .setFontWeight(
      'bold',
    )
    .setHorizontalAlignment(
      'center',
    )
    .setVerticalAlignment(
      'middle',
    )
    .setWrap(
      true,
    );

  sheet.setRowHeight(
    1,
    34,
  );

  if (
    lastRow > 1
  ) {
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        lastColumn,
      )
      .setVerticalAlignment(
        'top',
      );
  }
}

function styleSectionHeader(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
  rangeA1: string,
  title: string,
): void {
  const range =
    sheet.getRange(
      rangeA1,
    );

  const values =
    range.getValues();

  if (
    values.length > 0 &&
    values[0] &&
    values[0].length > 0
  ) {
    values[0][0] =
      title;

    range.setValues(
      values,
    );
  }

  range
    .setBackground(
      '#4a86e8',
    )
    .setFontColor(
      '#ffffff',
    )
    .setFontWeight(
      'bold',
    )
    .setVerticalAlignment(
      'middle',
    );
}

function getHeaders(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): string[] {
  const lastColumn =
    sheet.getLastColumn();

  if (
    lastColumn <= 0
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

  if (
    !values
  ) {
    return [];
  }

  return values.map(
    (
      value: unknown,
    ): string =>
      String(
        value ?? '',
      ).trim(),
  );
}

function setColumnWidths(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
  widths: number[],
): void {
  widths.forEach(
    (
      width: number,
      index: number,
    ): void => {
      sheet.setColumnWidth(
        index + 1,
        width,
      );
    },
  );
}

function wrapColumns(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
  columns: number[],
): void {
  const rows =
    Math.max(
      sheet.getMaxRows(),
      1,
    );

  for (
    const column
    of columns
  ) {
    sheet
      .getRange(
        1,
        column,
        rows,
        1,
      )
      .setWrap(
        true,
      )
      .setVerticalAlignment(
        'top',
      );
  }
}

function wrapAllBody(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
): void {
  const lastRow =
    sheet.getLastRow();

  const lastColumn =
    sheet.getLastColumn();

  if (
    lastRow <= 1 ||
    lastColumn <= 0
  ) {
    return;
  }

  sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      lastColumn,
    )
    .setWrap(
      true,
    )
    .setVerticalAlignment(
      'top',
    );
}

function autoResizeWithLimits(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
  minimum: number,
  maximum: number,
): void {
  const lastColumn =
    sheet.getLastColumn();

  for (
    let column = 1;
    column <= lastColumn;
    column++
  ) {
    sheet.autoResizeColumn(
      column,
    );

    limitColumnWidth(
      sheet,
      column,
      minimum,
      maximum,
    );
  }
}

function limitColumnWidth(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
  column: number,
  minimum: number,
  maximum: number,
): void {
  const width =
    sheet.getColumnWidth(
      column,
    );

  if (
    width < minimum
  ) {
    sheet.setColumnWidth(
      column,
      minimum,
    );

    return;
  }

  if (
    width > maximum
  ) {
    sheet.setColumnWidth(
      column,
      maximum,
    );
  }
}

function applyDateFormatByHeader(
  sheet:
    GoogleAppsScript.Spreadsheet.Sheet,
  headerNames: string[],
): void {
  const headers =
    getHeaders(
      sheet,
    );

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow <= 1
  ) {
    return;
  }

  for (
    const headerName
    of headerNames
  ) {
    const index =
      headers.indexOf(
        headerName,
      );

    if (
      index === -1
    ) {
      continue;
    }

    sheet
      .getRange(
        2,
        index + 1,
        lastRow - 1,
        1,
      )
      .setNumberFormat(
        'yyyy/MM/dd HH:mm:ss',
      );
  }
}