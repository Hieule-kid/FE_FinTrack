import {
  getExpenseSummary,
  listCategories,
  listExpenses,
} from "@/features/expenses/server/expenses.facade";
import { ExpensesContent } from "./expenses-content";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  // The summary covers every expense matching the list's filters (all time by default), not just this page.
  // A failed summary degrades to `null` ("--") without breaking the list.
  const [categories, firstPage, summary] = await Promise.all([
    listCategories(),
    listExpenses({ page: 0, size: 20 }),
    getExpenseSummary({}).catch(() => null),
  ]);

  return (
    <ExpensesContent
      initialCategories={categories}
      initialPage={firstPage}
      initialSummary={summary}
    />
  );
}
