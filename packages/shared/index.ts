export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: 'CLIENT' | 'TRANSLATOR' | 'ADMIN';
}

export interface JobDto {
  id: string;
  userId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  sourceLang: string;
  targetLang: string;
  documentId?: string;
}

export interface QuickTranslateRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

export interface QuickTranslateResponse {
  translatedText: string;
}

export interface WorkerJobPayload {
  jobId: string;
  documentId: string;
  sourceLang: string;
  targetLang: string;
  storagePath: string;
}
