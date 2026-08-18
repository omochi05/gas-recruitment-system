import type {
  ResumeImportRecord,
  ResumeSource,
} from '../domain/Resume';

export interface ResumeSourceRepository {
  /**
   * 取込待ちフォルダに存在する
   * ファイルIDを取得する。
   *
   * この段階ではPDF OCRや
   * テキスト抽出を行わない。
   */
  findPendingFileIds(
    limit: number,
  ): string[];

  /**
   * 1ファイルだけ読み込み、
   * ResumeSourceへ変換する。
   *
   * PDF OCRやTXT読込のエラーは
   * このメソッド単位で発生させる。
   */
  getSource(
    fileId: string,
  ): ResumeSource;

  moveToProcessed(
    fileId: string,
  ): void;

  moveToDuplicate(
    fileId: string,
  ): void;

  moveToError(
    fileId: string,
  ): void;
}

export interface ResumeCandidateRepository {
  /**
   * 正常に解析された応募者だけを
   * 面接官シートへ保存する。
   */
  save(
    candidate: ResumeImportRecord,
    processStatus: string,
    processMessage: string,
  ): void;

  /**
   * 履歴書解析失敗時の情報を記録する。
   *
   * 実装側では面接官シートへ
   * エラー行を作らず、
   * ログ用途に限定する。
   */
  saveError(
    source: ResumeSource,
    message: string,
  ): void;

  /**
   * 既存応募者との重複判定。
   */
  isDuplicate(
    candidate: ResumeImportRecord,
  ): boolean;

  /**
   * 正常処理済み応募者をもとに
   * 応募者一覧を再構築する。
   */
  rebuildApplicantList(): void;
}

export interface ResumeExtractionClient {
  /**
   * 履歴書本文から
   * 採用管理用データを抽出する。
   */
  extract(
    source: ResumeSource,
  ): ResumeImportRecord;
}

export interface ImportLogRepository {
  /**
   * 正常処理・重複等の
   * 操作ログを記録する。
   */
  access(
    actionType: string,
    detail: string,
  ): void;

  /**
   * 履歴書取込エラーを記録する。
   */
  error(
    fileName: string,
    message: string,
  ): void;
}