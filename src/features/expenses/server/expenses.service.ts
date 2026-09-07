import { env } from "@/config/env";
import type {
  ApiEnvelope,
  CreateExpenseCategoryPayload,
  CreateExpensePayload,
  Expense,
  ExpenseCategory,
  ListExpensesParams,
  Page,
  UpdateExpensePayload,
} from "@/features/expenses/types";

type BackendMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface BackendRequestOptions {
  method: BackendMethod;
  path: string;
  body?: unknown;
  accessToken: string;
}

export interface BackendApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

const EXPENSES_PATH = "/api/v1/expenses";
const CATEGORIES_PATH = "/api/v1/expense-categories";

async function requestPlanningBackend<T>(
  options: BackendRequestOptions,
): Promise<BackendApiResponse<T>> {
  if (!env.planningServiceBaseUrl) {
    return {
      ok: false,
      status: 500,
      data: { message: "Missing PLANNING_SERVICE_BASE_URL configuration" } as T,
    };
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${options.accessToken}`,
  };

  try {
    const response = await fetch(
      `${env.planningServiceBaseUrl}${options.path}`,
      {
        method: options.method,
        headers,
        ...(options.body !== undefined
          ? { body: JSON.stringify(options.body) }
          : {}),
      },
    );

    let data: T | null = null;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      data = (await response.json()) as T;
    }

    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 502,
      data: { message: "Cannot reach planning service" } as T,
    };
  }
}

function buildExpensesQuery(params: ListExpensesParams): string {
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.planId) search.set("planId", params.planId);
  if (params.type) search.set("type", params.type);
  if (params.categoryId) search.set("categoryId", params.categoryId);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.size !== undefined) search.set("size", String(params.size));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// ─── Expenses ──────────────────────────────────────────────────────────────

export async function listExpenses(
  params: ListExpensesParams,
  accessToken: string,
): Promise<Page<Expense> | null> {
  const result = await requestPlanningBackend<ApiEnvelope<Page<Expense>>>({
    method: "GET",
    path: `${EXPENSES_PATH}${buildExpensesQuery(params)}`,
    accessToken,
  });
  return result.data?.data ?? null;
}

export async function createExpense(
  payload: CreateExpensePayload,
  accessToken: string,
): Promise<Expense | null> {
  const result = await requestPlanningBackend<ApiEnvelope<Expense>>({
    method: "POST",
    path: EXPENSES_PATH,
    body: payload,
    accessToken,
  });
  return result.data?.data ?? null;
}

export async function updateExpense(
  id: string,
  payload: UpdateExpensePayload,
  accessToken: string,
): Promise<Expense | null> {
  const result = await requestPlanningBackend<ApiEnvelope<Expense>>({
    method: "PATCH",
    path: `${EXPENSES_PATH}/${id}`,
    body: payload,
    accessToken,
  });
  return result.data?.data ?? null;
}

export async function deleteExpense(
  id: string,
  accessToken: string,
): Promise<boolean> {
  const result = await requestPlanningBackend<ApiEnvelope<null>>({
    method: "DELETE",
    path: `${EXPENSES_PATH}/${id}`,
    accessToken,
  });
  return result.ok;
}

// ─── Categories ────────────────────────────────────────────────────────────

export async function listCategories(
  accessToken: string,
): Promise<ExpenseCategory[]> {
  const result = await requestPlanningBackend<ApiEnvelope<ExpenseCategory[]>>({
    method: "GET",
    path: CATEGORIES_PATH,
    accessToken,
  });
  return result.data?.data ?? [];
}

export async function createCategory(
  payload: CreateExpenseCategoryPayload,
  accessToken: string,
): Promise<BackendApiResponse<ApiEnvelope<ExpenseCategory>>> {
  return requestPlanningBackend<ApiEnvelope<ExpenseCategory>>({
    method: "POST",
    path: CATEGORIES_PATH,
    body: payload,
    accessToken,
  });
}
