-- AlterTable
ALTER TABLE "note" ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "requiresRevision" BOOLEAN NOT NULL DEFAULT false;
