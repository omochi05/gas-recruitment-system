export class SpreadsheetCandidateSelectionSync {
  constructor(
    private readonly spreadsheetId: string,
    private readonly evaluationSheetName: string,
    private readonly candidateSheetName: string,
  ) {}

  sync(): void {
    const spreadsheet =
      SpreadsheetApp.openById(
        this.spreadsheetId,
      );

    const evaluationSheet =
      spreadsheet.getSheetByName(
        this.evaluationSheetName,
      );

    if (!evaluationSheet) {
      throw new Error(
        `AI評価シートが見つかりません: ${this.evaluationSheetName}`,
      );
    }

    const candidateSheet =
      spreadsheet.getSheetByName(
        this.candidateSheetName,
      );

    if (!candidateSheet) {
      throw new Error(
        `応募者一覧シートが見つかりません: ${this.candidateSheetName}`,
      );
    }

    const displayValue =
      String(
        evaluationSheet
          .getRange('B2')
          .getValue() ?? '',
      ).trim();

    if (!displayValue) {
      throw new Error(
        '応募者を選択してください。',
      );
    }

    const parts =
      displayValue
        .split('｜')
        .map(
          (value: string): string =>
            value.trim(),
        );

    const name =
      parts[0] ?? '';

    if (!name) {
      throw new Error(
        '応募者名を取得できません。',
      );
    }

    const lastRow =
      candidateSheet.getLastRow();

    if (lastRow < 2) {
      throw new Error(
        '応募者一覧にデータがありません。',
      );
    }

    const names =
      candidateSheet
        .getRange(
          2,
          1,
          lastRow - 1,
          1,
        )
        .getDisplayValues();

    const index =
      names.findIndex(
        (row: string[]): boolean =>
          String(row[0] ?? '').trim() ===
          name,
      );

    if (index === -1) {
      throw new Error(
        `応募者が見つかりません: ${name}`,
      );
    }

    const actualRow =
      index + 2;

    evaluationSheet
      .getRange('C2')
      .setValue(
        String(actualRow),
      );
  }
}