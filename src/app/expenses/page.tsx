import {
  listCategories,
  listExpenses,
} from "@/features/expenses/server/expenses.facade";
import { getPlans } from "@/features/planning/server/planning.facade";
import { ExpensesContent } from "./expenses-content";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ planId?: string }>;
}

export default async function ExpensesPage({ searchParams }: Props) {
  const { planId } = await searchParams;

  const [categories, firstPage, plans] = await Promise.all([
    listCategories(),
    listExpenses({ page: 0, size: 20, ...(planId ? { planId } : {}) }),
    getPlans(),
  ]);

  return (
    <ExpensesContent
      initialCategories={categories}
      initialPage={firstPage}
      plans={plans}
      initialPlanId={planId ?? ""}
    />
  );
}
