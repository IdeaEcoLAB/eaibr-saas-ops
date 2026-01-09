import * as cron from "node-cron";
import { procesAllFeeds } from "../services/rssService";
import { notifyOwner } from "../_core/notification";

let syncInProgress = false;

/**
 * Execute RSS sync
 */
async function executeRssSync(): Promise<void> {
  if (syncInProgress) {
    console.log("[RSS Cron] Sync already in progress, skipping");
    return;
  }

  syncInProgress = true;

  try {
    console.log("[RSS Cron] Starting RSS feed synchronization");
    const result = await procesAllFeeds();

    console.log(
      `[RSS Cron] Sync completed: ${result.successCount}/${result.totalProcessed} sources, ${result.totalAdded} items added`
    );

    // Notify owner if new content was added
    if (result.totalAdded > 0) {
      try {
        await notifyOwner({
          title: "Novo conteúdo RSS coletado",
          content: `${result.totalAdded} novos itens foram adicionados de ${result.successCount} fontes.`,
        });
      } catch (error) {
        console.error("[RSS Cron] Failed to send notification:", error);
      }
    }
  } catch (error) {
    console.error("[RSS Cron] Error during sync:", error);
  } finally {
    syncInProgress = false;
  }
}

/**
 * Initialize RSS sync cron job
 * Runs every 30 minutes
 */
export function initializeRssSyncCron(): ReturnType<typeof cron.schedule> {
  console.log("[RSS Cron] Initializing RSS sync cron job (every 30 minutes)");

  const task = cron.schedule("*/30 * * * *", async () => {
    await executeRssSync();
  });

  // Run once on startup after a short delay
  setTimeout(() => {
    console.log("[RSS Cron] Running initial sync on startup");
    executeRssSync().catch((error) => {
      console.error("[RSS Cron] Initial sync failed:", error);
    });
  }, 5000);

  return task;
}

/**
 * Manually trigger RSS sync
 */
export async function triggerRssSync(): Promise<void> {
  console.log("[RSS Cron] Manual sync triggered");
  await executeRssSync();
}

/**
 * Stop RSS sync cron job
 */
export function stopRssSyncCron(task: ReturnType<typeof cron.schedule>): void {
  task.stop();
  console.log("[RSS Cron] RSS sync cron job stopped");
}
