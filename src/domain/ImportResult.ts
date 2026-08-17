export type ImportStatus =
  | 'processed'
  | 'duplicate'
  | 'error';

export interface ImportResult {
  fileId: string;
  fileName: string;
  status: ImportStatus;
  message?: string;
}