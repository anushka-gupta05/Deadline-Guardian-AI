import { Task } from "./types";

// Helper to get relative dates for mock deadlines
const getRelativeDateStr = (daysOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

export const INITIAL_MOCK_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Launch Product Pitch Presentation",
    deadline: getRelativeDateStr(2), // 2 days from now (high risk)
    priority: "high",
    description: "Prepare and finalize the 15-slide pitch deck for the venture capital meeting, including financial projections and market sizing data.",
    completed: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    aiAnalysis: {
      riskScore: "high",
      riskExplanation: "The deadline is in exactly 2 days, and this is a high-priority task involving complex financial model slides and pitch narratives. With other meetings scheduled, the window of focused work is extremely thin.",
      focusStep: "Refine slide 4 and 5 (financial projections) and draft the core problem-solution script.",
      milestones: [
        { id: "m1-1", title: "Complete financial forecast slide", completed: true },
        { id: "m1-2", title: "Review product demo screenshots", completed: false },
        { id: "m1-3", title: "Write speakers notes for slides 1-15", completed: false },
        { id: "m1-4", title: "Conduct full dry-run presentation check", completed: false }
      ],
      dayWisePlan: [
        { day: "Day 1 (Today)", title: "Lock Financials", description: "Finalize cash flow charts and lock down slide 4 and 5 details. Get peer feedback on projections." },
        { day: "Day 2 (Tomorrow)", title: "Write Notes & Polish", description: "Flesh out slide speaking notes. Work on visual alignments, typography, and clear slide transitions." },
        { day: "Day 3 (Deadline)", title: "Dry Runs", description: "Do 3 mock runs of the presentation with a timer. Maintain pacing and check audio setup." }
      ],
      productivitySuggestions: [
        "Timebox slide editing to 45-minute blocks with 5-minute offline rest breaks to avoid fatigue.",
        "Practice speaking aloud—don't just read the slides silently. It activates muscle memory.",
        "Turn off all social notifications and use full-screen focus mode on your deck editor."
      ],
      analyzedAt: new Date().toISOString()
    }
  },
  {
    id: "task-2",
    title: "Quarterly Performance Reports",
    deadline: getRelativeDateStr(8), // 8 days from now (medium risk)
    priority: "medium",
    description: "Gather performance metrics from Google Analytics, Salesforce, and client satisfaction surveys to generate the team scorecard.",
    completed: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    aiAnalysis: {
      riskScore: "medium",
      riskExplanation: "You have 8 days remaining, which is sufficient time. However, gathering data across three disparate platforms can introduce operational blockages if API tokens are expired or team leads reply late.",
      focusStep: "Log into Google Analytics and export the conversion rate raw sheet immediately to check data integrity.",
      milestones: [
        { id: "m2-1", title: "Export GA traffic & event reports", completed: true },
        { id: "m2-2", title: "Request team performance logs from HR", completed: true },
        { id: "m2-3", title: "Aggregate satisfaction survey results", completed: false },
        { id: "m2-4", title: "Draft scorecard summary report PDF", completed: false }
      ],
      dayWisePlan: [
        { day: "Phase 1 (Days 1-3)", title: "Data Ingestion", description: "Acquire raw data sets. Reach out to departments for any missing spreadsheets or log updates." },
        { day: "Phase 2 (Days 4-6)", title: "Analysis & Drafting", description: "Aggregate scores into the master team Excel sheet. Draft baseline narratives." },
        { day: "Phase 3 (Days 7-8)", title: "Formatting & Distribution", description: "Convert spreadsheet charts into a clean PDF booklet. Schedule the team review calendar." }
      ],
      productivitySuggestions: [
        "Utilize template pre-sets for your scorecard instead of designing tables from scratch.",
        "Do data entry first thing in the morning when your logical focus is at its absolute peak.",
        "Batch follow-up emails in one go at 4:00 PM rather than sending one-off pings."
      ],
      analyzedAt: new Date().toISOString()
    }
  },
  {
    id: "task-3",
    title: "Renew Comprehensive Car Insurance",
    deadline: getRelativeDateStr(14), // 14 days from now (low risk)
    priority: "low",
    description: "Review current insurance policy renewal options, compare rates with 2 competitors, and sign the digital renewal form.",
    completed: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date().toISOString(),
    aiAnalysis: {
      riskScore: "low",
      riskExplanation: "With 14 days left, you have substantial breathing room. This task requires only about 45 minutes of aggregate effort. There is virtually zero risk of missing this unless forgotten entirely.",
      focusStep: "Retrieve your current premium quote from your email inbox.",
      milestones: [
        { id: "m3-1", title: "Locate existing insurance quote email", completed: true },
        { id: "m3-2", title: "Run comparison search on 2 portal sites", completed: true },
        { id: "m3-3", title: "E-sign policy confirmation form", completed: true }
      ],
      dayWisePlan: [
        { day: "Week 1", title: "Quote Gathering", description: "Search comparison websites. Spend 15 minutes collecting competing quotes." },
        { day: "Week 2", title: "Renewal Signature", description: "Select the most optimal provider and sign the renewal agreement online." }
      ],
      productivitySuggestions: [
        "Set up auto-payment options during signing to completely automate next year's renewal.",
        "Compare policy details carefully - look at the deductible, not just the monthly premium price.",
        "Do this task on a quiet Friday afternoon as it is low-stress and high-routine."
      ],
      analyzedAt: new Date().toISOString()
    }
  }
];
