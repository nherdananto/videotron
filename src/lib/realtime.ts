import { campaignRoomName } from "@/lib/games";

export function notifyCampaignUpdated(campaignSlug: string) {
  import("@/server/ioSingleton")
    .then(({ getIO }) => getIO().to(campaignRoomName(campaignSlug)).emit("campaign:updated", { campaignId: campaignSlug }))
    .catch(() => {
      // Socket server not initialized (e.g. during build) — safe to ignore.
    });
}
