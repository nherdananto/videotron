-- CreateTable
CREATE TABLE "TicTacToeMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "playerXId" TEXT NOT NULL,
    "playerOId" TEXT,
    "board" JSONB NOT NULL,
    "currentTurn" TEXT NOT NULL DEFAULT 'X',
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "winner" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    CONSTRAINT "TicTacToeMatch_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TicTacToeMatch_playerXId_fkey" FOREIGN KEY ("playerXId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TicTacToeMatch_playerOId_fkey" FOREIGN KEY ("playerOId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RaceSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "trackName" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 30,
    "maxPlayers" INTEGER NOT NULL DEFAULT 6,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "startedAt" DATETIME,
    "endsAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RaceSession_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RaceParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceSessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "progress" REAL NOT NULL DEFAULT 0,
    "finishedAt" DATETIME,
    "rank" INTEGER,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RaceParticipant_raceSessionId_fkey" FOREIGN KEY ("raceSessionId") REFERENCES "RaceSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RaceParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TicTacToeMatch_campaignId_idx" ON "TicTacToeMatch"("campaignId");

-- CreateIndex
CREATE INDEX "RaceSession_campaignId_idx" ON "RaceSession"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "RaceParticipant_raceSessionId_participantId_key" ON "RaceParticipant"("raceSessionId", "participantId");
