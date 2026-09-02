import { refreshHealthScores, regenerateFreeTimeAlerts } from '../server/db.ts';

await refreshHealthScores();
await regenerateFreeTimeAlerts();
console.log(JSON.stringify({ refreshed: true, notificationsSent: false }));
process.exit(0);
