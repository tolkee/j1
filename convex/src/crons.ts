import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Process recurring transactions daily at 6 AM UTC
// This will create actual transactions from recurring transaction templates
// and update their next execution dates
crons.daily(
  "process recurring transactions",
  { hourUTC: 6, minuteUTC: 0 },
  api.finance.recurring.processRecurringTransactions
);

export default crons;
