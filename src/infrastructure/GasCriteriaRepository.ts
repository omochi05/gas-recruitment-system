import type{
  DepartmentCriteria,
  EvaluationCriterion,
} from '../domain/Criteria';

import type {
  CriteriaRepository,
} from './CriteriaRepository';

export class GasCriteriaRepository
  implements CriteriaRepository {

  constructor(
    private readonly spreadsheetId: string,
    private readonly sheetName: string,
  ) {}

  findAll(): DepartmentCriteria[] {
    const sheet = this.getSheet();
    const values =
      sheet.getDataRange().getValues();

    if (values.length < 2) {
      return [];
    }

    const rows = values.slice(1);

    const grouped =
      new Map<string, EvaluationCriterion[]>();

    rows.forEach((row) => {
      const departmentId =
        String(row[0] ?? '').trim();

      const criterionName =
        String(row[1] ?? '').trim();

      const weight =
        Number(row[2] ?? 0);

      const description =
        String(row[3] ?? '').trim();

      if (!departmentId || !criterionName) {
        return;
      }

      const criterion: EvaluationCriterion = {
        id:
          `${departmentId}-${criterionName}`,
        name: criterionName,
        description,
        weight,
      };

      const current =
        grouped.get(departmentId) ?? [];

      current.push(criterion);

      grouped.set(
        departmentId,
        current,
      );
    });

    return Array.from(
      grouped.entries(),
    ).map(
      ([departmentId, criteria]) => ({
        departmentId,
        departmentName: departmentId,
        criteria,
      }),
    );
  }

  findByDepartment(
    departmentId: string,
  ): DepartmentCriteria {

    const department =
      this.findAll().find(
        (item) =>
          item.departmentId ===
          departmentId,
      );

    if (!department) {
      throw new Error(
        `評価基準が見つかりません: ${departmentId}`,
      );
    }

    return department;
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
        `評価基準シートが見つかりません: ${this.sheetName}`,
      );
    }

    return sheet;
  }
}