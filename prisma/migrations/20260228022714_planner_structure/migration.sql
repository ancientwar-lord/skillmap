-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'LONGTERM', 'PASSION', 'BOREDOM', 'RANDOM', 'CUSTOM');

-- CreateTable
CREATE TABLE "routine_todo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" VARCHAR(1000) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routine_todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_section" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" "GoalCategory",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_item" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "text" VARCHAR(1000) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "routine_todo_userId_idx" ON "routine_todo"("userId");

-- CreateIndex
CREATE INDEX "goal_section_userId_idx" ON "goal_section"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "goal_section_userId_name_key" ON "goal_section"("userId", "name");

-- CreateIndex
CREATE INDEX "goal_item_sectionId_idx" ON "goal_item"("sectionId");

-- CreateIndex
CREATE INDEX "goal_item_targetDate_idx" ON "goal_item"("targetDate");

-- CreateIndex
CREATE INDEX "goal_item_userId_idx" ON "goal_item"("userId");

-- AddForeignKey
ALTER TABLE "routine_todo" ADD CONSTRAINT "routine_todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_section" ADD CONSTRAINT "goal_section_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_item" ADD CONSTRAINT "goal_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_item" ADD CONSTRAINT "goal_item_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "goal_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
