-- CreateTable
CREATE TABLE "roadmap" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" VARCHAR(10000),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_task" (
    "id" TEXT NOT NULL,
    "taskTitle" VARCHAR(255) NOT NULL,
    "taskNumber" INTEGER NOT NULL,
    "tag" VARCHAR(255),
    "ainotes" TEXT,
    "roadmapId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_subtask" (
    "id" TEXT NOT NULL,
    "subTaskTitle" VARCHAR(500) NOT NULL,
    "ainotes" VARCHAR(5000),
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_subtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_task_resources" (
    "id" TEXT NOT NULL,
    "youtubeLinks" TEXT[],
    "articles" TEXT[],
    "selfstudyReferences" TEXT[],
    "practiceLinks" TEXT[],
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_task_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_subtask_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "subtaskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_subtask_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roadmap_authorId_idx" ON "roadmap"("authorId");

-- CreateIndex
CREATE INDEX "roadmap_task_roadmapId_idx" ON "roadmap_task"("roadmapId");

-- CreateIndex
CREATE INDEX "roadmap_subtask_taskId_idx" ON "roadmap_subtask"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "roadmap_task_resources_taskId_key" ON "roadmap_task_resources"("taskId");

-- CreateIndex
CREATE INDEX "roadmap_subtask_progress_userId_idx" ON "roadmap_subtask_progress"("userId");

-- CreateIndex
CREATE INDEX "roadmap_subtask_progress_roadmapId_idx" ON "roadmap_subtask_progress"("roadmapId");

-- CreateIndex
CREATE INDEX "roadmap_subtask_progress_subtaskId_idx" ON "roadmap_subtask_progress"("subtaskId");

-- CreateIndex
CREATE UNIQUE INDEX "roadmap_subtask_progress_userId_subtaskId_key" ON "roadmap_subtask_progress"("userId", "subtaskId");

-- AddForeignKey
ALTER TABLE "roadmap" ADD CONSTRAINT "roadmap_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_task" ADD CONSTRAINT "roadmap_task_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_subtask" ADD CONSTRAINT "roadmap_subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "roadmap_task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_task_resources" ADD CONSTRAINT "roadmap_task_resources_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "roadmap_task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_subtask_progress" ADD CONSTRAINT "roadmap_subtask_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_subtask_progress" ADD CONSTRAINT "roadmap_subtask_progress_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_subtask_progress" ADD CONSTRAINT "roadmap_subtask_progress_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "roadmap_subtask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
