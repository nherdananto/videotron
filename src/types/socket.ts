export type ClientRole = "videotron" | "mobile" | "cms";

export interface SpinResultPayload {
  participantId: string;
  participantName: string;
  prizeId: string | null;
  prizeLabel: string;
  isWin: boolean;
  /** Final wheel rotation in degrees, shared by videotron and mobile so both land on the same slice. */
  stopAngle: number;
}

export interface VotingTallyPayload {
  votingQuestionId: string;
  question: string;
  options: { id: string; label: string; count: number }[];
  totalVotes: number;
}

export interface PollTallyPayload {
  pollQuestionId: string;
  question: string;
  options: { id: string; label: string; count: number }[];
  totalVotes: number;
}

export interface QuizTallyPayload {
  quizQuestionId: string;
  question: string;
  options: { id: string; label: string; count: number }[];
  totalAnswers: number;
}

export interface LeaderboardEntryPayload {
  participantId: string;
  name: string;
  points: number;
}

export interface TicTacToeMatchPayload {
  id: string;
  playerXId: string;
  playerXName: string;
  playerOId: string | null;
  playerOName: string | null;
  board: (string | null)[];
  currentTurn: string;
  status: "WAITING" | "IN_PROGRESS" | "FINISHED";
  winner: string | null;
}

export interface RaceStandingPayload {
  participantId: string;
  name: string;
  progress: number;
  finishedAt: string | null;
  rank: number | null;
}

export interface RaceUpdatePayload {
  sessionId: string;
  status: "WAITING" | "COUNTDOWN" | "RUNNING" | "FINISHED";
  startedAt: string | null;
  endsAt: string | null;
  standings: RaceStandingPayload[];
}

export interface ServerToClientEvents {
  "participant:count": (payload: { campaignId: string; count: number }) => void;
  "spin:result": (payload: SpinResultPayload) => void;
  "campaign:updated": (payload: { campaignId: string }) => void;
  "spin:error": (payload: { message: string }) => void;
  "voting:update": (payload: VotingTallyPayload) => void;
  "vote:accepted": (payload: { votingQuestionId: string; votingOptionId: string; participantId: string }) => void;
  "vote:error": (payload: { message: string }) => void;
  "polling:update": (payload: PollTallyPayload) => void;
  "poll:accepted": (payload: { pollQuestionId: string; pollOptionId: string; participantId: string }) => void;
  "poll:error": (payload: { message: string }) => void;
  "quiz:update": (payload: QuizTallyPayload) => void;
  "quiz:accepted": (payload: {
    quizQuestionId: string;
    quizOptionId: string;
    participantId: string;
    isCorrect: boolean;
    pointsAwarded: number;
  }) => void;
  "quiz:error": (payload: { message: string }) => void;
  "quiz:leaderboard": (payload: { period: "today"; entries: LeaderboardEntryPayload[] }) => void;
  "tictactoe:update": (payload: TicTacToeMatchPayload) => void;
  "tictactoe:error": (payload: { message: string }) => void;
  "racing:update": (payload: RaceUpdatePayload) => void;
  "racing:error": (payload: { message: string }) => void;
}

export interface ClientToServerEvents {
  "room:join": (payload: { campaignId: string; role: ClientRole }) => void;
  "spin:request": (payload: { campaignId: string; sessionToken: string }) => void;
  "vote:cast": (payload: { campaignId: string; sessionToken: string; votingOptionId: string }) => void;
  "poll:answer": (payload: { campaignId: string; sessionToken: string; pollOptionId: string }) => void;
  "quiz:answer": (payload: { campaignId: string; sessionToken: string; quizOptionId: string }) => void;
  "tictactoe:move": (payload: { campaignId: string; sessionToken: string; matchId: string; cellIndex: number }) => void;
  "racing:accelerate": (payload: { campaignId: string; sessionToken: string; raceSessionId: string }) => void;
}
