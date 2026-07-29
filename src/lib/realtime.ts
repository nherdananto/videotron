import { campaignRoomName } from "@/lib/games";
import type { ServerToClientEvents } from "@/types/socket";

export function notifyCampaignUpdated(campaignSlug: string) {
  emitToCampaign(campaignSlug, "campaign:updated", { campaignId: campaignSlug });
}

/** Lets API routes (running in the same Node process as the custom server) push realtime events. */
export function emitToCampaign<E extends keyof ServerToClientEvents>(
  campaignSlug: string,
  event: E,
  payload: Parameters<ServerToClientEvents[E]>[0]
) {
  import("@/server/ioSingleton")
    .then(({ getIO }) => {
      // Socket.IO's typed-emit overloads don't unify with a generic event key; the public
      // signature above still type-checks every call site's event name against its payload.
      (getIO().to(campaignRoomName(campaignSlug)).emit as (event: E, payload: unknown) => void)(event, payload);
    })
    .catch(() => {
      // Socket server not initialized (e.g. during build) — safe to ignore.
    });
}
