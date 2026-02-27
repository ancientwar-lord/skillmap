-- CreateTable
CREATE TABLE "test_result" (
    "id" TEXT NOT NULL,
    "topic" VARCHAR(500) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "difficulty" VARCHAR(20) NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "incorrectCount" INTEGER NOT NULL,
    "unattemptedCount" INTEGER NOT NULL,
    "scorePercentage" INTEGER NOT NULL,
    "totalTimeTaken" DOUBLE PRECISION NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "recommendations" TEXT[],
    "questionsJson" TEXT NOT NULL,
    "userAnswersJson" TEXT NOT NULL,
    "analysisJson" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_result_userId_idx" ON "test_result"("userId");

-- CreateIndex
CREATE INDEX "test_result_createdAt_idx" ON "test_result"("createdAt");

-- AddForeignKey
ALTER TABLE "test_result" ADD CONSTRAINT "test_result_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
