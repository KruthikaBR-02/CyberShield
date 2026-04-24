
export enum RiskType {
  SAFE = 'Safe',
  SUSPICIOUS = 'Suspicious',
  NSFW = 'NSFW',
  DOCUMENT = 'Document',
  DUPLICATE = 'Duplicate',
  LARGE_FILE = 'Large File',
}

export enum FileCategory {
  IMAGE = 'Image',
  VIDEO = 'Video',
  DOCUMENT = 'Document',
  APK = 'APK',
  OTHER = 'Other',
}

export interface ScannedFile {
  id: string;
  file: File;
  previewUrl?: string;
  risk: RiskType;
  category: FileCategory;
  scanDate: Date;
  details: string;
}

export interface MockAttachment {
  id: string;
  fileName: string;
  fileSize: number; // in bytes
  isMalicious: boolean;
}

export interface MockEmail {
  id: string;
  sender: string;
  subject: string;
  date: Date;
  attachments: MockAttachment[];
}
