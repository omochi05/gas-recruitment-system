export class SpreadsheetSanitizer {
  sanitize(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    const text = String(value);

    if (this.isFormulaLike(text)) {
      return `'${text}`;
    }

    return text;
  }

  sanitizeRow(values: unknown[]): string[] {
    return values.map((value) => this.sanitize(value));
  }

  private isFormulaLike(value: string): boolean {
    const trimmed = value.trimStart();

    return (
      trimmed.startsWith('=') ||
      trimmed.startsWith('+') ||
      trimmed.startsWith('-') ||
      trimmed.startsWith('@')
    );
  }
}