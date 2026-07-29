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

export interface ServerToClientEvents {
  "participant:count": (payload: { campaignId: string; count: number }) => void;
  "spin:result": (payload: SpinResultPayload) => void;
  "campaign:updated": (payload: { campaignId: string }) => void;
  "spin:error": (payload: { message: string }) => void;
  "voting:update": (payload: VotingTallyPayload) => void;
  "vote:accepted": (payload: { votingQuestionId: string; votingOptionId: string; participantId: string }) => void;
  "vote:error": (payload: { message: string }) => void;
}

export interface ClientToServerEvents {
  "room:join": (payload: { campaignId: string; role: ClientRole }) => void;
  "spin:request": (payload: { campaignId: string; sessionToken: string }) => void;
  "vote:cast": (payload: { campaignId: string; sessionToken: string; votingOptionId: string }) => void;
}
