import type {
  ResumeImportRecord,
  ResumeSource,
} from '../domain/Resume';

import type {
  ResumeCandidateRepository,
} from './ResumeRepositories';

import {
  ResumeConfig,
} from '../gas/config';

export class GasResumeCandidateRepository
  implements ResumeCandidateRepository
{
  constructor(
    private readonly spreadsheetId: string,
  ) {}

  save(
    candidate: ResumeImportRecord,
    processStatus: string,
    processMessage: string,
  ): void {
    const sheet =
      this.getOrCreateInterviewerSheet();

    const headers =
      this.getHeaders(
        sheet,
      );

    if (
      headers.length === 0
    ) {
      throw new Error(
        '面接官シートのヘッダーを取得できません。',
      );
    }

    const row =
      headers.map(
        (
          header: string,
        ): unknown =>
          this.resolveValue(
            header,
            candidate,
            processStatus,
            processMessage,
          ),
      );

    sheet.appendRow(
      row,
    );

    this.formatInterviewerSheet(
      sheet,
    );
  }

  saveError(
    source: ResumeSource,
    message: string,
  ): void {
    /*
     * エラーデータは採用担当者が参照する
     * 面接官シートには保存しない。
     *
     * エラー詳細は
     * GasImportLogRepository 側で記録する。
     */
    console.error(
      [
        '[ResumeImportError]',
        `fileId=${source.fileId}`,
        `fileName=${source.fileName}`,
        `message=${message}`,
      ].join(
        ' / ',
      ),
    );
  }

  isDuplicate(
    candidate: ResumeImportRecord,
  ): boolean {
    const sheet =
      this.getOrCreateInterviewerSheet();

    const values =
      sheet
        .getDataRange()
        .getValues();

    if (
      values.length < 2
    ) {
      return false;
    }

    const headers =
      values[0]
        ?.map(
          (
            value: unknown,
          ): string =>
            String(
              value,
            ).trim(),
        ) ?? [];

    const nameIndex =
      headers.indexOf(
        '氏名',
      );

    const emailIndex =
      headers.indexOf(
        'メールアドレス',
      );

    const phoneIndex =
      headers.indexOf(
        '電話番号',
      );

    const processStatusIndex =
      headers.indexOf(
        '処理ステータス',
      );

    if (
      nameIndex === -1
    ) {
      return false;
    }

    const name =
      this.normalizeName(
        candidate.name,
      );

    const email =
      this.normalizeEmail(
        candidate.email,
      );

    const phone =
      this.normalizePhone(
        candidate.phone,
      );

    if (
      !name
    ) {
      return false;
    }

    return values
      .slice(
        1,
      )
      .some(
        (
          row: unknown[],
        ): boolean => {
          /*
           * 過去のエラー行が残っている場合は
           * 重複判定の対象外にする。
           */
          if (
            processStatusIndex >= 0
          ) {
            const processStatus =
              String(
                row[
                  processStatusIndex
                ] ?? '',
              ).trim();

            if (
              processStatus ===
              'エラー'
            ) {
              return false;
            }
          }

          const storedName =
            this.normalizeName(
              row[
                nameIndex
              ],
            );

          if (
            storedName !==
            name
          ) {
            return false;
          }

          const storedEmail =
            emailIndex >= 0
              ? this.normalizeEmail(
                  row[
                    emailIndex
                  ],
                )
              : '';

          const storedPhone =
            phoneIndex >= 0
              ? this.normalizePhone(
                  row[
                    phoneIndex
                  ],
                )
              : '';

          const sameEmail =
            Boolean(
              email,
            ) &&
            Boolean(
              storedEmail,
            ) &&
            email ===
              storedEmail;

          const samePhone =
            Boolean(
              phone,
            ) &&
            Boolean(
              storedPhone,
            ) &&
            phone ===
              storedPhone;

          /*
           * 同姓同名のみでは重複にしない。
           *
           * 氏名一致
           * +
           * メールアドレス一致
           * または
           * 電話番号一致
           */
          return (
            sameEmail ||
            samePhone
          );
        },
      );
  }

  rebuildApplicantList(): void {
    const spreadsheet =
      SpreadsheetApp
        .openById(
          this.spreadsheetId,
        );

    const sourceSheet =
      this.getOrCreateInterviewerSheet();

    let targetSheet =
      spreadsheet
        .getSheetByName(
          ResumeConfig
            .applicantListSheetName,
        );

    const isNewSheet =
      !targetSheet;

    if (
      !targetSheet
    ) {
      targetSheet =
        spreadsheet
          .insertSheet(
            ResumeConfig
              .applicantListSheetName,
          );
    }

    const headers =
      this.getHeaders(
        sourceSheet,
      );

    if (
      headers.length === 0
    ) {
      throw new Error(
        '面接官シートのヘッダーがありません。',
      );
    }

    /*
     * UI・書式・列幅を維持するため、
     * clear() は使わず内容だけを更新する。
     */
    const lastRow =
      targetSheet.getLastRow();

    const lastColumn =
      targetSheet.getLastColumn();

    if (
      lastRow > 0 &&
      lastColumn > 0
    ) {
      targetSheet
        .getRange(
          1,
          1,
          lastRow,
          lastColumn,
        )
        .clearContent();
    }

    const formula =
      this.createApplicantListFormula(
        headers,
      );

    targetSheet
      .getRange(
        'A1',
      )
      .setFormula(
        formula,
      );

    targetSheet
      .setFrozenRows(
        1,
      );

    SpreadsheetApp.flush();

    const headerWidth =
      ResumeConfig
        .applicantListFields
        .length;

    if (
      headerWidth > 0
    ) {
      targetSheet
        .getRange(
          1,
          1,
          1,
          headerWidth,
        )
        .setFontWeight(
          'bold',
        )
        .setBackground(
          '#4a86e8',
        )
        .setFontColor(
          '#ffffff',
        )
        .setWrap(
          true,
        )
        .setVerticalAlignment(
          'middle',
        );
    }

    /*
     * 初回作成時のみ列幅などを自動調整する。
     * 既存シートでは利用者が調整したUIを維持する。
     */
    if (
      isNewSheet
    ) {
      this.formatApplicantList(
        targetSheet,
      );
    }

    this.protectApplicantList(
      targetSheet,
    );
  }

  private getOrCreateInterviewerSheet():
    GoogleAppsScript.Spreadsheet.Sheet {
    const spreadsheet =
      SpreadsheetApp
        .openById(
          this.spreadsheetId,
        );

    let sheet =
      spreadsheet
        .getSheetByName(
          ResumeConfig.sheetName,
        );

    if (
      !sheet
    ) {
      sheet =
        spreadsheet
          .insertSheet(
            ResumeConfig.sheetName,
          );

      const headers = [
        ...ResumeConfig
          .resumeFields,
        '面接ステータス',
        '処理ステータス',
        '処理メッセージ',
        '元ファイル名',
        '履歴書リンク',
        'タイムスタンプ',
      ];

      sheet
        .getRange(
          1,
          1,
          1,
          headers.length,
        )
        .setValues([
          headers,
        ]);

      sheet
        .setFrozenRows(
          1,
        );

      this.formatInterviewerSheet(
        sheet,
      );
    }

    return sheet;
  }

  private getHeaders(
    sheet:
      GoogleAppsScript.Spreadsheet.Sheet,
  ): string[] {
    const lastColumn =
      sheet.getLastColumn();

    if (
      lastColumn < 1
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
          value,
        ).trim(),
    );
  }

  private resolveValue(
    header: string,
    candidate:
      ResumeImportRecord,
    processStatus: string,
    processMessage: string,
  ): unknown {
    switch (
      header
    ) {
      case '氏名':
        return this.sanitize(
          candidate.name,
        );

      case 'フリガナ':
        return this.sanitize(
          candidate.furigana,
        );

      case '生年月日':
        return this.sanitize(
          candidate.birthDate,
        );

      case '年齢':
        return this.sanitize(
          candidate.age,
        );

      case '性別':
        return this.sanitize(
          candidate.gender,
        );

      case '現住所':
        return this.sanitize(
          candidate.address,
        );

      case '電話番号':
        return this.sanitize(
          candidate.phone,
        );

      case 'メールアドレス':
        return this.sanitize(
          candidate.email,
        );

      case '最終学歴':
        return this.sanitize(
          candidate.finalEducation,
        );

      case '学歴サマリー':
        return this.sanitize(
          candidate.educationSummary,
        );

      case '直近の職歴':
        return this.sanitize(
          candidate.latestCareer,
        );

      case '職歴サマリー':
        return this.sanitize(
          candidate.careerSummary,
        );

      case '保有資格':
        return this.sanitize(
          candidate.qualifications,
        );

      case '自己PR要約':
        return this.sanitize(
          candidate.selfPrSummary,
        );

      case '特記事項':
        return this.sanitize(
          candidate.notes,
        );

      case '面接ステータス':
        return (
          candidate
            .interviewStatus ||
          ResumeConfig
            .defaultInterviewStatus
        );

      case '処理ステータス':
        return this.sanitize(
          processStatus,
        );

      case '処理メッセージ':
        return this.sanitize(
          processMessage,
        );

      case '元ファイル名':
        return this.sanitize(
          candidate
            .sourceFileName,
        );

      case '履歴書リンク':
        return this.createDriveUrl(
          candidate
            .sourceFileId,
        );

      case 'タイムスタンプ':
        return (
          candidate
            .importedAt ||
          new Date()
        );

      default:
        return '';
    }
  }

  private formatInterviewerSheet(
    sheet:
      GoogleAppsScript.Spreadsheet.Sheet,
  ): void {
    const headers =
      this.getHeaders(
        sheet,
      );

    if (
      headers.length === 0
    ) {
      return;
    }

    sheet
      .getRange(
        1,
        1,
        1,
        headers.length,
      )
      .setFontWeight(
        'bold',
      )
      .setBackground(
        '#4a86e8',
      )
      .setFontColor(
        '#ffffff',
      )
      .setWrap(
        true,
      )
      .setVerticalAlignment(
        'middle',
      );

    const statusIndex =
      headers.indexOf(
        '面接ステータス',
      );

    if (
      statusIndex >= 0
    ) {
      const validation =
        SpreadsheetApp
          .newDataValidation()
          .requireValueInList(
            [
              ...ResumeConfig
                .interviewStatusOptions,
            ],
            true,
          )
          .setAllowInvalid(
            false,
          )
          .build();

      const startRow =
        2;

      const numberOfRows =
        Math.max(
          ResumeConfig
            .limits
            .setupRowBuffer,
          sheet.getMaxRows() -
            startRow +
            1,
        );

      sheet
        .getRange(
          startRow,
          statusIndex + 1,
          numberOfRows,
          1,
        )
        .setDataValidation(
          validation,
        );
    }

    if (
      !sheet.getFilter()
    ) {
      const filterRows =
        Math.max(
          sheet.getMaxRows(),
          2,
        );

      sheet
        .getRange(
          1,
          1,
          filterRows,
          headers.length,
        )
        .createFilter();
    }

    const wrapColumns =
      new Set([
        '現住所',
        '学歴サマリー',
        '職歴サマリー',
        '自己PR要約',
        '特記事項',
        '処理メッセージ',
      ]);

    headers.forEach(
      (
        header: string,
        index: number,
      ): void => {
        const column =
          index + 1;

        if (
          wrapColumns.has(
            header,
          )
        ) {
          sheet
            .setColumnWidth(
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
        } else {
          sheet
            .autoResizeColumn(
              column,
            );
        }
      },
    );
  }

  private formatApplicantList(
    sheet:
      GoogleAppsScript.Spreadsheet.Sheet,
  ): void {
    const lastColumn =
      sheet.getLastColumn();

    if (
      lastColumn < 1
    ) {
      return;
    }

    sheet
      .getRange(
        1,
        1,
        sheet.getMaxRows(),
        lastColumn,
      )
      .setVerticalAlignment(
        'top',
      );

    for (
      let column = 1;
      column <= lastColumn;
      column++
    ) {
      sheet.autoResizeColumn(
        column,
      );

      const currentWidth =
        sheet.getColumnWidth(
          column,
        );

      if (
        currentWidth > 300
      ) {
        sheet.setColumnWidth(
          column,
          300,
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
    }
  }

  private createApplicantListFormula(
    headers: string[],
  ): string {
    const selectedColumns:
      string[] = [];

    const labels:
      string[] = [];

    for (
      const field
      of ResumeConfig
        .applicantListFields
    ) {
      const index =
        headers.indexOf(
          field,
        );

      if (
        index === -1
      ) {
        continue;
      }

      const letter =
        this.columnToLetter(
          index + 1,
        );

      selectedColumns.push(
        letter,
      );

      labels.push(
        `${letter} '${field}'`,
      );
    }

    if (
      selectedColumns.length === 0
    ) {
      throw new Error(
        '応募者一覧へ表示できる列がありません。',
      );
    }

    const nameIndex =
      headers.indexOf(
        '氏名',
      );

    const timestampIndex =
      headers.indexOf(
        'タイムスタンプ',
      );

    const processStatusIndex =
      headers.indexOf(
        '処理ステータス',
      );

    if (
      nameIndex === -1
    ) {
      throw new Error(
        '応募者一覧に必要な氏名列がありません。',
      );
    }

    if (
      timestampIndex === -1
    ) {
      throw new Error(
        '応募者一覧に必要なタイムスタンプ列がありません。',
      );
    }

    if (
      processStatusIndex === -1
    ) {
      throw new Error(
        '応募者一覧に必要な処理ステータス列がありません。',
      );
    }

    const nameColumn =
      this.columnToLetter(
        nameIndex + 1,
      );

    const timestampColumn =
      this.columnToLetter(
        timestampIndex + 1,
      );

    const processStatusColumn =
      this.columnToLetter(
        processStatusIndex + 1,
      );

    const lastColumn =
      this.columnToLetter(
        headers.length,
      );

    const query = [
      `select ${selectedColumns.join(', ')}`,
      `where ${nameColumn} is not null`,
      `and ${nameColumn} <> ''`,
      `and ${processStatusColumn} = '成功'`,
      `order by ${timestampColumn} desc`,
      `label ${labels.join(', ')}`,
    ].join(
      ' ',
    );

    return (
      `=QUERY('${ResumeConfig.sheetName}'!A1:${lastColumn}, ` +
      `"${query}", 1)`
    );
  }

  private protectApplicantList(
    sheet:
      GoogleAppsScript.Spreadsheet.Sheet,
  ): void {
    const admins =
      this.getAdminEmails();

    if (
      admins.length === 0
    ) {
      return;
    }

    const protections =
      sheet
        .getProtections(
          SpreadsheetApp
            .ProtectionType
            .SHEET,
        );

    protections
      .filter(
        (
          protection:
            GoogleAppsScript
              .Spreadsheet
              .Protection,
        ): boolean =>
          protection
            .getDescription() ===
          ResumeConfig
            .protectionDescriptions
            .applicantList,
      )
      .forEach(
        (
          protection:
            GoogleAppsScript
              .Spreadsheet
              .Protection,
        ): void => {
          protection.remove();
        },
      );

    const protection =
      sheet
        .protect()
        .setDescription(
          ResumeConfig
            .protectionDescriptions
            .applicantList,
        );

    protection
      .setWarningOnly(
        false,
      );

    const editors =
      protection
        .getEditors();

    if (
      editors.length > 0
    ) {
      protection
        .removeEditors(
          editors,
        );
    }

    protection
      .addEditors(
        admins,
      );
  }

  private getAdminEmails():
    string[] {
    return String(
      PropertiesService
        .getScriptProperties()
        .getProperty(
          ResumeConfig
            .properties
            .adminEmails,
        ) ?? '',
    )
      .split(
        ',',
      )
      .map(
        (
          email: string,
        ): string =>
          email
            .trim()
            .toLowerCase(),
      )
      .filter(
        (
          email: string,
        ): boolean =>
          email !== '',
      );
  }

  private createDriveUrl(
    fileId: string,
  ): string {
    if (
      !fileId
    ) {
      return '';
    }

    return (
      'https://drive.google.com/open?id=' +
      encodeURIComponent(
        fileId,
      )
    );
  }

  private normalizeName(
    value: unknown,
  ): string {
    return String(
      value ?? '',
    )
      .replace(
        /[\s　]+/g,
        '',
      )
      .trim()
      .toLowerCase();
  }

  private normalizeEmail(
    value: unknown,
  ): string {
    return String(
      value ?? '',
    )
      .trim()
      .toLowerCase();
  }

  private normalizePhone(
    value: unknown,
  ): string {
    return String(
      value ?? '',
    )
      .replace(
        /[^\d+]/g,
        '',
      )
      .trim();
  }

  private sanitize(
    value: unknown,
  ): string {
    const text =
      String(
        value ?? '',
      );

    /*
     * Spreadsheet Formula Injection対策
     */
    if (
      /^[=+\-@]/.test(
        text.trimStart(),
      )
    ) {
      return `'${text}`;
    }

    return text;
  }

  private columnToLetter(
    column: number,
  ): string {
    if (
      column <= 0
    ) {
      throw new Error(
        '列番号が不正です。',
      );
    }

    let result = '';

    let value =
      column;

    while (
      value > 0
    ) {
      const remainder =
        (value - 1) %
        26;

      result =
        String
          .fromCharCode(
            65 +
            remainder,
          ) +
        result;

      value =
        Math.floor(
          (value - 1) /
          26,
        );
    }

    return result;
  }
}