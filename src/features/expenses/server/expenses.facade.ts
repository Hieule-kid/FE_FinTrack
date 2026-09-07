"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { authCookies } from "@/config/cookies";
import type {
  CreateCategoryResult,
  CreateExpenseCategoryPayload,
  CreateExpensePayload,
  Expense,
  ExpenseCategory,
  ListExpensesParams,
  Page,
  UpdateExpensePayload,
} from "@/features/expenses/types";
import * as expensesService from "./expenses.service";

async function getToken(): Promise<string> {
  const jar = await cookies();
  return jar.get(authCookies.accessToken)?.value ?? "";
}

export async function listExpenses(
  params: ListExpensesParams,
): Promise<Page<Expense> | null> {
  return expensesService.listExpenses(params, await getToken());
}

export async function createExpense(
  payload: CreateExpensePayload,
): Promise<Expense | null> {
  const expense = await expensesService.createExpense(
    payload,
    await getToken(),
  );
  if (expense) revalidatePath("/expenses");
  return expense;
}

export async function updateExpense(
  id: string,
  payload: UpdateExpensePayload,
): Promise<Expense | null> {
  const expense = await expensesService.updateExpense(
    id,
    payload,
    await getToken(),
  );
  if (expense) revalidatePath("/expenses");
  return expense;
}

export async function deleteExpense(id: string): Promise<boolean> {
  const ok = await expensesService.deleteExpense(id, await getToken());
  if (ok) revalidatePath("/expenses");
  return ok;
}

export async function listCategories(): Promise<ExpenseCategory[]> {
  return expensesService.listCategories(await getToken());
}

export async function createCategory(
  payload: CreateExpenseCategoryPayload,
): Promise<CreateCategoryResult> {
  const result = await expensesService.createCategory(
    payload,
    await getToken(),
  );
  if (result.ok && result.data?.data) {
    revalidatePath("/expenses");
    return { category: result.data.data, error: null };
  }
  return {
    category: null,
    error:
      result.data?.message ?? "Failed to create category. Please try again.",
  };
}
