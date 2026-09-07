import {
  listCategories,
  listExpenses,
} from "@/features/expenses/server/expenses.facade";
import { ExpensesContent } from "./expenses-content";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const [categories, firstPage] = await Promise.all([
    listCategories(),
    listExpenses({ page: 0, size: 20 }),
  ]);

  return (
    <ExpensesContent initialCategories={categories} initialPage={firstPage} />
  );
}
