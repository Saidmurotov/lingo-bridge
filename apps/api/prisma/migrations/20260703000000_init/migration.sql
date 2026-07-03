-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'TRANSLATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'REVIEW', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('DIPLOMA', 'TRANSCRIPT', 'CERTIFICATE', 'DISSERTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "Lang" AS ENUM ('UZ', 'EN', 'RU');

-- CreateEnum
CREATE TYPE "CefrLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('LESSON_PLAN', 'EXERCISES', 'PRESENTATION', 'READING', 'TEST', 'VOCABULARY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "doc_type" "DocType" NOT NULL,
    "from_lang" "Lang" NOT NULL,
    "to_lang" "Lang" NOT NULL,
    "notarize" BOOLEAN NOT NULL DEFAULT false,
    "keep_format" BOOLEAN NOT NULL DEFAULT true,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "error_message" TEXT,
    "reviewer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "translation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_files" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quick_translations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "from_lang" "Lang",
    "to_lang" "Lang" NOT NULL,
    "source_text" TEXT NOT NULL,
    "result_text" TEXT NOT NULL,
    "academic" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quick_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "level" "CefrLevel" NOT NULL,
    "type" "MaterialType" NOT NULL,
    "output_lang" "Lang" NOT NULL,
    "notes" TEXT,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "translation_jobs_user_id_idx" ON "translation_jobs"("user_id");

-- CreateIndex
CREATE INDEX "translation_jobs_status_idx" ON "translation_jobs"("status");

-- CreateIndex
CREATE INDEX "job_files_job_id_idx" ON "job_files"("job_id");

-- CreateIndex
CREATE INDEX "quick_translations_user_id_idx" ON "quick_translations"("user_id");

-- CreateIndex
CREATE INDEX "materials_user_id_idx" ON "materials"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_jobs" ADD CONSTRAINT "translation_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_jobs" ADD CONSTRAINT "translation_jobs_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_files" ADD CONSTRAINT "job_files_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "translation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quick_translations" ADD CONSTRAINT "quick_translations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

