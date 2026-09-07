"use client";

import { useCallback, useMemo, useState } from "react";
import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { Typography } from "@/components/ui/typography";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { CategoryManagerModal } from "@/features/expenses/components/category-manager-modal";
import { DeleteExpenseButton } from "@/features/expenses/components/delete-expense-button";
import { ExpenseFormModal } from "@/features/expenses/components/expense-form-modal";
import { listExpenses } from "@/features/expenses/server/expenses.facade";
import type {
  Expense,
  ExpenseCategory,
  ExpenseType,
  ListExpensesParams,
  Page,
} from "@/features/expenses/types";

const PAGE_SIZE = 20;
/** Backend rejects a window whose endpoints are 31+ days apart (DateRange.resolve). */
const MAX_DAYS_BETWEEN = 30;

function formatCurrency(value: number, currency = "USD") {
  try {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  } catch {
    return `${value.toLocaleString("en-US")} ${currency}`;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  );
}

const typeBadge: Record<ExpenseType, { label: string; className: string }> = {
  FIXED: { label: "Fixed", className: "bg-[#e8f0ff] text-[var(--brand)]" },
  VARIABLE: { label: "Variable", className: "bg-[#fef3e0] text-[var(--warn)]" },
};

interface ExpensesContentProps {
  initialCategories: ExpenseCategory[];
  initialPage: Page<Expense> | null;
}

