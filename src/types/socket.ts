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

export interface ServerToClientEvents {
  "participant:count": (payload: { campaignId: string; count: number }) => void;
  "spin:result": (payload: SpinResultPayload) => void;
  "campaign:updated": (payload: { campaignId: string }) => void;
  "spin:error": (payload: { message: string }) => void;
}

export interface ClientToServerEvents {
  "room:join": (payload: { campaignId: string; role: ClientRole }) => void;
  "spin:request": (payload: { campaignId: string; sessionToken: string }) => void;
}
