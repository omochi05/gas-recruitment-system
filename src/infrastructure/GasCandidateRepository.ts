import type { Candidate } from '../domain/Candidate';
import type { CandidateRepository } from './CandidateRepository';

export class GasCandidateRepository
  implements CandidateRepository
{
  constructor(
    private readonly spreadsheetId: string,
    private readonly sheetName: string,
  ) {}

  findAll(): Candidate[] {
    const sheet = this.getSheet();
    const values =
      sheet.getDataRange().getValues();

    if (values.length < 2) {
      return [];
    }

    const headerRow = values[0];

    if (!headerRow) {
      return [];
    }

    const headers = headerRow.map(
      (value: unknown): string =>
        String(value).trim(),
    );

    return values
      .slice(1)
      .map(
        (row: unknown[]): Candidate =>
          this.toCandidate(
            headers,
            row,
          ),
      )
      .filter(
        (candidate: Candidate): boolean =>
          candidate.name !== '',
      );
  }

  findByKey(
    candidateKey: string,
  ): Candidate {
    const rowNumber =
      Number(candidateKey);

    if (
      Number.isInteger(rowNumber) &&
      rowNumber >= 2
    ) {
      return this.findByRowNumber(
        rowNumber,
      );
    }

    const candidates =
      this.findAll();

    const candidate =
      candidates.find(
        (item: Candidate): boolean =>
          item.candidateKey ===
          candidateKey,
      );

    if (candidate) {
      return candidate;
    }

    return this.findByDisplayValue(
      candidateKey,
    );
  }

  private findByRowNumber(
    rowNumber: number,
  ): Candidate {
    const sheet =
      this.getSheet();

    const lastRow =
      sheet.getLastRow();

    const lastColumn =
      sheet.getLastColumn();

    if (
      rowNumber < 2 ||
      rowNumber > lastRow
    ) {
      throw new Error(
        `応募者の行番号が不正です: ${rowNumber}`,
      );
    }

    const headerValues =
      sheet
        .getRange(
          1,
          1,
          1,
          lastColumn,
        )
        .getValues()[0];

    if (!headerValues) {
      throw new Error(
        '応募者一覧のヘッダーを取得できません。',
      );
    }

    const rowValues =
      sheet
        .getRange(
          rowNumber,
          1,
          1,
          lastColumn,
        )
        .getValues()[0];

    if (!rowValues) {
      throw new Error(
        `応募者データを取得できません: ${rowNumber}`,
      );
    }

    const headers =
      headerValues.map(
        (value: unknown): string =>
          String(value).trim(),
      );

    const candidate =
      this.toCandidate(
        headers,
        rowValues,
      );

    if (!candidate.name) {
      throw new Error(
        `応募者データが不正です: ${rowNumber}`,
      );
    }

    return {
      ...candidate,
      candidateKey:
        candidate.candidateKey ||
        String(rowNumber),
    };
  }

  private findByDisplayValue(
    displayValue: string,
  ): Candidate {
    const sheet =
      this.getSheet();

    const values =
      sheet
        .getDataRange()
        .getDisplayValues();

    if (values.length < 2) {
      throw new Error(
        '応募者一覧にデータがありません。',
      );
    }

    const headerRow =
      values[0];

    if (!headerRow) {
      throw new Error(
        '応募者一覧のヘッダーを取得できません。',
      );
    }

    const searchValues =
      displayValue
        .split('｜')
        .map(
          (value: string): string =>
            value.trim(),
        )
        .filter(
          (value: string): boolean =>
            value !== '',
        );

    if (searchValues.length === 0) {
      throw new Error(
        '応募者の識別値が不正です。',
      );
    }

    const rowIndex =
      values.findIndex(
        (
          row: string[],
          index: number,
        ): boolean => {
          if (index === 0) {
            return false;
          }

          const normalizedRow =
            row.map(
              (cell: string): string =>
                cell.trim(),
            );

          return searchValues.every(
            (searchValue: string): boolean =>
              normalizedRow.includes(
                searchValue,
              ),
          );
        },
      );

    if (rowIndex === -1) {
      throw new Error(
        `応募者が見つかりません: ${displayValue}`,
      );
    }

    const row =
      values[rowIndex];

    if (!row) {
      throw new Error(
        '応募者データを取得できません。',
      );
    }

    const headers =
      headerRow.map(
        (value: string): string =>
          value.trim(),
      );

    const candidate =
      this.toCandidate(
        headers,
        row,
      );

    if (!candidate.name) {
      throw new Error(
        `応募者データが不正です: ${displayValue}`,
      );
    }

    return {
      ...candidate,
      candidateKey:
        candidate.candidateKey ||
        String(rowIndex + 1),
    };
  }

  private getSheet():
    GoogleAppsScript.Spreadsheet.Sheet {
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
        `シートが見つかりません: ${this.sheetName}`,
      );
    }

    return sheet;
  }

  private toCandidate(
    headers: string[],
    row: unknown[],
  ): Candidate {
    const data:
      Record<string, unknown> = {};

    headers.forEach(
      (
        header: string,
        index: number,
      ): void => {
        data[header] =
          row[index];
      },
    );

    return {
      candidateKey:
        this.toString(
          data['candidateKey'],
        ),

      name:
        this.toString(
          data['氏名'] ??
          data['名前'],
        ),

      education:
        this.toString(
          data['最終学歴'],
        ),

      careerSummary:
        this.toString(
          data['職歴サマリー'],
        ),

      qualifications:
        this.toString(
          data['保有資格'],
        ),

      selfPr:
        this.toString(
          data['自己PR要約'],
        ),

      motivation:
        this.toString(
          data['志望動機'],
        ),

      technicalExperience:
        this.toString(
          data['技術経験'],
        ),

      teamExperience:
        this.toString(
          data['チーム経験'],
        ),
    };
  }

  private toString(
    value: unknown,
  ): string {
    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    return String(value).trim();
  }
}