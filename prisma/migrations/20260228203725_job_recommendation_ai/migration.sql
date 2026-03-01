-- AlterTable
ALTER TABLE "user" ADD COLUMN     "skillEmbedding" DOUBLE PRECISION[];

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendedJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendedJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecommendedJob_userId_score_idx" ON "RecommendedJob"("userId", "score");

-- CreateIndex
CREATE INDEX "RecommendedJob_userId_idx" ON "RecommendedJob"("userId");

-- CreateIndex
CREATE INDEX "RecommendedJob_jobId_idx" ON "RecommendedJob"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendedJob_userId_jobId_key" ON "RecommendedJob"("userId", "jobId");

-- AddForeignKey
ALTER TABLE "RecommendedJob" ADD CONSTRAINT "RecommendedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendedJob" ADD CONSTRAINT "RecommendedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
