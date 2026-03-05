-- AlterTable
ALTER TABLE "goal_item" ADD COLUMN     "isRepetitive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "goal_log" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodKey" VARCHAR(20) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "goal_log_userId_idx" ON "goal_log"("userId");

-- CreateIndex
CREATE INDEX "goal_log_periodKey_idx" ON "goal_log"("periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "goal_log_goalId_periodKey_key" ON "goal_log"("goalId", "periodKey");

-- AddForeignKey
ALTER TABLE "goal_log" ADD CONSTRAINT "goal_log_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goal_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_log" ADD CONSTRAINT "goal_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
