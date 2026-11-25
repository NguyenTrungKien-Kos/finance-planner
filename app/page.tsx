import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fetchExchangeRates } from "@/lib/exchange-rates";
import { syncRecurringTransactions } from "@/lib/recurring-sync";
import { BudgetAlertNotifier } from "@/components/budget-alert-notifier";
import { BudgetSection } from "@/components/budget-section";
import { CurrencyConverterCard } from "@/components/currency-converter-card";
import { MonthlyComparisonChart } from "@/components/monthly-comparison-chart";
import { RecurringSection } from "@/components/recurring-section";
import { requireUser, UnauthorizedError } from "@/lib/dal";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  TRANSACTION_TYPES,
} from "@/lib/constants";
import {
  calculateBudgetStatuses,
  calculateSummary,
  getCategoryExpenseBreakdown,
  getDateRange,
  getMonthlyComparison,
  getSpendingTrend,
} from "@/lib/finance";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { ExpensePieChart } from "@/components/expense-pie-chart";
import { ThemeToggle } from "@/components/theme-toggle";
import { TransactionDialog } from "@/components/transaction-dialog";
import { TransactionFilters } from "@/components/transaction-filters";
import { UserNav } from "@/components/user-nav";
import { WishlistSection } from "@/components/wishlist-section";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SearchParamsPromise = Promise<
  Record<string, string | string[] | undefined>
>;

function pickSingle(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  await connection();

  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw err;
  }

  const params = await searchParams;

  const rawPeriod = pickSingle(params.period);
  const period =
    rawPeriod === "this_month" || rawPeriod === "last_month"
      ? rawPeriod
      : "all";

  const rawType = pickSingle(params.type);
  const validType = TRANSACTION_TYPES.includes(
    rawType as (typeof TRANSACTION_TYPES)[number]
  )
    ? (rawType as (typeof TRANSACTION_TYPES)[number])
    : undefined;

  const rawCategory = pickSingle(params.category);
  const validCategory = CATEGORIES.includes(
    rawCategory as (typeof CATEGORIES)[number]
  )
    ? (rawCategory as (typeof CATEGORIES)[number])
    : undefined;

  const dateRange = getDateRange(period);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  await syncRecurringTransactions(user.id, now);

  const [
    transactions,
    allTransactions,
    wishlistItems,
    categoryBudgets,
    recurringTransactions,
    exchangeRates,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        ...(validType ? { type: validType } : {}),
        ...(validCategory ? { category: validCategory } : {}),
        ...(dateRange ? { date: dateRange } : {}),
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      select: { type: true, amount: true, category: true, date: true },
    }),
    prisma.wishlistItem.findMany({
      where: { userId: user.id },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    }),
    prisma.categoryBudget.findMany({
      where: {
        userId: user.id,
        month: currentMonth,
        year: currentYear,
      },
      orderBy: { category: "asc" },
    }),
    prisma.recurringTransaction.findMany({
      where: { userId: user.id },
      orderBy: [{ isActive: "desc" }, { dayOfMonth: "asc" }],
    }),
    fetchExchangeRates(),
  ]);

  const { totalIncome, totalExpense, balance } = calculateSummary(transactions);
  const { balance: overallBalance } = calculateSummary(allTransactions);

  const thisMonthRange = getDateRange("this_month")!;
  const thisMonthExpenses = allTransactions.filter(
    (tx) =>
      tx.type === "EXPENSE" &&
      tx.date >= thisMonthRange.gte &&
      tx.date < thisMonthRange.lt
  );
  const expenseBreakdown = getCategoryExpenseBreakdown(thisMonthExpenses);
  const monthlyComparison = getMonthlyComparison(allTransactions, 6);
  const spendingTrend = getSpendingTrend(monthlyComparison);
  const budgetStatuses = calculateBudgetStatuses(
    categoryBudgets,
    allTransactions
  );

  return (
    <>
      <BudgetAlertNotifier userId={user.id} statuses={budgetStatuses} />

      <section
        aria-label="Thống kê tài chính"
        className="grid gap-4 sm:grid-cols-3"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Số dư hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatVND(balance)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatVND(totalIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng chi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatVND(totalExpense)}
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ExpensePieChart data={expenseBreakdown} />
        <WishlistSection
          userId={user.id}
          items={wishlistItems}
          balance={overallBalance}
        />
      </div>

      <BudgetSection
        month={currentMonth}
        year={currentYear}
        statuses={budgetStatuses}
      />

      <RecurringSection items={recurringTransactions} />

      <MonthlyComparisonChart
        data={monthlyComparison}
        trend={spendingTrend}
      />

      <CurrencyConverterCard
        balanceVnd={overallBalance}
        rates={exchangeRates}
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            Lịch sử giao dịch ({transactions.length} mục)
          </CardTitle>
          <TransactionFilters
            period={period}
            type={validType ?? "ALL"}
            category={validCategory ?? "ALL"}
          />
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có giao dịch nào khớp bộ lọc.
            </p>
          ) : (
            <>
              {/* Giao diện thẻ gọn cho điện thoại (không cần cuộn ngang) */}
              <div className="space-y-3 md:hidden">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="space-y-2 rounded-lg border p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.date)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 font-mono font-semibold ${
                          tx.type === "INCOME"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}
                        {formatVND(tx.amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline">
                          {CATEGORY_LABELS[tx.category] ?? tx.category}
                        </Badge>
                        <Badge
                          variant={
                            tx.type === "INCOME" ? "default" : "secondary"
                          }
                        >
                          {tx.type === "INCOME" ? "Thu" : "Chi"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <TransactionDialog
                          mode="edit"
                          transaction={{
                            id: tx.id,
                            amount: tx.amount,
                            description: tx.description,
                            type: tx.type,
                            category: tx.category,
                            date: formatDateInput(tx.date),
                          }}
                        />
                        <DeleteTransactionButton
                          id={tx.id}
                          description={tx.description}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Giao diện bảng cho tablet / máy tính */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(tx.date)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {tx.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CATEGORY_LABELS[tx.category] ?? tx.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              tx.type === "INCOME" ? "default" : "secondary"
                            }
                          >
                            {tx.type === "INCOME" ? "Thu" : "Chi"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono font-medium whitespace-nowrap ${
                            tx.type === "INCOME"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {tx.type === "INCOME" ? "+" : "-"}
                          {formatVND(tx.amount)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <TransactionDialog
                              mode="edit"
                              transaction={{
                                id: tx.id,
                                amount: tx.amount,
                                description: tx.description,
                                type: tx.type,
                                category: tx.category,
                                date: formatDateInput(tx.date),
                              }}
                            />
                            <DeleteTransactionButton
                              id={tx.id}
                              description={tx.description}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

async function HeaderUser() {
  await connection();
  let user: { name: string; email: string } | null = null;
  try {
    user = await requireUser();
  } catch {
    return null;
  }
  return <UserNav name={user.name} email={user.email} />;
}

export default function HomePage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 overflow-x-hidden px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance Planner</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thu chi cá nhân
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TransactionDialog mode="create" />
          <ThemeToggle />
          <Suspense fallback={null}>
            <HeaderUser />
          </Suspense>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">
            Đang tải dữ liệu giao dịch...
          </div>
        }
      >
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}