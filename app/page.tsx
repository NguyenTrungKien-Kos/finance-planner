import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Receipt,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { convertFromVnd, fetchExchangeRates } from "@/lib/exchange-rates";
import { syncRecurringTransactions } from "@/lib/recurring-sync";
import { BudgetAlertNotifier } from "@/components/budget-alert-notifier";
import { BudgetSection } from "@/components/budget-section";
import { CategoryIconBadge } from "@/components/category-icon";
import { CurrencyConverterCard } from "@/components/currency-converter-card";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
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
import { TransactionCsvControls } from "@/components/transaction-csv-controls";
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

const QUICK_PILLS = [
  { id: "overview", label: "Tổng quan", active: true },
  { id: "analytics", label: "Phân tích", active: false },
  { id: "budgets", label: "Ngân sách", active: false },
  { id: "wishlist", label: "Wishlist", active: false },
  { id: "recurring", label: "Định kỳ", active: false },
  { id: "converter", label: "Quy đổi", active: false },
  { id: "transactions", label: "Giao dịch", active: false },
] as const;

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

function getGreeting(hour: number): string {
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
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
  const greeting = getGreeting(now.getHours());

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

  const overallUsd = convertFromVnd(overallBalance, "USD", exchangeRates);
  const overallEur = convertFromVnd(overallBalance, "EUR", exchangeRates);
  const activeRecurringCount = recurringTransactions.filter(
    (item) => item.isActive
  ).length;
  const expenseRatio =
    totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : null;
  const periodLabel =
    period === "this_month"
      ? "Tháng này"
      : period === "last_month"
        ? "Tháng trước"
        : "Tất cả thời gian";

  return (
    <div className="space-y-6">
      <BudgetAlertNotifier userId={user.id} statuses={budgetStatuses} />

      {/* Tiêu đề chào mừng kiểu Finova */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}, {user.name} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi, quản lý và thấu hiểu tài chính cá nhân của bạn dễ dàng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="outline" className="h-8 px-3 text-xs">
            Kỳ lọc: {periodLabel}
          </Badge>
          <div className="hidden lg:block">
            <TransactionDialog mode="create" />
          </div>
        </div>
      </div>

      {/* Dải pill điều hướng nhanh kiểu Finova */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {QUICK_PILLS.map((pill) => (
          <a
            key={pill.id}
            href={`#${pill.id}`}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              pill.active
                ? "bg-foreground text-background shadow-xs"
                : "bg-card text-muted-foreground ring-1 ring-border/80 hover:text-foreground"
            }`}
          >
            {pill.label}
          </a>
        ))}
      </div>

      {/* Hàng 1: 3 thẻ KPI (trái) + Biểu đồ cột Analytics (phải) */}
      <section
        id="overview"
        aria-label="Thống kê tài chính"
        className="grid items-stretch gap-5 lg:grid-cols-12"
      >
        <div className="flex flex-col justify-between gap-4 lg:col-span-4">
          <Card className="p-0">
            <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3.5">
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/12 text-primary"
                >
                  <Wallet className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Số dư hiện tại
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
                    {formatVND(balance)}
                  </p>
                </div>
              </div>
              <Badge variant={balance >= 0 ? "success" : "destructive"}>
                {balance >= 0 ? "Dương" : "Âm"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3.5">
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                >
                  <ArrowDownLeft className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Tổng thu
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xl font-bold tracking-tight text-emerald-600 tabular-nums sm:text-2xl dark:text-emerald-400">
                    {formatVND(totalIncome)}
                  </p>
                </div>
              </div>
              <Badge variant="success">Thu nhập</Badge>
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3.5">
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-600 dark:text-rose-400"
                >
                  <ArrowUpRight className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Tổng chi
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xl font-bold tracking-tight text-rose-600 tabular-nums sm:text-2xl dark:text-rose-400">
                    {formatVND(totalExpense)}
                  </p>
                </div>
              </div>
              <Badge variant="destructive">
                {expenseRatio !== null ? `${expenseRatio}% thu` : "Chi tiêu"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div id="analytics" className="lg:col-span-8">
          <MonthlyComparisonChart
            data={monthlyComparison}
            trend={spendingTrend}
          />
        </div>
      </section>

      {/* Hàng 2: Thẻ Ví tổng quan gradient Indigo (trái) + Biểu đồ Donut (phải) */}
      <div className="grid items-stretch gap-5 lg:grid-cols-12">
        <Card className="justify-between lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-xl bg-primary/12 text-primary"
              >
                <CreditCard className="size-4" />
              </span>
              <CardTitle>Ví tổng quan</CardTitle>
            </div>
            <Badge variant="success">Đang hoạt động</Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="fp-virtual-card relative overflow-hidden rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20">
              <div
                aria-hidden="true"
                className="absolute -top-10 -right-10 size-36 rounded-full bg-white/12"
              />
              <div
                aria-hidden="true"
                className="absolute -right-2 -bottom-12 size-28 rounded-full bg-white/10"
              />

              <div className="relative flex items-center justify-between text-xs font-medium text-indigo-100">
                <span>Số dư tích lũy (Tất cả)</span>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 font-semibold tracking-wide">
                  VND
                </span>
              </div>

              <p className="relative mt-3 font-mono text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                {formatVND(overallBalance)}
              </p>

              <div className="relative mt-6 flex items-end justify-between gap-2 text-xs">
                <div>
                  <p className="text-indigo-100/80">Chủ ví</p>
                  <p className="mt-0.5 font-semibold text-white">
                    {user.name}
                  </p>
                </div>
                <div className="text-right font-mono text-indigo-100">
                  <p>≈ ${overallUsd.toLocaleString("en-US")}</p>
                  <p>≈ €{overallEur.toLocaleString("en-US")}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <a
                href="#wishlist"
                className="rounded-xl border border-border/75 bg-muted/35 p-3 transition-colors hover:bg-muted/60"
              >
                <p className="text-muted-foreground">Mục tiêu Wishlist</p>
                <p className="mt-1 text-base font-bold">
                  {wishlistItems.length} mục tiêu
                </p>
              </a>
              <a
                href="#recurring"
                className="rounded-xl border border-border/75 bg-muted/35 p-3 transition-colors hover:bg-muted/60"
              >
                <p className="text-muted-foreground">Mẫu định kỳ bật</p>
                <p className="mt-1 text-base font-bold">
                  {activeRecurringCount} mẫu
                </p>
              </a>
            </div>
          </CardContent>
        </Card>

        <div id="expense-breakdown" className="lg:col-span-8">
          <ExpensePieChart data={expenseBreakdown} />
        </div>
      </div>

      {/* Hàng 3: Ngân sách & Wishlist */}
      <div className="grid items-start gap-5 lg:grid-cols-12">
        <div id="budgets" className="lg:col-span-7">
          <BudgetSection
            month={currentMonth}
            year={currentYear}
            statuses={budgetStatuses}
          />
        </div>
        <div id="wishlist" className="lg:col-span-5">
          <WishlistSection
            userId={user.id}
            items={wishlistItems}
            balance={overallBalance}
          />
        </div>
      </div>

      {/* Hàng 4: Quy đổi ngoại tệ & Giao dịch định kỳ */}
      <div className="grid items-start gap-5 lg:grid-cols-12">
        <div id="converter" className="lg:col-span-6">
          <CurrencyConverterCard
            balanceVnd={overallBalance}
            rates={exchangeRates}
          />
        </div>
        <div id="recurring" className="lg:col-span-6">
          <RecurringSection items={recurringTransactions} />
        </div>
      </div>

      {/* Hàng 5: Lịch sử giao dịch kiểu Cuan */}
      <section id="transactions">
        <Card>
          <CardHeader className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
                >
                  <Receipt className="size-4" />
                </span>
                <div>
                  <CardTitle>
                    Lịch sử giao dịch ({transactions.length} mục)
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Tìm kiếm theo bộ lọc thời gian, loại thu/chi hoặc danh mục
                  </p>
                </div>
              </div>
              <TransactionCsvControls
                period={period}
                type={validType ?? "ALL"}
                category={validCategory ?? "ALL"}
              />
            </div>

            <TransactionFilters
              period={period}
              type={validType ?? "ALL"}
              category={validCategory ?? "ALL"}
            />
          </CardHeader>

          <CardContent>
            {transactions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                Chưa có giao dịch nào khớp bộ lọc.
              </p>
            ) : (
              <>
                {/* Giao diện thẻ gọn cho điện thoại */}
                <div className="space-y-3 md:hidden">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="space-y-2.5 rounded-2xl border border-border/75 bg-card p-3.5 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <CategoryIconBadge category={tx.category} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {tx.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(tx.date)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 font-mono font-semibold tabular-nums ${
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
                              tx.type === "INCOME" ? "success" : "secondary"
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
                        <TableHead>Giao dịch</TableHead>
                        <TableHead>Danh mục</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-3">
                              <CategoryIconBadge
                                category={tx.category}
                                size="sm"
                              />
                              <span className="max-w-[260px] truncate">
                                {tx.description}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {CATEGORY_LABELS[tx.category] ?? tx.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tx.type === "INCOME" ? "success" : "secondary"
                              }
                            >
                              {tx.type === "INCOME" ? "Thu" : "Chi"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatDate(tx.date)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono font-semibold whitespace-nowrap tabular-nums ${
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
      </section>
    </div>
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
  return <UserNav name={user.name} email={user.email} variant="sidebar" />;
}

function SidebarUserSkeleton() {
  return (
    <div className="h-20 animate-pulse rounded-xl bg-white/[0.06]" />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải dữ liệu">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-xl bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="hidden h-9 w-36 animate-pulse rounded-xl bg-muted lg:block" />
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <div className="h-24 animate-pulse rounded-2xl bg-card ring-1 ring-border/70" />
          <div className="h-24 animate-pulse rounded-2xl bg-card ring-1 ring-border/70" />
          <div className="h-24 animate-pulse rounded-2xl bg-card ring-1 ring-border/70" />
        </div>
        <div className="h-[320px] animate-pulse rounded-2xl bg-card ring-1 ring-border/70 lg:col-span-8" />
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="h-72 animate-pulse rounded-2xl bg-card ring-1 ring-border/70 lg:col-span-4" />
        <div className="h-72 animate-pulse rounded-2xl bg-card ring-1 ring-border/70 lg:col-span-8" />
      </div>
    </div>
  );
}

export default function HomePage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  return (
    <DashboardSidebar
      headerAction={<TransactionDialog mode="create" />}
      userSlot={
        <Suspense fallback={<SidebarUserSkeleton />}>
          <HeaderUser />
        </Suspense>
      }
    >
      <main className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent searchParams={searchParams} />
        </Suspense>
      </main>
    </DashboardSidebar>
  );
}