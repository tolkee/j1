import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Example: Daily cleanup of completed tasks older than 30 days
// Runs daily at 2 AM UTC to clean up old data
crons.daily(
  "cleanup old completed tasks",
  { hourUTC: 2, minuteUTC: 0 },
  api.tasks.tasks.cleanupOldTasks
);

// Example: Weekly project status summary
// Runs every Sunday at 9 AM UTC to generate status reports
crons.weekly(
  "weekly project summary",
  { dayOfWeek: "sunday", hourUTC: 9, minuteUTC: 0 },
  api.tasks.projects.generateWeeklySummary
);

export default crons;
