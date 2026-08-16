import { describe, expect, it, vi, beforeEach } from "vitest";

// Partial mock: keep real DB helpers (router tests query the DB), stub only the
// scheduled-job internals that must not double-fire their cron logic in tests.
vi.mock("./db", async (importOriginal) => {
  const actual = await (importOriginal as typeof vi.importActual<typeof import("./db")>)("./db");
  return {
    ...actual,
    regenerateFreeTimeAlerts: vi.fn().mockResolvedValue(undefined),
    refreshHealthScores: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("./_core/sdk", () => ({
  sdk: {
    authenticateRequest: vi.fn(),
  },
}));

import { dailyFreeTimeRefreshHandler } from "./scheduled";
import { sdk } from "./_core/sdk";
import { regenerateFreeTimeAlerts, refreshHealthScores } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function makeReq(): any {
  return {
    originalUrl: "/api/scheduled/daily-free-time-refresh",
    headers: { cookie: "app_session_id=fake" },
  };
}

function makeRes(): any {
  return {
    statusCode: 200,
    jsonPayload: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.jsonPayload = payload;
      return this;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------- scheduled handler ----------------
describe("dailyFreeTimeRefreshHandler", () => {
  it("rejects non-cron callers with 403", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({ isCron: false } as any);
    const res = makeRes();
    await dailyFreeTimeRefreshHandler(makeReq(), res);
    expect(res.statusCode).toBe(403);
    expect(regenerateFreeTimeAlerts).not.toHaveBeenCalled();
  });

  it("runs refresh + health scores and returns ok for valid cron caller", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      isCron: true,
      taskUid: "A6mm3rEmgX4upV4zjmygHW",
    } as any);
    const res = makeRes();
    await dailyFreeTimeRefreshHandler(makeReq(), res);
    expect(regenerateFreeTimeAlerts).toHaveBeenCalled();
    expect(refreshHealthScores).toHaveBeenCalled();
    expect(res.jsonPayload.ok).toBe(true);
    expect(res.jsonPayload.timestamp).toBeTruthy();
  });

  it("returns 500 with structured error on failure (retry-safe)", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      isCron: true,
      taskUid: "A6mm3rEmgX4upV4zjmygHW",
    } as any);
    vi.mocked(regenerateFreeTimeAlerts).mockRejectedValueOnce(new Error("DB down"));
    const res = makeRes();
    await dailyFreeTimeRefreshHandler(makeReq(), res);
    expect(res.statusCode).toBe(500);
    expect(res.jsonPayload.error).toBe("DB down");
    expect(res.jsonPayload.context).toHaveProperty("url");
  });
});

// ---------------- router public surface ----------------
function publicCaller() {
  return {
    user: null,
    req: {},
    res: {
      clearCookie: () => undefined,
      cookie: () => undefined,
    },
  } as unknown as TrpcContext;
}

describe("router public surface (against real DB)", () => {
  it("dashboard.stats resolves with core KPI fields", async () => {
    const caller = appRouter.createCaller(publicCaller() as any);
    const stats = await caller.dashboard.stats();
    expect(stats).toHaveProperty("totalShipments");
    expect(typeof stats.totalShipments).toBe("number");
  });

  it("tools.freeTimeOverview resolves to an array", async () => {
    const caller = appRouter.createCaller(publicCaller() as any);
    const rows = await caller.tools.freeTimeOverview();
    expect(Array.isArray(rows)).toBe(true);
    if (rows.length > 0) {
      expect(rows[0]).toHaveProperty("freeTime");
    }
  });

  it("alerts.list resolves to an array", async () => {
    const caller = appRouter.createCaller(publicCaller() as any);
    const data = await caller.alerts.list();
    expect(Array.isArray(data)).toBe(true);
  });
});