export function ExpensesContent({
  initialCategories,
  initialPage,
}: ExpensesContentProps) {
  const { profile } = useProfile();
  const defaultCurrency = profile?.currency ?? "USD";

  const [categories, setCategories] =
    useState<ExpenseCategory[]>(initialCategories);
  const [pageData, setPageData] = useState<Page<Expense> | null>(initialPage);
  const [expenses, setExpenses] = useState<Expense[]>(
    initialPage?.content ?? [],
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");

  // Filters
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<ExpenseType | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const categoryName = useCallback(
    (id: string) => categories.find((c) => c.id === id)?.name ?? "Unknown",
    [categories],
  );

  const dateRangeError = useMemo(() => {
    if (!from && !to) return "";
    if (Boolean(from) !== Boolean(to))
      return "Set both dates, or leave both empty.";
    if (to < from) return "End date must not be before the start date.";
    if (daysBetween(from, to) > MAX_DAYS_BETWEEN)
      return `The window must not exceed ${MAX_DAYS_BETWEEN + 1} days.`;
    return "";
  }, [from, to]);

  const fetchPage = useCallback(
    async (nextPageIndex: number) => {
      if (dateRangeError) return;
      setLoading(true);
      setListError("");
      const params: ListExpensesParams = {
        page: nextPageIndex,
        size: PAGE_SIZE,
        ...(from && to ? { from, to } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
      };
      try {
        const result = await listExpenses(params);
        if (!result) {
          setListError("Couldn't load expenses. Please try again.");
          return;
        }
        setPageData(result);
        setExpenses(result.content);
        setPageIndex(nextPageIndex);
      } catch {
        setListError("Couldn't load expenses. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [dateRangeError, from, to, typeFilter, categoryFilter],
  );

  const windowTotals = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const fixed = expenses
      .filter((e) => e.expenseType === "FIXED")
      .reduce((sum, e) => sum + e.amount, 0);
    return { total, fixed, variable: total - fixed };
  }, [expenses]);

  const listCurrency = expenses[0]?.currency ?? defaultCurrency;

  function handleSaved(saved: Expense) {
    setExpenses((prev) => {
      const exists = prev.some((e) => e.id === saved.id);
      return exists
        ? prev.map((e) => (e.id === saved.id ? saved : e))
        : [saved, ...prev];
    });
  }

  function handleDeleted(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function handleCategoryCreated(category: ExpenseCategory) {
    setCategories((prev) => [...prev, category]);
  }

  const totalPages = pageData?.totalPages ?? 1;

  return (
    <PageContainer className="grid gap-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Typography as="h1" variant="h1">
            Expenses
          </Typography>
          <Typography variant="muted" className="mt-1">
            Record spending and review it over a date window
          </Typography>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            variant="secondary"
            onClick={() => setCategoryModalOpen(true)}
          >
            Manage categories
          </Button>
          <Button
            icon={<Typography as="span">+</Typography>}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Record expense
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <StatCard
          label="Spent (this view)"
          value={formatCurrency(windowTotals.total, listCurrency)}
          icon={<Icon type="wallet" size={22} />}
          variant="blue"
        />
        <StatCard
          label="Fixed"
          value={formatCurrency(windowTotals.fixed, listCurrency)}
          icon={<Icon type="anchor" size={22} />}
          variant="green"
        />
        <StatCard
          label="Variable"
          value={formatCurrency(windowTotals.variable, listCurrency)}
          icon={<Icon type="wave" size={22} />}
          variant="amber"
        />
      </div>

      {/* Filters */}
      <div className="border border-(--line) rounded-2xl bg-white p-4 grid gap-3 sm:grid-cols-[repeat(4,1fr)_auto] sm:items-end">
        <Input
          id="filter-from"
          label="From"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          id="filter-to"
          label="To"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => setTo(e.target.value)}
        />
        <Select
          id="filter-type"
          label="Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ExpenseType | "")}
          options={[
            { label: "All types", value: "" },
            { label: "Fixed", value: "FIXED" },
            { label: "Variable", value: "VARIABLE" },
          ]}
        />
        <Select
          id="filter-category"
          label="Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { label: "All categories", value: "" },
            ...categories.map((c) => ({ label: c.name, value: c.id })),
          ]}
        />
        <Button
          variant="secondary"
          disabled={loading || Boolean(dateRangeError)}
          onClick={() => fetchPage(0)}
        >
          {loading ? "Loading…" : "Apply"}
        </Button>
      </div>
      {dateRangeError && (
        <Typography variant="body-sm" className="text-[#9b1c1c] -mt-2">
          {dateRangeError}
        </Typography>
      )}
      {listError && (
        <Typography variant="body-sm" className="text-[#9b1c1c] -mt-2">
          {listError}
        </Typography>
      )}

      {/* Table */}
      <div className="border border-(--line) rounded-2xl bg-white shadow-[0_8px_28px_rgba(17,38,99,0.06)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-(--line)">
              {["Date", "Category", "Type", "Note", "Amount", ""].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-left text-xs font-semibold text-(--muted) whitespace-nowrap last:text-right"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--line)">
            {expenses.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-(--muted)"
                >
                  No expenses in this view.
                </td>
              </tr>
            ) : (
              expenses.map((e) => {
                const badge = typeBadge[e.expenseType];
                return (
                  <tr
                    key={e.id}
                    className="hover:bg-[#f8faff] transition-colors"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap font-medium">
                      {formatDate(e.spentOn)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {categoryName(e.categoryId)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Typography
                        as="span"
                        variant="caption"
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}
                      >
                        {badge.label}
                      </Typography>
                    </td>
                    <td className="px-5 py-3.5 max-w-55 truncate text-(--muted)">
                      {e.note || "—"}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-semibold">
                      {formatCurrency(e.amount, e.currency)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(e);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <DeleteExpenseButton
                          expenseId={e.id}
                          label={`${categoryName(e.categoryId)} · ${formatCurrency(
                            e.amount,
                            e.currency,
                          )}`}
                          onDeleted={handleDeleted}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Typography as="span" variant="muted">
            Page {pageIndex + 1} of {totalPages}
          </Typography>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={loading || pageIndex === 0}
              onClick={() => fetchPage(pageIndex - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={loading || pageIndex + 1 >= totalPages}
              onClick={() => fetchPage(pageIndex + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {formOpen && (
        <ExpenseFormModal
          key={editing?.id ?? "new"}
          expense={editing}
          categories={categories}
          defaultCurrency={defaultCurrency}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
      {categoryModalOpen && (
        <CategoryManagerModal
          categories={categories}
          onClose={() => setCategoryModalOpen(false)}
          onCreated={handleCategoryCreated}
        />
      )}
    </PageContainer>
  );
}
