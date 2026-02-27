-- AlterTable
ALTER TABLE "roadmap" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT;
