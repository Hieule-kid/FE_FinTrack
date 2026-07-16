export type PlanStatus = "ACTIVE" | "COMPLETED" | "PAUSED" | string;
export type PlanFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | string;
export type MilestoneStatus = "PENDING" | "COMPLETED" | "MISSED" | string;

export interface ResponsePlanning<T> {
  code: number;
  message: string;
  data: T | null;
}

export interface Milestone {
  id: string;
  planId: string;
  sequenceIndex: number;
  timeline: string;
  periodDate: string;
  deadline: string;
  baseTargetSavings: number;
  targetSavings: number;
  actualSaved: number;
  status: MilestoneStatus;
}

export interface Plan {
  id: string;
  goalTitle: string;
  targetAmount: number;
  currency: string;
  planCategory: string;
  timeframeCategory: string;
  frequency: string;
  startDate: string;
  recalculateOnMissedDeadline: boolean;
  totalSaved: number;
  remaining: number;
  progressPercent: number;
}

export interface PlanDetail extends Plan {
  durationInMonths: number;
  durationInYears: number;
  requiredPerPeriod: number;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanPayload {
  goalTitle?: string;
  targetAmount: number;
  currency: string;
  planCategory?: string;
  durationInMonths: number;
  durationInYears: number;
  timeframeCategory: string;
  frequency: string;
  requiredPerPeriod: number;
  startDate: string;
  userId?: string;
}

export interface UpdatePlanPayload {
  goalTitle?: string;
  targetAmount?: number;
  currency?: string;
  planCategory?: string;
  durationInMonths?: number;
  frequency?: string;
  status?: PlanStatus;
}

export interface AiGenerateCategoryItem {
  name: string;
  percentage: number;
  amount: number;
  note: string;
}

export interface AiGenerateResponse {
  totalBudget: number;
  currency: string;
  term: string;
  categories: AiGenerateCategoryItem[];
  aiAdvice: string;
}
