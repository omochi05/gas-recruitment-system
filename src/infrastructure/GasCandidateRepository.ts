import type { Candidate } from '../domain/Candidate';
import type { CandidateRepository } from './CandidateRepository';

export class GasCandidateRepository implements CandidateRepository {
  constructor(
    private readonly spreadsheetId: string,
    private readonly sheetName: string,
  ) {}

  findAll(): Candidate[] {
    const sheet = this.getSheet();
    const values = sheet.getDataRange().getValues();

    // ヘッダー + データ行が存在しない場合
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
          this.toCandidate(headers, row),
      )
      .filter(
        (candidate: Candidate): boolean =>
          candidate.name !== '',
      );
  }

  findByKey(candidateKey: string): Candidate {
    const candidate = this.findAll().find(
      (item: Candidate): boolean =>
        item.candidateKey === candidateKey,
    );

    if (!candidate) {
      throw new Error(
        `応募者が見つかりません: ${candidateKey}`,
      );
    }

    return candidate;
  }

  private getSheet(): GoogleAppsScript.Spreadsheet.Sheet {
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
    const data: Record<string, unknown> = {};

    headers.forEach(
      (header: string, index: number): void => {
        data[header] = row[index];
      },
    );

    return {
      candidateKey: this.toString(
        data['candidateKey'],
      ),

      name: this.toString(
        data['氏名'],
      ),

      education: this.toString(
        data['最終学歴'],
      ),

      careerSummary: this.toString(
        data['職歴サマリー'],
      ),

      qualifications: this.toString(
        data['保有資格'],
      ),

      selfPr: this.toString(
        data['自己PR要約'],
      ),

      motivation: this.toString(
        data['志望動機'],
      ),

      technicalExperience: this.toString(
        data['技術経験'],
      ),

      teamExperience: this.toString(
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