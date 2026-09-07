export type ExpenseType = "FIXED" | "VARIABLE";
export type ExpenseSource = "MANUAL" | "CSV_IMPORT";

/** Standard FinTrack API envelope — mirrors core's {@code ApiResponse<T>}. */
export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T | null;
}

/** Mirrors core's {@code PageResponse<T>}. */
export interface Page<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  defaultType: ExpenseType;
  /** `true` for the six auto-seeded defaults, `false` for user-created ones. */
  isSystem: boolean;
}

export interface Expense {
  id: string;
  planId: string | null;
  categoryId: string;
  amount: number;
  currency: string;
  expenseType: ExpenseType;
  /** ISO date (`YYYY-MM-DD`). */
  spentOn: string;
  note: string | null;
  source: ExpenseSource;
}

export interface CreateExpensePayload {
  amount: number;
  currency: string;
  categoryId: string;
  /** ISO date (`YYYY-MM-DD`) — must not be in the future. */
  spentOn: string;
  note?: string;
  planId?: string;
}

/** PATCH semantics — every field optional, omitted means "leave unchanged". */
export interface UpdateExpensePayload {
  amount?: number;
  currency?: string;
  categoryId?: string;
  expenseType?: ExpenseType;
  spentOn?: string;
  note?: string;
  planId?: string;
}

export interface ListExpensesParams {
  /** ISO date — supply both `from` and `to`, or neither. Window ≤ 31 days. */
  from?: string;
  to?: string;
  planId?: string;
  type?: ExpenseType;
  categoryId?: string;
  page?: number;
  size?: number;
}

export interface CreateExpenseCategoryPayload {
  name: string;
  defaultType: ExpenseType;
}

export interface CreateCategoryResult {
  category: ExpenseCategory | null;
  error: string | null;
}
