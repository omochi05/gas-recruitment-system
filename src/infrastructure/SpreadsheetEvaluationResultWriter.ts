import type {
  EvaluationResult,
} from '../domain/Evaluation';

import {
  SpreadsheetSanitizer,
} from '../security/SpreadsheetSanitizer';

export class SpreadsheetEvaluationResultWriter {
  constructor(
    private readonly spreadsheetId: string,
    private readonly sheetName: string,
    private readonly sanitizer:
      SpreadsheetSanitizer,
  ) {}

  write(
    result: EvaluationResult,
  ): void {
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

    const strengths =
      result.strengths.join('\n');

    const concerns =
      result.concerns.join('\n');

    const reviewPoints =
      result.reviewPoints.join('\n');

    sheet.getRange('B5').setValue(
      this.sanitizer.sanitize(
        strengths,
      ),
    );

    sheet.getRange('B6').setValue(
      this.sanitizer.sanitize(
        concerns,
      ),
    );

    sheet.getRange('B7').setValue(
      this.sanitizer.sanitize(
        reviewPoints,
      ),
    );
  }
}