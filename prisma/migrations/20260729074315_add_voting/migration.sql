-- CreateTable
CREATE TABLE "VotingQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VotingQuestion_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VotingOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "votingQuestionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VotingOption_votingQuestionId_fkey" FOREIGN KEY ("votingQuestionId") REFERENCES "VotingQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoteEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "votingQuestionId" TEXT NOT NULL,
    "votingOptionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoteEntry_votingQuestionId_fkey" FOREIGN KEY ("votingQuestionId") REFERENCES "VotingQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VoteEntry_votingOptionId_fkey" FOREIGN KEY ("votingOptionId") REFERENCES "VotingOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VoteEntry_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VotingQuestion_campaignId_idx" ON "VotingQuestion"("campaignId");

-- CreateIndex
CREATE INDEX "VotingOption_votingQuestionId_idx" ON "VotingOption"("votingQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteEntry_votingQuestionId_participantId_key" ON "VoteEntry"("votingQuestionId", "participantId");
