import type { EvaluationResult } from '../domain/Evaluation';
import type { EvaluationHistoryRepository } from './EvaluationHistoryRepository';

export class GasEvaluationHistoryRepository
  implements EvaluationHistoryRepository
{
  constructor(
    private readonly spreadsheetId: string,
    private readonly sheetName: string,
  ) {}

  save(result: EvaluationResult): string {
    const sheet = this.getSheet();

    const evaluationId = Utilities.getUuid();
    const evaluatedAt = new Date();

    const json = JSON.stringify(result);

    sheet.appendRow([
      evaluationId,
      evaluatedAt,
      result.candidateKey,
      result.departmentId,
      json,
    ]);

    return evaluationId;
  }

  findLatest(
    candidateKey: string,
    departmentId: string,
  ): EvaluationResult | null {
    const sheet = this.getSheet();
    const values = sheet.getDataRange().getValues();

    if (values.length < 2) {
      return null;
    }

    const rows = values.slice(1);

    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];

      if (!row) {
        continue;
      }

      const storedCandidateKey = String(
        row[2] ?? '',
      ).trim();

      const storedDepartmentId = String(
        row[3] ?? '',
      ).trim();

      if (
        storedCandidateKey !== candidateKey ||
        storedDepartmentId !== departmentId
      ) {
        continue;
      }

      const json = String(
        row[4] ?? '',
      ).trim();

      if (!json) {
        return null;
      }

      return this.parseEvaluationResult(json);
    }

    return null;
  }

  private getSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const spreadsheet =
      SpreadsheetApp.openById(
        this.spreadsheetId,
      );

    let sheet =
      spreadsheet.getSheetByName(
        this.sheetName,
      );

    if (!sheet) {
      sheet =
        spreadsheet.insertSheet(
          this.sheetName,
        );

      this.initializeSheet(sheet);
    }

    return sheet;
  }

  private initializeSheet(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
  ): void {
    const headers = [
      '評価ID',
      '評価日時',
      '候補者キー',
      '部門ID',
      '評価結果JSON',
    ];

    sheet
      .getRange(
        1,
        1,
        1,
        headers.length,
      )
      .setValues([headers]);

    sheet.setFrozenRows(1);
  }

  private parseEvaluationResult(
    json: string,
  ): EvaluationResult {
    let parsed: unknown;

    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error(
        'AI評価履歴のJSON解析に失敗しました。',
      );
    }

    if (!this.isEvaluationResult(parsed)) {
      throw new Error(
        'AI評価履歴のデータ形式が不正です。',
      );
    }

    return parsed;
  }

  private isEvaluationResult(
    value: unknown,
  ): value is EvaluationResult {
    if (
      typeof value !== 'object' ||
      value === null
    ) {
      return false;
    }

    const result =
      value as Partial<EvaluationResult>;

    return (
      typeof result.candidateKey === 'string' &&
      typeof result.departmentId === 'string' &&
      Array.isArray(result.evaluations) &&
      Array.isArray(result.strengths) &&
      Array.isArray(result.concerns) &&
      Array.isArray(result.reviewPoints)
    );
  }
}