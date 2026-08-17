export interface EvaluationInput {
  candidateKey: string;
  departmentId: string;
}

export class SpreadsheetEvaluationInputReader {
  constructor(
    private readonly spreadsheetId: string,
    private readonly sheetName: string,
  ) {}

  read(): EvaluationInput {
    const spreadsheet =
      SpreadsheetApp.openById(
        this.spreadsheetId,
      );

    const sheet =
      spreadsheet.getSheetByName(
        this.sheetName,
      );

    if (!sheet) {
      throw new Error(
        `AI評価シートが見つかりません: ${this.sheetName}`,
      );
    }

    const candidateKey = String(
      sheet.getRange('B2').getValue() ?? '',
    ).trim();

    const departmentId = String(
      sheet.getRange('B3').getValue() ?? '',
    ).trim();

    if (!candidateKey) {
      throw new Error(
        '応募者を選択してください。',
      );
    }

    if (!departmentId) {
      throw new Error(
        '評価部門を選択してください。',
      );
    }

    return {
      candidateKey,
      departmentId,
    };
  }
}