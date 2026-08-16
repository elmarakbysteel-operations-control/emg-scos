import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { regenerateFreeTimeAlerts, refreshHealthScores } from "./db";

// Idempotent daily job: recomputes Free Time expiry for all shipments,
// refreshes health scores, and generates Free Time / LC alerts.
// Triggered by Manus Heartbeat at /api/scheduled/daily-free-time-refresh
export async function dailyFreeTimeRefreshHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });

    await regenerateFreeTimeAlerts();
    await refreshHealthScores();

    return res.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("[daily-free-time-refresh]", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.originalUrl },
      timestamp: new Date().toISOString(),
    });
  }
}
