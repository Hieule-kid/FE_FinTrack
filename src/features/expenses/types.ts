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

export interface CreateExpensesPayload {
  expenses: CreateExpensePayload[];
}

/** Bulk-create response envelope — unlike the single-create endpoint, the BE nests the created list under `expenseResponses`. */
export interface CreateExpensesResult {
  expenseResponses: Expense[];
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
  /** ISO date — supply both `from` and `to`, or neither (neither = all time). No maximum span. */
  from?: string;
  to?: string;
  planId?: string;
  type?: ExpenseType;
  categoryId?: string;
  page?: number;
  size?: number;
}

/** Filters shared by the list and its summary (the summary has no paging or plan filter). */
export type ExpenseSummaryParams = Pick<
  ListExpensesParams,
  "from" | "to" | "type" | "categoryId"
>;

/** Spent / fixed / variable totals for ONE currency. Money is a decimal string (lossless). */
export interface ExpenseCurrencyTotals {
  currency: string;
  count: number;
  total: string;
  fixed: string;
  variable: string;
}

/**
 * Totals across ALL expenses matching the filters (independent of list paging), plus the filter the
 * server actually applied. `from`/`to` are null when no dates were sent (all time);
 * `type`/`categoryId` are null when unfiltered. One `totals` entry per
 * currency — never combined.
 */
export interface ExpenseSummary {
  from: string | null;
  to: string | null;
  type: ExpenseType | null;
  categoryId: string | null;
  totals: ExpenseCurrencyTotals[];
}

export interface CreateExpenseCategoryPayload {
  name: string;
  defaultType: ExpenseType;
}

export interface CreateCategoryResult {
  category: ExpenseCategory | null;
  error: string | null;
}
