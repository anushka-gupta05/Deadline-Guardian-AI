export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface DayWiseStep {
  day: string;
  title: string;
  description: string;
}

export interface AIAnalysis {
  riskScore: 'low' | 'medium' | 'high';
  riskExplanation: string;
  focusStep: string;
  milestones: Milestone[];
  dayWisePlan: DayWiseStep[];
  productivitySuggestions: string[];
  analyzedAt: string;
}

export interface Task {
  id: string;
  title: string;
  deadline: string; // YYYY-MM-DD
  priority: 'low' | 'medium' | 'high';
  description?: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  aiAnalysis?: AIAnalysis;
  aiLoading?: boolean;
  aiError?: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  pendingTasksCount: number;
}
