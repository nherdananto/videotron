-- CreateTable
CREATE TABLE "PollSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PollSession_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PollQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollSessionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PollQuestion_pollSessionId_fkey" FOREIGN KEY ("pollSessionId") REFERENCES "PollSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PollOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollQuestionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PollOption_pollQuestionId_fkey" FOREIGN KEY ("pollQuestionId") REFERENCES "PollQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PollAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollQuestionId" TEXT NOT NULL,
    "pollOptionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PollAnswer_pollQuestionId_fkey" FOREIGN KEY ("pollQuestionId") REFERENCES "PollQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PollAnswer_pollOptionId_fkey" FOREIGN KEY ("pollOptionId") REFERENCES "PollOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PollAnswer_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PollSession_campaignId_idx" ON "PollSession"("campaignId");

-- CreateIndex
CREATE INDEX "PollQuestion_pollSessionId_idx" ON "PollQuestion"("pollSessionId");

-- CreateIndex
CREATE INDEX "PollOption_pollQuestionId_idx" ON "PollOption"("pollQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "PollAnswer_pollQuestionId_participantId_key" ON "PollAnswer"("pollQuestionId", "participantId");
