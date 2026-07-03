// Shared contract types between apps/web and apps/api.
// Mirrors docs/03-DATABASE.md (enums) and docs/04-API.md (payload shapes).

export type Role = 'CLIENT' | 'TRANSLATOR' | 'ADMIN';
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'REVIEW' | 'DONE' | 'FAILED';
export type DocType = 'DIPLOMA' | 'TRANSCRIPT' | 'CERTIFICATE' | 'DISSERTATION' | 'OTHER';
export type Lang = 'UZ' | 'EN' | 'RU';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type MaterialType =
  | 'LESSON_PLAN'
  | 'EXERCISES'
  | 'PRESENTATION'
  | 'READING'
  | 'TEST'
  | 'VOCABULARY';

// ---- API envelope (docs/04 §1) ----

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: {
    code:
      | 'INVALID_INPUT'
      | 'UNAUTHORIZED'
      | 'FORBIDDEN'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'FILE_TOO_LARGE'
      | 'UNSUPPORTED_MEDIA'
      | 'RATE_LIMITED'
      | 'INTERNAL';
    message: string;
  };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ---- Auth (docs/04 §2) ----

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: UserDto;
}

// ---- Quick translate (docs/04 §3) ----

export interface QuickTranslateRequest {
  text: string;
  fromLang: Lang | null; // null = auto-detect
  toLang: Lang;
  academic?: boolean;
}

export interface QuickTranslateResponse {
  id: string;
  resultText: string;
  detectedLang?: Lang;
}

// ---- Materials (docs/04 §4) ----

export interface MaterialRequest {
  subject: string;
  topic: string;
  level: CefrLevel;
  type: MaterialType;
  outputLang: Lang;
  notes?: string;
}

export interface MaterialDto {
  id: string;
  subject: string;
  topic: string;
  level: CefrLevel;
  type: MaterialType;
  outputLang: Lang;
  content: string;
  createdAt: string;
}

// ---- Documents (docs/04 §5) ----

export interface JobFileDto {
  id: string;
  kind: 'source' | 'result';
  originalName: string;
  sizeBytes?: number;
}

export interface TranslationJobDto {
  id: string;
  status: JobStatus;
  docType: DocType;
  fromLang: Lang;
  toLang: Lang;
  notarize: boolean;
  keepFormat?: boolean;
  urgent?: boolean;
  errorMessage?: string | null;
  files: JobFileDto[];
  createdAt: string;
  completedAt?: string | null;
}

// ---- History (docs/04 §7) ----

export interface HistoryItem {
  type: 'quick' | 'material' | 'document';
  id: string;
  summary: string;
  status?: JobStatus;
  createdAt: string;
}

// ---- Redis job payload api → doc-worker (docs/04 §8) ----

export interface WorkerSourceFile {
  fileId: string;
  storageKey: string;
  mimeType: string;
}

export interface WorkerJobPayload {
  jobId: string;
  docType: DocType;
  fromLang: Lang;
  toLang: Lang;
  notarize: boolean;
  keepFormat: boolean;
  sourceFiles: WorkerSourceFile[];
}

// Worker → api status callback (PUT /api/documents/:id/status)
export interface WorkerStatusUpdate {
  status: JobStatus;
  errorMessage?: string;
  resultFiles?: Array<{
    storageKey: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  }>;
}
